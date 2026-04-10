/* yearly-summary.js */
import { LITRES_COLUMNS, fmtNum } from '../lib/calculations.js';
import { getYearlySummary } from '../lib/store.js';
import { t, getMonthName, getMonthNames } from '../lib/i18n.js';

// Main-only meter IDs
const MAIN_IDS = new Set(['cwss138_main', 'cwss238_main']);

export function renderYearlySummary(el, selectedYear) {
  const currentYear = new Date().getFullYear();
  const availableYears = [];
  for (let y = 2025; y <= currentYear; y++) availableYears.push(y);
  const year = selectedYear || currentYear;
  const data = getYearlySummary(year);
  const c1 = LITRES_COLUMNS.filter(c => c.scheme === 'CWSS-138'), c2 = LITRES_COLUMNS.filter(c => c.scheme === 'CWSS-238');

  // Aggregate year stats per scheme (MAIN only)
  const curYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const monthsPassedInYear = (year === curYear) ? currentMonth : 12;

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

  const monthNames = getMonthNames();

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
    <div style="overflow:hidden; max-width:100%">
    <div class="print-only">
      <h1>${t('print_title')}</h1>
      <p>CWSS 138/238 — ${year} Index (${t('avg_ltrs')})</p>
    </div>

    <!-- Section Header with PDF Download -->
    <div class="section-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px">
      <div>
        <div style="margin-bottom:6px">
          <select id="yearSelect" style="padding:6px 12px;border-radius:8px;border:1px solid var(--border);background:var(--card-bg);color:var(--text);font-size:0.9rem;font-weight:700;cursor:pointer">
            ${availableYears.map(y => `<option value="${y}" ${y === year ? 'selected' : ''}>📊 ${y}</option>`).join('')}
          </select>
        </div>
        <div class="section-title">${t('yearly_summary')}</div>
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
          <span>${t('download_pdf')}</span>
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
              <span class="pdf-menu-label">${t('all_readings')}</span>
              <span class="pdf-menu-desc">${t('all_readings_desc')}</span>
            </div>
          </button>
          <button class="pdf-menu-item" id="dlYearPdfMain">
            <span class="pdf-menu-icon">🎯</span>
            <div class="pdf-menu-text">
              <span class="pdf-menu-label">${t('main_readings_only')}</span>
              <span class="pdf-menu-desc">${t('main_readings_desc')}</span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- BOX: Litres Per Day Allotted -->
    <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:10px; padding:12px 16px; margin-bottom:10px; text-align:center">
      <div style="font-size:0.85rem; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:var(--text)">${t('litres_per_day_allotted')}</div>
    </div>

    <!-- Allotted: CWSS-138, CWSS-238, Total -->
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:14px">
      <div style="background:linear-gradient(135deg,#1e40af,#3b82f6); border-radius:12px; padding:14px 10px; color:#fff; text-align:center">
        <div style="font-size:0.65rem; opacity:0.8; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px">CWSS - 138</div>
        <div style="font-size:1.3rem; font-weight:800">${fmtNum(TARGET_138)}</div>
        <div style="font-size:0.6rem; opacity:0.7; margin-top:2px">${t('ltrs_per_day')}</div>
      </div>
      <div style="background:linear-gradient(135deg,#065f46,#10b981); border-radius:12px; padding:14px 10px; color:#fff; text-align:center">
        <div style="font-size:0.65rem; opacity:0.8; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px">CWSS - 238</div>
        <div style="font-size:1.3rem; font-weight:800">${fmtNum(TARGET_238)}</div>
        <div style="font-size:0.6rem; opacity:0.7; margin-top:2px">${t('ltrs_per_day')}</div>
      </div>
      <div style="background:linear-gradient(135deg,#4a1d96,#7c3aed); border-radius:12px; padding:14px 10px; color:#fff; text-align:center">
        <div style="font-size:0.65rem; opacity:0.8; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px">${t('total')}</div>
        <div style="font-size:1.3rem; font-weight:800">${fmtNum(TARGET_138 + TARGET_238)}</div>
        <div style="font-size:0.6rem; opacity:0.7; margin-top:2px">${t('ltrs_per_day')}</div>
      </div>
    </div>

    <!-- BOX: Yearly Summary of % Received -->
    <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:10px; padding:12px 16px; margin-bottom:10px; text-align:center">
      <div style="font-size:0.85rem; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:var(--text)">${t('yearly_pct_received')} (${t('till')} ${getMonthName(currentMonth - 1)} ${year})</div>
    </div>

    <!-- % Received: CWSS-138, CWSS-238, Combined -->
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-bottom:18px">
      <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb); border-radius:12px; padding:14px 10px; color:#fff; text-align:center">
        <div style="font-size:0.65rem; opacity:0.8; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px">CWSS - 138</div>
        <div style="font-size:0.7rem; opacity:0.7; margin-bottom:6px">${t('avg')}: ${fmtNum(avgDaily138)}</div>
        <div style="font-size:1.8rem; font-weight:900; color:${pct138 >= 100 ? '#86efac' : pct138 >= 75 ? '#fde68a' : pct138 >= 50 ? '#fdba74' : '#fca5a5'}">${pct138}%</div>
      </div>
      <div style="background:linear-gradient(135deg,#064e3b,#059669); border-radius:12px; padding:14px 10px; color:#fff; text-align:center">
        <div style="font-size:0.65rem; opacity:0.8; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px">CWSS - 238</div>
        <div style="font-size:0.7rem; opacity:0.7; margin-bottom:6px">${t('avg')}: ${fmtNum(avgDaily238)}</div>
        <div style="font-size:1.8rem; font-weight:900; color:${pct238 >= 100 ? '#86efac' : pct238 >= 75 ? '#fde68a' : pct238 >= 50 ? '#fdba74' : '#fca5a5'}">${pct238}%</div>
      </div>
      <div style="background:linear-gradient(135deg,#3b0764,#7c3aed); border-radius:12px; padding:14px 10px; color:#fff; text-align:center">
        <div style="font-size:0.65rem; opacity:0.8; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px">${t('combined')}</div>
        <div style="font-size:0.7rem; opacity:0.7; margin-bottom:6px">${t('avg')}: ${fmtNum(avgDaily138 + avgDaily238)}</div>
        <div style="font-size:1.8rem; font-weight:900; color:${(avgDaily138+avgDaily238) > 0 && Math.round(((avgDaily138+avgDaily238)/(TARGET_138+TARGET_238))*100) >= 100 ? '#86efac' : (avgDaily138+avgDaily238) > 0 && Math.round(((avgDaily138+avgDaily238)/(TARGET_138+TARGET_238))*100) >= 75 ? '#fde68a' : (avgDaily138+avgDaily238) > 0 && Math.round(((avgDaily138+avgDaily238)/(TARGET_138+TARGET_238))*100) >= 50 ? '#fdba74' : '#fca5a5'}">${(avgDaily138+avgDaily238) > 0 ? Math.round(((avgDaily138+avgDaily238)/(TARGET_138+TARGET_238))*100) : 0}%</div>
      </div>
    </div>
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr><th rowspan="2" class="cs box-date-start box-date-end">${t('sno')}</th><th rowspan="2" class="cd box-date-start box-date-end">${t('month')}</th><th colspan="${c1.length + 1}" class="gh col-group-138">CWSS-138 (${t('avg_ltrs')})</th><th colspan="${c2.length + 1}" class="gh2 col-group-238">CWSS-238 (${t('avg_ltrs')})</th></tr>
          <tr>${c1.map((c,i) => `<th class="col-138 ${MAIN_IDS.has(c.id)?'col-main-138':'col-non-main'} ${i===0?'box-start':''}">${c.name}</th>`).join('')}<th class="col-138 box-end" style="color:var(--text-secondary)">${t('rec_pct')}</th>${c2.map((c,i) => `<th class="col-238 ${MAIN_IDS.has(c.id)?'col-main-238':'col-non-main'} ${i===0?'box-start':''}">${c.name}</th>`).join('')}<th class="col-238 box-end" style="color:var(--text-secondary)">${t('rec_pct')}</th></tr>
        </thead>
        <tbody>
          ${data.map((r, i) => {
            const d1 = r.averages['cwss138_main'], d2 = r.averages['cwss238_main'];
            return `<tr><td class="cs box-date-start box-date-end">${i+1}</td><td class="cd box-date-start box-date-end">${monthNames[r.month]}</td>${c1.map((c,idx) => { const v = r.averages[c.id]; return `<td class="col-138 ${MAIN_IDS.has(c.id)?'col-main-138':'col-non-main'} ${idx===0?'box-start':''} ${v > 0 ? 'cv' : 'ce'}">${fmtNum(v)}</td>`; }).join('')}${getRecHtml(d1, 142000, 'col-138')}${c2.map((c,idx) => { const v = r.averages[c.id]; return `<td class="col-238 ${MAIN_IDS.has(c.id)?'col-main-238':'col-non-main'} ${idx===0?'box-start':''} ${v > 0 ? 'cv' : 'ce'}">${fmtNum(v)}</td>`; }).join('')}${getRecHtml(d2, 14000, 'col-238')}</tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Legend -->
    <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:10px; padding:14px 16px; margin-top:16px; overflow:hidden; word-wrap:break-word">
      <div style="font-size:0.82rem; font-weight:800; margin-bottom:10px; color:var(--text)">${t('legend_title')}</div>
      <div style="font-size:0.75rem; color:var(--text); line-height:2">
        <div><strong style="color:var(--accent)">Main/Main Ent</strong> — ${t('legend_main')}</div>
        <div class="col-non-main"><strong style="color:var(--accent)">C & EK</strong> — ${t('legend_cek')}</div>
        <div class="col-non-main"><strong style="color:var(--accent)">MGP</strong> — ${t('legend_mgp')}</div>
        <div class="col-non-main"><strong style="color:var(--accent)">Sump</strong> — ${t('legend_sump')}</div>
      </div>
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

  // Year selector
  el.querySelector('#yearSelect').onchange = (e) => {
    renderYearlySummary(el, Number(e.target.value));
  };
}

function triggerYearPrint(year, mainOnly) {
  const originalTitle = document.title;
  const suffix = mainOnly ? '_MainOnly' : '';
  document.title = `CWSS_138_238_Index_${year}${suffix}`;

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

