/* insights.js – Charts & Analytics */
import { Chart, registerables } from 'chart.js';
import { LITRES_COLUMNS, MONTH_SHORT, fmtNum } from '../lib/calculations.js';
import { getYearlySummary } from '../lib/store.js';

Chart.register(...registerables);
let charts = [];

export function renderInsights(el) {
  charts.forEach(c => c.destroy()); charts = [];
  const year = 2026, data = getYearlySummary(year);
  const hasData = data.some(m => Object.values(m.totals).some(v => v > 0));
  let totalY = 0, totalM = 0;
  data.forEach(m => { const t = Object.values(m.totals).reduce((s,v) => s+(v||0), 0); if (t > 0) { totalY += t; totalM++; } });

  if (!hasData) {
    el.innerHTML = `<div class="section-header"><div class="section-title">📈 Insights</div><div class="section-subtitle">Water consumption trends</div></div><div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">No data yet</div><div class="empty-state-sub">Add readings via the + button or load sample data in Settings.</div></div>`;
    return;
  }

  el.innerHTML = `
    <div class="section-header"><div class="section-title">📈 Insights & Analytics</div><div class="section-subtitle">Water consumption trends for ${year}</div></div>
    <div class="stats-grid">
      <div class="stat-card highlight"><span class="stat-icon">💧</span><div class="stat-value">${fmtNum(totalY)}</div><div class="stat-label">Year Total (L)</div></div>
      <div class="stat-card"><span class="stat-icon">📅</span><div class="stat-value">${totalM}</div><div class="stat-label">Active Months</div></div>
      <div class="stat-card"><span class="stat-icon">⚡</span><div class="stat-value">${totalM>0?fmtNum(Math.round(totalY/totalM)):'—'}</div><div class="stat-label">Avg / Month</div></div>
    </div>
    <div class="chart-container"><div class="chart-title">Monthly Total (Litres)</div><canvas id="c1" height="200"></canvas></div>
    <div class="chart-container"><div class="chart-title">Meter Breakdown</div><canvas id="c2" height="200"></canvas></div>`;

  setTimeout(() => {
    const isDark = document.documentElement.dataset.theme === 'dark';
    const tc = isDark ? '#94a3b8' : '#475569', gc = isDark ? 'rgba(148,163,184,0.08)' : 'rgba(71,85,105,0.08)';

    charts.push(new Chart(document.getElementById('c1'), {
      type: 'bar', data: { labels: MONTH_SHORT, datasets: [{ label: 'Litres', data: data.map(m => Object.values(m.totals).reduce((s,v)=>s+(v||0),0)),
        backgroundColor: data.map(m => Object.values(m.totals).reduce((s,v)=>s+(v||0),0) > 0 ? 'hsla(222,80%,55%,0.7)' : 'rgba(148,163,184,0.1)'),
        borderRadius: 8, borderSkipped: false }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { x: { ticks: { color: tc, font: { size: 10, weight: '600' } }, grid: { display: false } }, y: { ticks: { color: tc, font: { size: 9 } }, grid: { color: gc } } } }
    }));

    const clrs = ['hsl(222,80%,55%)','hsl(190,80%,48%)','hsl(260,60%,58%)','hsl(155,60%,42%)','hsl(35,90%,52%)'];
    charts.push(new Chart(document.getElementById('c2'), {
      type: 'doughnut', data: { labels: LITRES_COLUMNS.map(c => `${c.scheme.replace('CWSS-','')} ${c.name}`),
        datasets: [{ data: LITRES_COLUMNS.map(c => data.reduce((t,m)=>t+(m.totals[c.id]||0),0)), backgroundColor: clrs, borderWidth: 3, borderColor: isDark?'#151d2e':'#fff' }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '55%',
        plugins: { legend: { position: 'bottom', labels: { color: tc, font: { size: 10, weight: '600' }, padding: 10, usePointStyle: true, pointStyleWidth: 10 } } } }
    }));
  }, 50);
}
