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
    <div class="print-only">
      <h1>Kudineer</h1>
      <p>Punjai Thalavaipalayam CWSS 138/238 — ${year} Index (Average Litres)</p>
    </div>

    <div class="section-header" style="display:flex; justify-content:space-between; align-items:flex-start">
      <div>
        <div class="year-badge">📊 ${year} Average</div>
        <div class="section-title">Yearly Summary</div>
        <div class="section-subtitle">Punjai Thalavaipalayam CWSS 138/238 – Average Input</div>
      </div>
      <button class="btn btn-ghost" id="dlYearPdf" style="padding:6px 12px; font-size:0.75rem; border-color:var(--accent); color:var(--accent)"><span style="font-size:1rem; margin-right:4px">📥</span> PDF</button>
    </div>
    <div class="stats-grid">
      <div class="stat-card highlight"><span class="stat-icon">💧</span><div class="stat-value">${fmtNum(yearTotal)}</div><div class="stat-label">Total Litres</div></div>
      <div class="stat-card"><span class="stat-icon">📅</span><div class="stat-value">${monthsWithData}</div><div class="stat-label">Active Months</div></div>
      <div class="stat-card"><span class="stat-icon">📊</span><div class="stat-value">${monthsWithData > 0 ? fmtNum(Math.round(yearTotal / monthsWithData)) : '—'}</div><div class="stat-label">Avg / Month</div></div>
    </div>
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr><th rowspan="2" class="cs">S.No</th><th rowspan="2" class="cd" style="border-right:2px solid var(--border)">Month</th><th colspan="${c1.length}" class="gh">CWSS-138 (Avg Litres)</th><th colspan="${c2.length}" class="gh2">CWSS-238 (Avg Litres)</th></tr>
          <tr>${c1.map((c,i) => `<th class="col-138 ${i===0?'box-start':''} ${i===c1.length-1?'box-end':''}">${c.name}</th>`).join('')}${c2.map((c,i) => `<th class="col-238 ${i===0?'box-start':''} ${i===c2.length-1?'box-end':''}">${c.name}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${data.map((r, i) => `<tr><td class="cs">${i+1}</td><td class="cd" style="border-right:2px solid var(--border)">${MONTHS[r.month]}</td>${c1.map((c,idx) => { const v = r.averages[c.id]; return `<td class="col-138 ${idx===0?'box-start':''} ${idx===c1.length-1?'box-end':''} ${v > 0 ? 'cv' : 'ce'}">${fmtNum(v)}</td>`; }).join('')}${c2.map((c,idx) => { const v = r.averages[c.id]; return `<td class="col-238 ${idx===0?'box-start':''} ${idx===c2.length-1?'box-end':''} ${v > 0 ? 'cv' : 'ce'}">${fmtNum(v)}</td>`; }).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </div>
    </div>`;

  // Download PDF
  el.querySelector('#dlYearPdf').onclick = () => {
    const originalTitle = document.title;
    document.title = `Kudineer_Index_${year}`;
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 500);
  };
}
