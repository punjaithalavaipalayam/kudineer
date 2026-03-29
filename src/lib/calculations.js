/* calculations.js – Business logic & constants */

export const METERS = [
  { id: 'cwss138_main', scheme: 'CWSS-138', name: 'Main Ent', shortName: 'Main Ent' },
  { id: 'cwss138_mgp_cek', scheme: 'CWSS-138', name: 'MGP C&EK', shortName: 'MGP C&EK' },
  { id: 'cwss138_mgp', scheme: 'CWSS-138', name: 'MGP', shortName: 'MGP' },
  { id: 'cwss238_main', scheme: 'CWSS-238', name: 'Main Ent', shortName: 'Main Ent' },
];

export const LITRES_COLUMNS = [
  { id: 'cwss138_main', scheme: 'CWSS-138', name: 'Main Ent' },
  { id: 'cwss138_mgp_cek', scheme: 'CWSS-138', name: 'MGP C&EK' },
  { id: 'cwss138_mgp', scheme: 'CWSS-138', name: 'MGP' },
  { id: 'cwss138_sump', scheme: 'CWSS-138', name: 'Sump' },
  { id: 'cwss238_main', scheme: 'CWSS-238', name: 'Main Ent' },
];

export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function calcConsumption(cur, prev) {
  if (cur == null || prev == null) return null;
  const d = cur - prev;
  return d >= 0 ? d : null;
}

export function calcLitres(cons) {
  return cons == null ? null : cons * 1000;
}

export function daysInMonth(m, y) { return new Date(y, m + 1, 0).getDate(); }

export function prevMonthLastDay(m, y) { return fmtDate(new Date(y, m, 0)); }

export function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function fmtDateDisplay(s) {
  if (!s) return '—';
  const d = new Date(s + 'T00:00:00');
  return `${String(d.getDate()).padStart(2,'0')}-${MONTH_SHORT[d.getMonth()]}`;
}

export function fmtNum(n) {
  if (n == null || isNaN(n)) return '—';
  return Math.round(n).toLocaleString('en-IN');
}

export function detectSpike(val, hist) {
  if (!hist || hist.length < 3) return false;
  const avg = hist.reduce((s, v) => s + v, 0) / hist.length;
  return val > avg * 2;
}

export function getTodayStr() { return fmtDate(new Date()); }
