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

// ---- Monthly / Yearly tables (unchanged logic, reads from cache) ----
export function getMonthlyTable(month, year) {
  const days = daysInMonth(month, year), bDate = prevMonthLastDay(month, year);
  const rows = [], totals = {}, counts = {};
  LITRES_COLUMNS.forEach(c => { totals[c.id] = 0; counts[c.id] = 0; });

  const ALL_MLD_IDS = [...METERS.map(m => m.id), 'cwss138_sump'];

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

    LITRES_COLUMNS.forEach(c => {
      if (c.id === 'cwss138_sump') return;
      const curMLD = row.mld[c.id];
      let prevMLD = null;
      for (let p = rows.length - 1; p >= 0; p--) {
        if (rows[p].mld[c.id] != null) { prevMLD = rows[p].mld[c.id]; break; }
      }
      const cons = calcConsumption(curMLD, prevMLD);
      const lit = calcLitres(cons);
      row.litres[c.id] = lit;
    });

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

export function importCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV is empty or invalid');
  const headers = lines[0].split(',').map(h => h.trim());

  if (headers[0] !== 'Date') throw new Error('Format mismatch. First column must be "Date"');

  const d = load();
  const todayStr = new Date().toISOString().substring(0, 10);
  let hasFuture = false;

  const colMap = [];
  for (let c = 1; c < headers.length; c++) {
    const m = METERS.find(m => `${m.scheme} ${m.name}` === headers[c]);
    if (!m) throw new Error(`Unknown meter column: "${headers[c]}". Expected: ${METERS.map(m => `${m.scheme} ${m.name}`).join(', ')}`);
    colMap.push(m.id);
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(',');
    const date = cols[0]?.trim();
    if (!date) continue;
    if (date > todayStr) { hasFuture = true; continue; }
    for (let c = 0; c < colMap.length; c++) {
      const val = cols[c + 1]?.trim();
      if (val === '' || val == null) continue;
      const reading = Number(val);
      if (!isNaN(reading)) { if (!d[colMap[c]]) d[colMap[c]] = {}; d[colMap[c]][date] = reading; }
    }
  }

  if (hasFuture) throw new Error('Datas in future are not accepted');
  save(d);
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
