/* yearly-summary.js */
import { MONTHS, LITRES_COLUMNS, fmtNum } from '../lib/calculations.js';
import { getYearlySummary } from '../lib/store.js';

export function renderYearlySummary(el) {
  const year = 2026, data = getYearlySummary(year);
  const c1 = LITRES_COLUMNS.filter(c => c.scheme === 'CWSS-138'), c2 = LITRES_COLUMNS.filter(c => c.scheme === 'CWSS-238');

  // Aggregate year stats
  let yearTotal = 0, monthsWithData = 0;
  data.forEach(m => { const t = Object.values(m.totals).reduce((s,v) => s+(v||0), 0); if (t > 0) { yearTotal += t; monthsWithData++; } });

  el.innerHTML = `
    <div class="section-header">
      <div class="year-badge">📊 ${year} Average</div>
      <div class="section-title">Yearly Summary</div>
      <div class="section-subtitle">Punjai Thalavaipalayam CWSS 138/238 – Average Input / Month</div>
    </div>
    <div class="stats-grid">
      <div class="stat-card highlight"><span class="stat-icon">💧</span><div class="stat-value">${fmtNum(yearTotal)}</div><div class="stat-label">Total Litres</div></div>
      <div class="stat-card"><span class="stat-icon">📅</span><div class="stat-value">${monthsWithData}</div><div class="stat-label">Active Months</div></div>
      <div class="stat-card"><span class="stat-icon">📊</span><div class="stat-value">${monthsWithData > 0 ? fmtNum(Math.round(yearTotal / monthsWithData)) : '—'}</div><div class="stat-label">Avg / Month</div></div>
    </div>
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr><th rowspan="2">S.No</th><th rowspan="2">Month</th><th colspan="${c1.length}" class="gh">CWSS-138 (Avg Litres)</th><th colspan="${c2.length}" class="gh2">CWSS-238 (Avg Litres)</th></tr>
          <tr>${c1.map(c => `<th>${c.name}</th>`).join('')}${c2.map(c => `<th>${c.name}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${data.map((r, i) => `<tr><td class="cs">${i+1}</td><td class="cd">${MONTHS[r.month]}</td>${[...c1,...c2].map(c => { const v = r.averages[c.id]; return `<td class="${v > 0 ? 'cv' : 'ce'}">${fmtNum(v)}</td>`; }).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="card card-accent" style="margin-top:10px">
      <p style="font-size:.78rem;color:var(--text-secondary);line-height:1.6">
        📌 This mirrors the <strong>"2026 Average"</strong> index sheet from your Excel workbook.
        Switch to <strong>Monthly</strong> for daily breakdown. Go to <strong>Settings → Load Sample Data</strong> to populate demo entries.
      </p>
    </div>`;
  el.querySelector('.screen-container')?.classList.add('screen-enter');
}
