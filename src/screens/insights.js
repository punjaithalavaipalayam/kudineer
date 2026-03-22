/* insights.js – Bar Chart showing % received vs target */
import { Chart, registerables } from 'chart.js';
import { MONTHS, MONTH_SHORT, fmtNum } from '../lib/calculations.js';
import { getYearlySummary } from '../lib/store.js';

Chart.register(...registerables);
let chart = null;

const TARGET_138 = 142000, TARGET_238 = 14000;

export function renderInsights(el) {
  if (chart) { chart.destroy(); chart = null; }

  const currentYear = new Date().getFullYear();
  const year = 2026;
  const data = getYearlySummary(year);
  const hasData = data.some(m => Object.values(m.totals).some(v => v > 0));

  if (!hasData) {
    el.innerHTML = `
      <div style="background:linear-gradient(135deg,#0f172a,#1e293b); border-radius:14px; padding:14px 20px; color:#fff; text-align:center; margin-bottom:14px">
        <div style="font-size:1rem; font-weight:800">புன்செய் தாளவாய்பாளையம் ஆற்று நீர்</div>
        <div style="font-size:0.7rem; opacity:0.7; margin-top:3px">CWSS 138 / 238 — Insights</div>
      </div>
      <div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">No data yet</div><div class="empty-state-sub">Add readings via the + button to see insights.</div></div>`;
    return;
  }

  el.innerHTML = `
    <!-- Title Box -->
    <div style="background:linear-gradient(135deg,#0f172a,#1e293b); border-radius:14px; padding:14px 20px; color:#fff; text-align:center; margin-bottom:14px; position:relative">
      <div style="font-size:1rem; font-weight:800">புன்செய் தாளவாய்பாளையம் ஆற்று நீர்</div>
      <div style="font-size:0.7rem; opacity:0.7; margin-top:3px">CWSS 138 / 238 — Insights</div>
    </div>

    <!-- Selectors Row -->
    <div style="display:flex; gap:10px; margin-bottom:14px; align-items:center">
      <div class="select-wrap" style="flex:1">
        <select id="insYear">
          <option value="2025">2025</option>
          <option value="2026" selected>2026</option>
          <option value="2027">2027</option>
        </select>
      </div>
      <div class="select-wrap" style="flex:1">
        <select id="insScheme">
          <option value="138" selected>CWSS-138 (Main)</option>
          <option value="238">CWSS-238 (Main)</option>
        </select>
      </div>
      <button id="insDownload" style="padding:8px 12px; border-radius:10px; border:1px solid var(--border); background:var(--card-bg); color:var(--text); cursor:pointer; display:flex; align-items:center; gap:4px; font-size:0.75rem; font-weight:600" title="Download Chart">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        PNG
      </button>
    </div>

    <!-- Bar Chart -->
    <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:12px; padding:14px">
      <div id="insChartTitle" style="font-size:0.8rem; font-weight:700; text-align:center; margin-bottom:10px; color:var(--text-secondary)"></div>
      <div style="position:relative; height:320px">
        <canvas id="insChart"></canvas>
      </div>
      <div style="text-align:center; margin-top:8px; font-size:0.65rem; color:var(--text-muted)">
        100% line = Target allotment per day
      </div>
    </div>
  `;

  function buildChart() {
    if (chart) { chart.destroy(); chart = null; }

    const selYear = +el.querySelector('#insYear').value;
    const selScheme = el.querySelector('#insScheme').value;
    const yearData = getYearlySummary(selYear);

    const meterId = selScheme === '138' ? 'cwss138_main' : 'cwss238_main';
    const target = selScheme === '138' ? TARGET_138 : TARGET_238;
    const schemeName = selScheme === '138' ? 'CWSS-138' : 'CWSS-238';

    // Calculate % received for each month
    const pcts = yearData.map(m => {
      const avg = m.averages[meterId] || 0;
      return avg > 0 ? Math.round((avg / target) * 100) : 0;
    });

    // Update title
    el.querySelector('#insChartTitle').textContent = `${schemeName} — % Received vs Target (${selYear})`;

    const isDark = document.documentElement.dataset.theme === 'dark';
    const tc = isDark ? '#94a3b8' : '#475569';
    const gc = isDark ? 'rgba(148,163,184,0.08)' : 'rgba(71,85,105,0.08)';

    // Bar colors based on percentage
    const barColors = pcts.map(p => {
      if (p === 0) return 'rgba(148,163,184,0.15)';
      if (p >= 100) return 'rgba(34,197,94,0.75)';
      if (p >= 75) return 'rgba(245,158,11,0.75)';
      if (p >= 50) return 'rgba(249,115,22,0.75)';
      return 'rgba(239,68,68,0.75)';
    });

    const borderColors = pcts.map(p => {
      if (p === 0) return 'rgba(148,163,184,0.3)';
      if (p >= 100) return 'rgb(34,197,94)';
      if (p >= 75) return 'rgb(245,158,11)';
      if (p >= 50) return 'rgb(249,115,22)';
      return 'rgb(239,68,68)';
    });

    const ctx = document.getElementById('insChart');
    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: MONTH_SHORT,
        datasets: [{
          label: '% Received',
          data: pcts,
          backgroundColor: barColors,
          borderColor: borderColors,
          borderWidth: 1.5,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 32
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.parsed.y}% of target`
            }
          }
        },
        scales: {
          x: {
            ticks: { color: tc, font: { size: 10, weight: '600' } },
            grid: { display: false }
          },
          y: {
            min: 0,
            max: Math.max(120, ...pcts.map(p => p + 10)),
            ticks: {
              color: tc,
              font: { size: 9 },
              callback: (v) => v + '%',
              stepSize: 25
            },
            grid: { color: gc }
          }
        },
        // Draw 100% target line
        animation: {
          onComplete: () => {
            const chartInstance = chart;
            if (!chartInstance) return;
            const yScale = chartInstance.scales.y;
            const ctx2 = chartInstance.ctx;
            const yPos = yScale.getPixelForValue(100);

            ctx2.save();
            ctx2.beginPath();
            ctx2.setLineDash([6, 4]);
            ctx2.strokeStyle = isDark ? 'rgba(239,68,68,0.6)' : 'rgba(239,68,68,0.8)';
            ctx2.lineWidth = 2;
            ctx2.moveTo(yScale.left, yPos);
            ctx2.lineTo(yScale.right, yPos);
            ctx2.stroke();

            // Label
            ctx2.fillStyle = isDark ? 'rgba(239,68,68,0.8)' : 'rgba(239,68,68,0.9)';
            ctx2.font = 'bold 9px Inter, sans-serif';
            ctx2.fillText('100% Target', yScale.right - 70, yPos - 5);
            ctx2.restore();
          }
        }
      }
    });
  }

  // Build initial chart
  setTimeout(buildChart, 50);

  // Selectors change
  el.querySelector('#insYear').onchange = buildChart;
  el.querySelector('#insScheme').onchange = buildChart;

  // Download chart as PNG
  el.querySelector('#insDownload').onclick = () => {
    const canvas = document.getElementById('insChart');
    if (!canvas) return;

    const selYear = el.querySelector('#insYear').value;
    const selScheme = el.querySelector('#insScheme').value === '138' ? 'CWSS-138' : 'CWSS-238';

    const link = document.createElement('a');
    link.download = `Insights_${selScheme}_${selYear}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
}
