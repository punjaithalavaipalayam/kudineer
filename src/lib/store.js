/* store.js – Data persistence (localStorage) */
import { METERS, LITRES_COLUMNS, calcConsumption, calcLitres, daysInMonth, fmtDate, prevMonthLastDay } from './calculations.js';

const SK = 'jalmitra_readings', SETK = 'jalmitra_settings';

function load() { try { const r = localStorage.getItem(SK); return r ? JSON.parse(r) : {}; } catch { return {}; } }
function save(d) { localStorage.setItem(SK, JSON.stringify(d)); }

export function getSettings() {
  try { const r = localStorage.getItem(SETK); return r ? JSON.parse(r) : { theme:'dark', pin:'1234' }; }
  catch { return { theme:'dark', pin:'1234' }; }
}
export function saveSettings(s) { localStorage.setItem(SETK, JSON.stringify(s)); }

export function saveAllReadings(dateStr, readings) {
  autoBackup();
  const d = load();
  for (const [mid, v] of Object.entries(readings)) {
    if (v != null && v !== '' && !isNaN(v)) { if (!d[mid]) d[mid] = {}; d[mid][dateStr] = Number(v); }
  }
  save(d);
}

export function autoBackup() {
  const d = load();
  if (Object.keys(d).length === 0) return;
  const t = new Date();
  // Create exact timestamp: "2026-03-19 18:40:05"
  const k = t.toISOString().replace('T', ' ').substring(0, 19);
  
  let b = {};
  try { b = JSON.parse(localStorage.getItem('kudineer_backups') || '{}'); } catch(e){}
  
  b[k] = exportCSV();
  
  const keys = Object.keys(b).sort();
  while (keys.length > 3) {
    delete b[keys.shift()];
  }
  
  localStorage.setItem('kudineer_backups', JSON.stringify(b));
}

export function getAutoBackups() {
  try { return JSON.parse(localStorage.getItem('kudineer_backups') || '{}'); } catch(e){ return {}; }
}

export function getReading(dateStr, mid) { const d = load(); return d[mid]?.[dateStr] ?? null; }

export function getPreviousReading(dateStr, mid) {
  const d = load(); if (!d[mid]) return null;
  const dates = Object.keys(d[mid]).sort();
  for (let i = dates.length - 1; i >= 0; i--) { if (dates[i] < dateStr) return d[mid][dates[i]]; }
  return null;
}

export function getMonthlyTable(month, year) {
  const days = daysInMonth(month, year), bDate = prevMonthLastDay(month, year);
  const rows = [], totals = {}, counts = {};
  LITRES_COLUMNS.forEach(c => { totals[c.id] = 0; counts[c.id] = 0; });

  // All meter IDs we need MLD readings for (including sump)
  const ALL_MLD_IDS = [...METERS.map(m => m.id), 'cwss138_sump'];

  // Baseline row (row 0) — previous month's last day
  const r0 = { sno: 0, date: bDate, isBase: true, mld: {}, litres: {} };
  ALL_MLD_IDS.forEach(id => { r0.mld[id] = getReading(bDate, id); });
  LITRES_COLUMNS.forEach(c => { r0.litres[c.id] = null; });
  rows.push(r0);

  // Day rows — compute litres by comparing with PREVIOUS ROW (like Excel)
  for (let d = 1; d <= days; d++) {
    const ds = fmtDate(new Date(year, month, d));
    const row = { sno: d, date: ds, isBase: false, mld: {}, litres: {} };
    const prevRow = rows[rows.length - 1]; // the row directly above

    // Get MLD readings for all meters
    ALL_MLD_IDS.forEach(id => { row.mld[id] = getReading(ds, id); });

    // Compute litres: (current row MLD - previous row MLD) × 1000
    LITRES_COLUMNS.forEach(c => {
      if (c.id === 'cwss138_sump') return; // Calculated exactly below
      const curMLD = row.mld[c.id];
      // Walk backward through rows to find the closest previous row that has a value
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
  
  // Monthly average shouldn't be taken for the future
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

export function exportCSV() {
  const d = load();
  // Column headers: Date + each meter's display name
  const hdr = ['Date', ...METERS.map(m => `${m.scheme} ${m.name}`)];
  let csv = hdr.join(',') + '\n';

  // Collect all unique dates across all meters, sorted chronologically
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

  // Map each column header to a meter ID
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

// Ensure any existing future data in localStorage is inherently destroyed!
(function deleteFutureData() {
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
})();

export function clearAllData() { localStorage.removeItem(SK); }
