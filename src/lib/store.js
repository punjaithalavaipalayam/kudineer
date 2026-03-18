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
  const d = load();
  for (const [mid, v] of Object.entries(readings)) {
    if (v != null && v !== '' && !isNaN(v)) { if (!d[mid]) d[mid] = {}; d[mid][dateStr] = Number(v); }
  }
  save(d);
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
      const curMLD = row.mld[c.id];
      // Walk backward through rows to find the closest previous row that has a value
      let prevMLD = null;
      for (let p = rows.length - 1; p >= 0; p--) {
        if (rows[p].mld[c.id] != null) { prevMLD = rows[p].mld[c.id]; break; }
      }
      const cons = calcConsumption(curMLD, prevMLD);
      const lit = calcLitres(cons);
      row.litres[c.id] = lit;
      if (lit != null) { totals[c.id] += lit; counts[c.id]++; }
    });
    rows.push(row);
  }

  rows.push({ sno: null, date: null, isTotal: true, litres: Object.fromEntries(LITRES_COLUMNS.map(c => [c.id, totals[c.id] || 0])) });
  rows.push({ sno: null, date: null, isAvg: true, litres: Object.fromEntries(LITRES_COLUMNS.map(c => [c.id, counts[c.id] > 0 ? Math.round(totals[c.id] / counts[c.id]) : null])) });
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
  const d = load(); let csv = 'Date,Meter,Reading\n';
  for (const [mid, readings] of Object.entries(d)) {
    for (const [dt, val] of Object.entries(readings)) csv += `${dt},${mid},${val}\n`;
  }
  return csv;
}

export function clearAllData() { localStorage.removeItem(SK); }

export function seedSampleData() {
  const d = load();
  if (!d['cwss238_main']) d['cwss238_main'] = {};
  d['cwss238_main']['2026-08-01'] = 55296;
  d['cwss238_main']['2026-08-02'] = 55307;
  d['cwss238_main']['2026-08-03'] = 55320;
  d['cwss238_main']['2026-08-04'] = 55331;
  d['cwss238_main']['2026-08-05'] = 55345;
  if (!d['cwss138_main']) d['cwss138_main'] = {};
  d['cwss138_main']['2026-08-01'] = 12100;
  d['cwss138_main']['2026-08-02'] = 12118;
  d['cwss138_main']['2026-08-03'] = 12135;
  d['cwss138_main']['2026-08-04'] = 12150;
  d['cwss138_main']['2026-08-05'] = 12168;
  save(d);
}
