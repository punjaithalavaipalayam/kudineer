/* yearly-summary.js */
import { MONTHS, LITRES_COLUMNS, fmtNum } from '../lib/calculations.js';
import { getYearlySummary } from '../lib/store.js';

// Main-only meter IDs
const MAIN_IDS = new Set(['cwss138_main', 'cwss238_main']);

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
      <div class="pdf-dropdown" id="pdfDropdownYear">
        <button class="pdf-trigger" id="pdfTriggerYear">
          <span class="pdf-trigger-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </span>
          <span>Download PDF</span>
          <span class="pdf-trigger-chevron">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
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
    <div class="stats-grid">
      <div class="stat-card highlight"><span class="stat-icon">💧</span><div class="stat-value">${fmtNum(yearTotal)}</div><div class="stat-label">Total Litres</div></div>
      <div class="stat-card"><span class="stat-icon">📅</span><div class="stat-value">${monthsWithData}</div><div class="stat-label">Active Months</div></div>
      <div class="stat-card"><span class="stat-icon">📊</span><div class="stat-value">${monthsWithData > 0 ? fmtNum(Math.round(yearTotal / monthsWithData)) : '—'}</div><div class="stat-label">Avg / Month</div></div>
    </div>
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr><th rowspan="2" class="cs box-date-start box-date-end">S.No</th><th rowspan="2" class="cd box-date-start box-date-end">Month</th><th colspan="${c1.length}" class="gh col-group-138">CWSS-138 (Avg Litres)</th><th colspan="${c2.length}" class="gh2 col-group-238">CWSS-238 (Avg Litres)</th></tr>
          <tr>${c1.map((c,i) => `<th class="col-138 ${MAIN_IDS.has(c.id)?'':'col-non-main'} ${i===0?'box-start':''} ${i===c1.length-1?'box-end':''}">${c.name}</th>`).join('')}${c2.map((c,i) => `<th class="col-238 ${MAIN_IDS.has(c.id)?'':'col-non-main'} ${i===0?'box-start':''} ${i===c2.length-1?'box-end':''}">${c.name}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${data.map((r, i) => `<tr><td class="cs box-date-start box-date-end">${i+1}</td><td class="cd box-date-start box-date-end">${MONTHS[r.month]}</td>${c1.map((c,idx) => { const v = r.averages[c.id]; return `<td class="col-138 ${MAIN_IDS.has(c.id)?'':'col-non-main'} ${idx===0?'box-start':''} ${idx===c1.length-1?'box-end':''} ${v > 0 ? 'cv' : 'ce'}">${fmtNum(v)}</td>`; }).join('')}${c2.map((c,idx) => { const v = r.averages[c.id]; return `<td class="col-238 ${MAIN_IDS.has(c.id)?'':'col-non-main'} ${idx===0?'box-start':''} ${idx===c2.length-1?'box-end':''} ${v > 0 ? 'cv' : 'ce'}">${fmtNum(v)}</td>`; }).join('')}</tr>`).join('')}
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
      th.setAttribute('colspan', mainCount);
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

