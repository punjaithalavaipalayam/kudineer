/* yearly-summary.js */
import { MONTHS, LITRES_COLUMNS, fmtNum } from '../lib/calculations.js';
import { getYearlySummary } from '../lib/store.js';

// Main-only meter IDs
const MAIN_IDS = new Set(['cwss138_main', 'cwss238_main']);

export function renderYearlySummary(el) {
  const year = 2026, data = getYearlySummary(year);
  const c1 = LITRES_COLUMNS.filter(c => c.scheme === 'CWSS-138'), c2 = LITRES_COLUMNS.filter(c => c.scheme === 'CWSS-238');

  // Aggregate year stats per scheme (MAIN only)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const monthsPassedInYear = (year === currentYear) ? currentMonth : 12;

  // Calculate average daily Ltrs for each scheme across elapsed months
  let sum138 = 0, count138 = 0, sum238 = 0, count238 = 0;
  data.forEach(m => {
    const avg138 = m.averages['cwss138_main'] || 0;
    const avg238 = m.averages['cwss238_main'] || 0;
    if (avg138 > 0) { sum138 += avg138; count138++; }
    if (avg238 > 0) { sum238 += avg238; count238++; }
  });

  const TARGET_138 = 142000, TARGET_238 = 14000;
  const avgDaily138 = count138 > 0 ? Math.round(sum138 / count138) : 0;
  const avgDaily238 = count238 > 0 ? Math.round(sum238 / count238) : 0;
  const pct138 = avgDaily138 > 0 ? Math.round((avgDaily138 / TARGET_138) * 100) : 0;
  const pct238 = avgDaily238 > 0 ? Math.round((avgDaily238 / TARGET_238) * 100) : 0;

  const getRecHtml = (v, target, colClass) => {
    if (v == null || v <= 0) return `<td class="${colClass} box-end ce">—</td>`;
    const pct = Math.round((v / target) * 100);
    let color = 'var(--danger)'; // Red
    if (pct >= 100) color = 'var(--success)';
    else if (pct >= 75) color = '#f59e0b'; // Amber-Orange
    else if (pct >= 50) color = '#f97316'; // Orange-Red
    return `<td class="${colClass} box-end" style="color:${color};font-weight:bold">${pct}%</td>`;
  };

  el.innerHTML = `
    <div class="print-only">
      <h1>Kudineer</h1>
      <p>Punjai Thalavaipalayam CWSS 138/238 — ${year} Index (Average Litres)</p>
    </div>

    <!-- BOX 1: Overall Title -->
    <div style="background:linear-gradient(135deg,#0f172a,#1e293b); border-radius:14px; padding:18px 20px; color:#fff; text-align:center; margin-bottom:14px; position:relative">
      <div style="font-size:1.1rem; font-weight:800; letter-spacing:0.5px">Punjai Thalavaipalayam Aattru Neer</div>
      <div style="font-size:0.75rem; opacity:0.7; margin-top:4px">CWSS 138 / 238 — ${year} Yearly Summary</div>
      <div style="position:absolute; top:12px; right:14px">
        <div class="pdf-dropdown" id="pdfDropdownYear">
          <button class="pdf-trigger" id="pdfTriggerYear" style="padding:6px 10px; font-size:0.7rem">
            <span class="pdf-trigger-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </span>
            <span>PDF</span>
            <span class="pdf-trigger-chevron">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </span>
          </button>
          <div class="pdf-menu" id="pdfMenuYear">
            <button class="pdf-menu-item" id="dlYearPdfAll">
              <span class="pdf-menu-icon">📊</span>
              <div class="pdf-menu-text">
                <span class="pdf-menu-label">All Readings</span>
                <span class="pdf-menu-desc">Every meter column included</span>
              </div>
            </button>
            <button class="pdf-menu-item" id="dlYearPdfMain">
              <span class="pdf-menu-icon">🎯</span>
              <div class="pdf-menu-text">
                <span class="pdf-menu-label">Main Readings Only</span>
                <span class="pdf-menu-desc">CWSS-138 & 238 Main Entrance</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- BOX 2: Title - Litres Per Day Allotted -->
    <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:10px; padding:10px 16px; margin-bottom:10px; text-align:center">
      <div style="font-size:0.8rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--text-secondary)">Litres Per Day Allotted</div>
    </div>

    <!-- BOX 3 & 4: CWSS-138 and CWSS-238 Allotted (side by side) -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px">
      <div style="background:linear-gradient(135deg,#1e40af,#3b82f6); border-radius:12px; padding:16px; color:#fff; text-align:center">
        <div style="font-size:0.7rem; opacity:0.8; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px">CWSS - 138</div>
        <div style="font-size:1.6rem; font-weight:800">${fmtNum(TARGET_138)}</div>
        <div style="font-size:0.65rem; opacity:0.7; margin-top:2px">Ltrs / Day</div>
      </div>
      <div style="background:linear-gradient(135deg,#065f46,#10b981); border-radius:12px; padding:16px; color:#fff; text-align:center">
        <div style="font-size:0.7rem; opacity:0.8; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px">CWSS - 238</div>
        <div style="font-size:1.6rem; font-weight:800">${fmtNum(TARGET_238)}</div>
        <div style="font-size:0.65rem; opacity:0.7; margin-top:2px">Ltrs / Day</div>
      </div>
    </div>

    <!-- BOX 5: Title - Yearly Summary of % Received -->
    <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:10px; padding:10px 16px; margin-bottom:10px; text-align:center">
      <div style="font-size:0.8rem; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--text-secondary)">Yearly Summary of % Received (Till ${MONTHS[currentMonth - 1]} ${year})</div>
    </div>

    <!-- BOX 6 & 7: CWSS-138 and CWSS-238 % Average (side by side) -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:18px">
      <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb); border-radius:12px; padding:18px; color:#fff; text-align:center">
        <div style="font-size:0.7rem; opacity:0.8; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px">CWSS - 138</div>
        <div style="font-size:0.75rem; opacity:0.7; margin-bottom:8px">Avg: ${fmtNum(avgDaily138)} Ltrs/Day</div>
        <div style="font-size:2.2rem; font-weight:900; color:${pct138 >= 100 ? '#86efac' : pct138 >= 75 ? '#fde68a' : pct138 >= 50 ? '#fdba74' : '#fca5a5'}">${pct138}%</div>
        <div style="font-size:0.65rem; opacity:0.6; margin-top:4px">of ${fmtNum(TARGET_138)} Ltrs/Day</div>
      </div>
      <div style="background:linear-gradient(135deg,#064e3b,#059669); border-radius:12px; padding:18px; color:#fff; text-align:center">
        <div style="font-size:0.7rem; opacity:0.8; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px">CWSS - 238</div>
        <div style="font-size:0.75rem; opacity:0.7; margin-bottom:8px">Avg: ${fmtNum(avgDaily238)} Ltrs/Day</div>
        <div style="font-size:2.2rem; font-weight:900; color:${pct238 >= 100 ? '#86efac' : pct238 >= 75 ? '#fde68a' : pct238 >= 50 ? '#fdba74' : '#fca5a5'}">${pct238}%</div>
        <div style="font-size:0.65rem; opacity:0.6; margin-top:4px">of ${fmtNum(TARGET_238)} Ltrs/Day</div>
      </div>
    </div>
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr><th rowspan="2" class="cs box-date-start box-date-end">S.No</th><th rowspan="2" class="cd box-date-start box-date-end">Month</th><th colspan="${c1.length + 1}" class="gh col-group-138">CWSS-138 (Avg Ltrs)</th><th colspan="${c2.length + 1}" class="gh2 col-group-238">CWSS-238 (Avg Ltrs)</th></tr>
          <tr>${c1.map((c,i) => `<th class="col-138 ${MAIN_IDS.has(c.id)?'':'col-non-main'} ${i===0?'box-start':''}">${c.name}</th>`).join('')}<th class="col-138 box-end" style="color:var(--text-secondary)">Rec%</th>${c2.map((c,i) => `<th class="col-238 ${MAIN_IDS.has(c.id)?'':'col-non-main'} ${i===0?'box-start':''}">${c.name}</th>`).join('')}<th class="col-238 box-end" style="color:var(--text-secondary)">Rec%</th></tr>
        </thead>
        <tbody>
          ${data.map((r, i) => {
            const d1 = r.averages['cwss138_main'], d2 = r.averages['cwss238_main'];
            return `<tr><td class="cs box-date-start box-date-end">${i+1}</td><td class="cd box-date-start box-date-end">${MONTHS[r.month]}</td>${c1.map((c,idx) => { const v = r.averages[c.id]; return `<td class="col-138 ${MAIN_IDS.has(c.id)?'':'col-non-main'} ${idx===0?'box-start':''} ${v > 0 ? 'cv' : 'ce'}">${fmtNum(v)}</td>`; }).join('')}${getRecHtml(d1, 142000, 'col-138')}${c2.map((c,idx) => { const v = r.averages[c.id]; return `<td class="col-238 ${MAIN_IDS.has(c.id)?'':'col-non-main'} ${idx===0?'box-start':''} ${v > 0 ? 'cv' : 'ce'}">${fmtNum(v)}</td>`; }).join('')}${getRecHtml(d2, 14000, 'col-238')}</tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
    </div>`;

  // PDF dropdown toggle
  const dropdown = el.querySelector('#pdfDropdownYear');
  const trigger = el.querySelector('#pdfTriggerYear');

  trigger.onclick = (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  };

  document.addEventListener('click', () => dropdown.classList.remove('open'), { once: false });

  // Download ALL
  el.querySelector('#dlYearPdfAll').onclick = (e) => {
    e.stopPropagation();
    dropdown.classList.remove('open');
    triggerYearPrint(year, false);
  };

  // Download MAIN only
  el.querySelector('#dlYearPdfMain').onclick = (e) => {
    e.stopPropagation();
    dropdown.classList.remove('open');
    triggerYearPrint(year, true);
  };
}

function triggerYearPrint(year, mainOnly) {
  const originalTitle = document.title;
  const suffix = mainOnly ? '_MainOnly' : '';
  document.title = `Kudineer_Index_${year}${suffix}`;

  // For main-only: adjust colspans on group headers
  const savedColspans = [];
  if (mainOnly) {
    document.body.classList.add('print-main-only');
    document.querySelectorAll('.col-group-138, .col-group-238').forEach(th => {
      savedColspans.push({ el: th, original: th.getAttribute('colspan') });
      const scheme = th.classList.contains('col-group-138') ? 'CWSS-138' : 'CWSS-238';
      const allCols = LITRES_COLUMNS.filter(m => m.scheme === scheme);
      const mainCount = allCols.filter(m => MAIN_IDS.has(m.id)).length;
      th.setAttribute('colspan', mainCount + 1); // +1 for Dev % column which we always show in main
    });
  }

  window.print();

  setTimeout(() => {
    document.title = originalTitle;
    document.body.classList.remove('print-main-only');
    savedColspans.forEach(({ el, original }) => {
      if (original) el.setAttribute('colspan', original);
    });
  }, 500);
}

