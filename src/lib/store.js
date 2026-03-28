/* store.js – Data persistence (Firebase Realtime Database) */
import { METERS, LITRES_COLUMNS, calcConsumption, calcLitres, daysInMonth, fmtDate, prevMonthLastDay } from './calculations.js';
import { db, ref, get, set, onValue } from './firebase.js';

// In-memory cache (populated from Firebase on init)
let _readings = {};
let _settings = { pin: '1234' };
let _backups = {};
let _onDataChange = null;

// Theme is per-device preference (localStorage)
const THEME_KEY = 'kudineer_theme';

// ---- Initialization (called once on app start) ----
export async function initStore(onDataChange) {
  _onDataChange = onDataChange;

  // Fetch all data from Firebase
  const [rSnap, sSnap, bSnap] = await Promise.all([
    get(ref(db, 'readings')),
    get(ref(db, 'settings')),
    get(ref(db, 'backups'))
  ]);

  _readings = rSnap.val() || {};
  _settings = sSnap.val() || { pin: '1234' };
  _backups = bSnap.val() || {};

  // Purge future dates
  deleteFutureData();

  // Real-time sync: when another device saves, update our cache and refresh UI
  onValue(ref(db, 'readings'), (snap) => {
    _readings = snap.val() || {};
    if (_onDataChange) _onDataChange();
  });

  onValue(ref(db, 'settings'), (snap) => {
    const s = snap.val();
    if (s) _settings = s;
  });

  onValue(ref(db, 'backups'), (snap) => {
    _backups = snap.val() || {};
  });
}

// ---- Settings ----
export function getSettings() {
  const theme = localStorage.getItem(THEME_KEY) || 'dark';
  return { ...(_settings || {}), pin: _settings?.pin || '1234', theme };
}

export function saveSettings(s) {
  const { theme, ...cloud } = s;
  localStorage.setItem(THEME_KEY, theme);
  _settings = cloud;
  set(ref(db, 'settings'), cloud);
}

// ---- Readings (synchronous reads from cache, async writes to Firebase) ----
function load() { return _readings; }

function save(d) {
  _readings = d;
  set(ref(db, 'readings'), d);
}

export function saveAllReadings(dateStr, readings) {
  autoBackup();
  const d = load();
  for (const [mid, v] of Object.entries(readings)) {
    if (v != null && v !== '' && !isNaN(v)) { if (!d[mid]) d[mid] = {}; d[mid][dateStr] = Number(v); }
  }
  save(d);
}

// ---- Backups (last 3 calendar days, stored in Firebase) ----
function autoBackup() {
  const d = load();
  if (Object.keys(d).length === 0) return;
  const todayStr = new Date().toISOString().substring(0, 10);

  // Store today's snapshot (overwrite if exists for today)
  _backups[todayStr] = JSON.parse(JSON.stringify(d));

  // Keep only last 3 calendar days
  const keys = Object.keys(_backups).sort();
  while (keys.length > 3) {
    delete _backups[keys.shift()];
  }

  set(ref(db, 'backups'), _backups);
}

export function getAutoBackups() { return _backups; }

export function restoreBackup(dateKey) {
  const backup = _backups[dateKey];
  if (!backup) throw new Error('Backup not found');
  _readings = JSON.parse(JSON.stringify(backup));
  set(ref(db, 'readings'), _readings);
}

// ---- Reading accessors ----
export function getReading(dateStr, mid) { const d = load(); return d[mid]?.[dateStr] ?? null; }

export function getPreviousReading(dateStr, mid) {
  const d = load(); if (!d[mid]) return null;
  const dates = Object.keys(d[mid]).sort();
  for (let i = dates.length - 1; i >= 0; i--) { if (dates[i] < dateStr) return d[mid][dates[i]]; }
  return null;
}

// ---- Meter change detection (spike/reset) ----
// Computes the average normal daily delta for a meter across all data.
// Excludes anomalous deltas (meter changes) using median-based filtering.
function getAverageDelta(meterId) {
  const d = load();
  if (!d[meterId]) return null;
  const dates = Object.keys(d[meterId]).sort();
  if (dates.length < 3) return null;

  const deltas = [];
  for (let i = 1; i < dates.length; i++) {
    const delta = d[meterId][dates[i]] - d[meterId][dates[i - 1]];
    if (delta > 0) deltas.push(delta);
  }
  if (deltas.length < 2) return null;

  // Use median to robustly identify normal range
  const sorted = [...deltas].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  // Keep only normal deltas (within 3x median)
  const normal = deltas.filter(d => d <= median * 3);
  if (normal.length === 0) return median;
  return normal.reduce((s, v) => s + v, 0) / normal.length;
}

// ---- Monthly / Yearly tables ----
export function getMonthlyTable(month, year) {
  const days = daysInMonth(month, year), bDate = prevMonthLastDay(month, year);
  const rows = [], totals = {}, counts = {};
  LITRES_COLUMNS.forEach(c => { totals[c.id] = 0; counts[c.id] = 0; });

  const ALL_MLD_IDS = [...METERS.map(m => m.id), 'cwss138_sump'];

  // Pre-compute average deltas for meter change detection
  const avgDeltas = {};
  METERS.forEach(m => { avgDeltas[m.id] = getAverageDelta(m.id); });

  // Baseline row (row 0) — previous month's last day
  const r0 = { sno: 0, date: bDate, isBase: true, mld: {}, litres: {} };
  ALL_MLD_IDS.forEach(id => { r0.mld[id] = getReading(bDate, id); });
  LITRES_COLUMNS.forEach(c => { r0.litres[c.id] = null; });
  rows.push(r0);

  // Day rows
  for (let d = 1; d <= days; d++) {
    const ds = fmtDate(new Date(year, month, d));
    const row = { sno: d, date: ds, isBase: false, mld: {}, litres: {} };

    ALL_MLD_IDS.forEach(id => { row.mld[id] = getReading(ds, id); });

    // Calculate raw litres for each meter (consumption * 1000)
    // With meter change detection: if delta is negative (reset) or
    // exceeds 3x the average delta (meter replaced), use average delta instead
    LITRES_COLUMNS.forEach(c => {
      if (c.id === 'cwss138_sump') return;
      const curMLD = row.mld[c.id];
      let prevMLD = null;
      for (let p = rows.length - 1; p >= 0; p--) {
        if (rows[p].mld[c.id] != null) { prevMLD = rows[p].mld[c.id]; break; }
      }

      if (curMLD != null && prevMLD != null) {
        const delta = curMLD - prevMLD;
        const avg = avgDeltas[c.id];
        if (avg != null && (delta < 0 || delta > avg * 3)) {
          // Meter change detected — use average delta
          row.litres[c.id] = calcLitres(avg);
        } else {
          row.litres[c.id] = calcLitres(calcConsumption(curMLD, prevMLD));
        }
      } else {
        row.litres[c.id] = calcLitres(calcConsumption(curMLD, prevMLD));
      }
    });

    // CWSS-138 derived columns:
    // C&EK = MAIN litres - raw MGP C&EK litres
    const mainLit = row.litres['cwss138_main'];
    const cekRawLit = row.litres['cwss138_mgp_cek'];
    if (mainLit != null && cekRawLit != null) {
      row.litres['cwss138_mgp_cek'] = Math.max(0, mainLit - cekRawLit);
    }

    // MGP stays as-is (raw litres)
    // SUMP = MAIN - C&EK(derived) - MGP
    const m138 = row.litres['cwss138_main'] || 0;
    const cek138 = row.litres['cwss138_mgp_cek'] || 0;
    const mgp138 = row.litres['cwss138_mgp'] || 0;
    const sumpVal = (row.litres['cwss138_main'] != null) ? Math.max(0, m138 - cek138 - mgp138) : null;
    row.litres['cwss138_sump'] = sumpVal;

    LITRES_COLUMNS.forEach(c => {
      const lit = row.litres[c.id];
      if (lit != null) totals[c.id] += lit;
    });

    rows.push(row);
  }

  rows.push({ sno: null, date: null, isTotal: true, litres: Object.fromEntries(LITRES_COLUMNS.map(c => [c.id, totals[c.id] || 0])) });

  const now = new Date();
  let daysToDivide = days;
  if (year === now.getFullYear() && month === now.getMonth()) daysToDivide = now.getDate();
  else if (year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth())) daysToDivide = 0;

  rows.push({ sno: null, date: null, isAvg: true, litres: Object.fromEntries(LITRES_COLUMNS.map(c => [c.id, (totals[c.id] > 0 && daysToDivide > 0) ? Math.round(totals[c.id] / daysToDivide) : null])) });
  return rows;
}

export function getYearlySummary(year) {
  return Array.from({ length: 12 }, (_, m) => {
    const tbl = getMonthlyTable(m, year);
    const tr = tbl.find(r => r.isTotal), ar = tbl.find(r => r.isAvg);
    return { month: m, totals: tr ? { ...tr.litres } : {}, averages: ar ? { ...ar.litres } : {} };
  });
}

// ---- CSV Export / Import ----
export function exportCSV() {
  const d = load();
  const hdr = ['Date', ...METERS.map(m => `${m.scheme} ${m.name}`)];
  let csv = hdr.join(',') + '\n';

  const dateSet = new Set();
  for (const mid of METERS.map(m => m.id)) {
    if (d[mid]) Object.keys(d[mid]).forEach(dt => dateSet.add(dt));
  }
  const dates = [...dateSet].sort();

  for (const dt of dates) {
    const vals = METERS.map(m => d[m.id]?.[dt] ?? '');
    csv += `${dt},${vals.join(',')}\n`;
  }
  return csv;
}

// Convert DD-MM-YYYY to YYYY-MM-DD if needed
function normalizeDate(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length <= 2 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

// Parse CSV and return { headers, colMap, rows: [{date, values}], dateRange }
export function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV is empty or invalid');
  const headers = lines[0].split(',').map(h => h.trim());

  if (headers[0] !== 'Date') throw new Error('Format mismatch. First column must be "Date"');

  const colMap = [];
  for (let c = 1; c < headers.length; c++) {
    const m = METERS.find(m => `${m.scheme} ${m.name}` === headers[c]);
    if (!m) throw new Error(`Unknown meter column: "${headers[c]}". Expected: ${METERS.map(m => `${m.scheme} ${m.name}`).join(', ')}`);
    colMap.push(m.id);
  }

  const todayStr = new Date().toISOString().substring(0, 10);
  const rows = [];
  let futureCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(',');
    let date = cols[0]?.trim();
    if (!date) continue;

    // Support both DD-MM-YYYY and YYYY-MM-DD formats
    date = normalizeDate(date);

    if (date > todayStr) { futureCount++; continue; }
    const values = {};
    for (let c = 0; c < colMap.length; c++) {
      const val = cols[c + 1]?.trim();
      if (val === '' || val == null) continue;
      const reading = Number(val);
      if (!isNaN(reading)) values[colMap[c]] = reading;
    }
    if (Object.keys(values).length > 0) rows.push({ date, values });
  }

  const allDates = rows.map(r => r.date).sort();
  return {
    rows,
    minDate: allDates[0] || null,
    maxDate: allDates[allDates.length - 1] || null,
    totalRows: rows.length,
    futureSkipped: futureCount
  };
}

// Import with options: { fromDate, toDate, mode: 'update' | 'overwrite' }
export function importCSV(csvText, options = {}) {
  const parsed = parseCSV(csvText);
  const { fromDate, toDate, mode } = options;

  // Filter rows by date range
  let rows = parsed.rows;
  if (fromDate) rows = rows.filter(r => r.date >= fromDate);
  if (toDate) rows = rows.filter(r => r.date <= toDate);

  if (rows.length === 0) throw new Error('No data found in the selected date range');

  autoBackup();

  // 'overwrite' = clear ALL existing data, then import
  // 'update' = merge (existing values kept, new values added/updated)
  const d = mode === 'overwrite' ? {} : load();

  for (const row of rows) {
    for (const [mid, reading] of Object.entries(row.values)) {
      if (!d[mid]) d[mid] = {};
      d[mid][row.date] = reading;
    }
  }

  save(d);
  return { importedRows: rows.length };
}

// ---- Future data purger ----
function deleteFutureData() {
  const d = load();
  if (Object.keys(d).length === 0) return;
  let changed = false;
  const todayStr = new Date().toISOString().substring(0, 10);
  for (const mid in d) {
    for (const dt in d[mid]) {
      if (dt > todayStr) {
        delete d[mid][dt];
        changed = true;
      }
    }
  }
  if (changed) save(d);
}

export function clearAllData() { save({}); }
