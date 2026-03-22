/* insights.js – Bar Chart showing % received vs target */
import { Chart, registerables } from 'chart.js';
import { MONTHS, MONTH_SHORT, fmtNum } from '../lib/calculations.js';
import { getYearlySummary } from '../lib/store.js';

Chart.register(...registerables);
let chart = null;

const TARGET_138 = 142000, TARGET_238 = 14000;

// Chart.js plugin to draw target line with styled badge
const targetLinePlugin = {
  id: 'targetLine',
  afterDraw(chart) {
    const { ctx, scales: { y }, chartArea } = chart;
    const targetVal = chart.config.options.plugins.targetLine?.value;
    if (targetVal == null || !y) return;

    const yPos = y.getPixelForValue(targetVal);
    const isDark = document.documentElement.dataset.theme === 'dark';

    // Draw dashed line
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([8, 5]);
    ctx.strokeStyle = isDark ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.7)';
    ctx.lineWidth = 2;
    ctx.moveTo(chartArea.left, yPos);
    ctx.lineTo(chartArea.right, yPos);
    ctx.stroke();

    // Draw target badge
    const label = `Target ${targetVal}%`;
    ctx.font = 'bold 10px Inter, sans-serif';
    const textW = ctx.measureText(label).width;
    const badgeW = textW + 14;
    const badgeH = 20;
    const badgeX = chartArea.right - badgeW - 4;
    const badgeY = yPos - badgeH - 4;

    // Badge background
    ctx.fillStyle = isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)';
    ctx.strokeStyle = isDark ? 'rgba(239,68,68,0.5)' : 'rgba(239,68,68,0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    const r = 4;
    ctx.moveTo(badgeX + r, badgeY);
    ctx.lineTo(badgeX + badgeW - r, badgeY);
    ctx.quadraticCurveTo(badgeX + badgeW, badgeY, badgeX + badgeW, badgeY + r);
    ctx.lineTo(badgeX + badgeW, badgeY + badgeH - r);
    ctx.quadraticCurveTo(badgeX + badgeW, badgeY + badgeH, badgeX + badgeW - r, badgeY + badgeH);
    ctx.lineTo(badgeX + r, badgeY + badgeH);
    ctx.quadraticCurveTo(badgeX, badgeY + badgeH, badgeX, badgeY + badgeH - r);
    ctx.lineTo(badgeX, badgeY + r);
    ctx.quadraticCurveTo(badgeX, badgeY, badgeX + r, badgeY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Badge text
    ctx.fillStyle = isDark ? 'rgba(239,68,68,0.9)' : 'rgba(220,38,38,1)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, badgeX + badgeW / 2, badgeY + badgeH / 2);
    ctx.restore();
  }
};

Chart.register(targetLinePlugin);

export function renderInsights(el) {
  if (chart) { chart.destroy(); chart = null; }

  const year = 2026;
  const data = getYearlySummary(year);
  const hasData = data.some(m => Object.values(m.totals).some(v => v > 0));

  if (!hasData) {
    el.innerHTML = `
      <div class="empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">No data yet</div><div class="empty-state-sub">Add readings via the + button to see insights.</div></div>`;
    return;
  }

  el.innerHTML = `
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
      <button id="insDownload" style="padding:8px 12px; border-radius:10px; border:1px solid var(--border); background:var(--card-bg); color:var(--text); cursor:pointer; display:flex; align-items:center; gap:4px; font-size:0.75rem; font-weight:600" title="Download PDF (both charts)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        PDF
      </button>
    </div>

    <!-- Bar Chart -->
    <div id="insChartCard" style="background:var(--card-bg); border:1px solid var(--border); border-radius:12px; padding:14px">
      <div id="insChartTitle" style="font-size:0.8rem; font-weight:700; text-align:center; margin-bottom:10px; color:var(--text-secondary)"></div>
      <div style="position:relative; height:320px">
        <canvas id="insChart"></canvas>
      </div>
    </div>
  `;

  function getChartData(selYear, schemeKey) {
    const yearData = getYearlySummary(selYear);
    const meterId = schemeKey === '138' ? 'cwss138_main' : 'cwss238_main';
    const target = schemeKey === '138' ? TARGET_138 : TARGET_238;

    return yearData.map(m => {
      const avg = m.averages[meterId] || 0;
      return avg > 0 ? Math.round((avg / target) * 100) : 0;
    });
  }

  function getBarColors(pcts) {
    return pcts.map(p => {
      if (p === 0) return 'rgba(148,163,184,0.15)';
      if (p >= 100) return 'rgba(34,197,94,0.75)';
      if (p >= 75) return 'rgba(245,158,11,0.75)';
      if (p >= 50) return 'rgba(249,115,22,0.75)';
      return 'rgba(239,68,68,0.75)';
    });
  }

  function getBorderColors(pcts) {
    return pcts.map(p => {
      if (p === 0) return 'rgba(148,163,184,0.3)';
      if (p >= 100) return 'rgb(34,197,94)';
      if (p >= 75) return 'rgb(245,158,11)';
      if (p >= 50) return 'rgb(249,115,22)';
      return 'rgb(239,68,68)';
    });
  }

  function buildChart() {
    if (chart) { chart.destroy(); chart = null; }

    const selYear = +el.querySelector('#insYear').value;
    const selScheme = el.querySelector('#insScheme').value;
    const schemeName = selScheme === '138' ? 'CWSS-138' : 'CWSS-238';
    const target = selScheme === '138' ? TARGET_138 : TARGET_238;

    const pcts = getChartData(selYear, selScheme);
    const maxPct = Math.max(...pcts, 100);

    el.querySelector('#insChartTitle').textContent = `${schemeName} Main — % Received vs Target of ${fmtNum(target)} Ltrs/Day (${selYear})`;

    const isDark = document.documentElement.dataset.theme === 'dark';
    const tc = isDark ? '#94a3b8' : '#475569';
    const gc = isDark ? 'rgba(148,163,184,0.08)' : 'rgba(71,85,105,0.08)';

    const ctx = document.getElementById('insChart');
    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: MONTH_SHORT,
        datasets: [{
          label: '% Received',
          data: pcts,
          backgroundColor: getBarColors(pcts),
          borderColor: getBorderColors(pcts),
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
          },
          targetLine: { value: 100 }
        },
        scales: {
          x: {
            ticks: { color: tc, font: { size: 10, weight: '600' } },
            grid: { display: false }
          },
          y: {
            min: 0,
            max: Math.ceil((maxPct + 15) / 25) * 25,
            ticks: {
              color: tc,
              font: { size: 9 },
              callback: (v) => v + '%',
              stepSize: 25
            },
            grid: { color: gc }
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

  // Download PDF with BOTH charts, title, and info boxes
  el.querySelector('#insDownload').onclick = () => {
    const selYear = el.querySelector('#insYear').value;

    // Create a temporary print container
    const printDiv = document.createElement('div');
    printDiv.id = 'insightsPrintArea';
    printDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#fff;z-index:99999;padding:30px;overflow:auto;box-sizing:border-box';

    const pcts138 = getChartData(+selYear, '138');
    const pcts238 = getChartData(+selYear, '238');
    const avg138 = pcts138.filter(p => p > 0);
    const avg238 = pcts238.filter(p => p > 0);
    const avgPct138 = avg138.length > 0 ? Math.round(avg138.reduce((a, b) => a + b, 0) / avg138.length) : 0;
    const avgPct238 = avg238.length > 0 ? Math.round(avg238.reduce((a, b) => a + b, 0) / avg238.length) : 0;

    printDiv.innerHTML = `
      <div style="text-align:center;margin-bottom:20px">
        <h1 style="font-size:1.3rem;margin:0 0 4px 0;color:#0f172a">புன்செய் தாளவாய்பாளையம் ஆற்று நீர்</h1>
        <p style="font-size:0.8rem;color:#64748b;margin:0">CWSS 138 / 238 — Insights & Analytics (${selYear})</p>
      </div>

      <div style="display:flex;gap:12px;margin-bottom:20px">
        <div style="flex:1;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:0.7rem;color:#1e40af;text-transform:uppercase;font-weight:700;margin-bottom:4px">CWSS-138 Target</div>
          <div style="font-size:1.2rem;font-weight:800;color:#1e3a5f">${fmtNum(TARGET_138)} Ltrs/Day</div>
          <div style="font-size:0.75rem;color:#1e40af;margin-top:4px;font-weight:700">Avg Received: ${avgPct138}%</div>
        </div>
        <div style="flex:1;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:0.7rem;color:#065f46;text-transform:uppercase;font-weight:700;margin-bottom:4px">CWSS-238 Target</div>
          <div style="font-size:1.2rem;font-weight:800;color:#064e3b">${fmtNum(TARGET_238)} Ltrs/Day</div>
          <div style="font-size:0.75rem;color:#065f46;margin-top:4px;font-weight:700">Avg Received: ${avgPct238}%</div>
        </div>
      </div>

      <div style="margin-bottom:24px">
        <h3 style="font-size:0.85rem;text-align:center;color:#334155;margin:0 0 10px 0">CWSS-138 Main — % Received vs Target of ${fmtNum(TARGET_138)} Ltrs/Day</h3>
        <canvas id="printChart138" width="700" height="280"></canvas>
      </div>
      <div>
        <h3 style="font-size:0.85rem;text-align:center;color:#334155;margin:0 0 10px 0">CWSS-238 Main — % Received vs Target of ${fmtNum(TARGET_238)} Ltrs/Day</h3>
        <canvas id="printChart238" width="700" height="280"></canvas>
      </div>
    `;

    document.body.appendChild(printDiv);

    // Helper to create a chart on the print canvas
    function createPrintChart(canvasId, pcts, schemeName) {
      const maxPct = Math.max(...pcts, 100);
      return new Chart(document.getElementById(canvasId), {
        type: 'bar',
        data: {
          labels: MONTH_SHORT,
          datasets: [{
            label: '% Received',
            data: pcts,
            backgroundColor: getBarColors(pcts),
            borderColor: getBorderColors(pcts),
            borderWidth: 1.5,
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 40
          }]
        },
        options: {
          responsive: false,
          animation: false,
          plugins: {
            legend: { display: false },
            targetLine: { value: 100 }
          },
          scales: {
            x: {
              ticks: { color: '#475569', font: { size: 11, weight: '600' } },
              grid: { display: false }
            },
            y: {
              min: 0,
              max: Math.ceil((maxPct + 15) / 25) * 25,
              ticks: { color: '#475569', font: { size: 10 }, callback: (v) => v + '%', stepSize: 25 },
              grid: { color: 'rgba(71,85,105,0.08)' }
            }
          }
        }
      });
    }

    // Render both charts then print
    setTimeout(() => {
      const c1 = createPrintChart('printChart138', pcts138);
      const c2 = createPrintChart('printChart238', pcts238);

      const origTitle = document.title;
      document.title = `Insights_CWSS_138_238_${selYear}`;

      setTimeout(() => {
        window.print();
        setTimeout(() => {
          document.title = origTitle;
          c1.destroy();
          c2.destroy();
          document.body.removeChild(printDiv);
        }, 500);
      }, 100);
    }, 100);
  };
}
