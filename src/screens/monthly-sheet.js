/* monthly-sheet.js – Excel-like monthly table with MLD/Litres toggle */
import { METERS, LITRES_COLUMNS, fmtNum } from '../lib/calculations.js';
import { getMonthlyTable } from '../lib/store.js';
import { t, getMonthNames } from '../lib/i18n.js';

// Persisted view modes
let viewMode = 'litres'; // 'mld' | 'litres'
let detailMode = 'summary'; // 'summary' | 'detailed'

// Main-only meter IDs
const MAIN_IDS = new Set(['cwss138_main', 'cwss238_main']);

export function renderMonthlySheet(el, selMonth, selYear) {
  const month = selMonth ?? new Date().getMonth();
  const year = selYear ?? 2026;
  const rows = getMonthlyTable(month, year);
  const monthNames = getMonthNames();

  const mldMeters  = METERS; // columns for MLD view
  const litMeters  = LITRES_COLUMNS; // columns for Litres view
  const c138m = mldMeters.filter(m => m.scheme === 'CWSS-138');
  const c238m = mldMeters.filter(m => m.scheme === 'CWSS-238');
  const c138l = litMeters.filter(c => c.scheme === 'CWSS-138');
  const c238l = litMeters.filter(c => c.scheme === 'CWSS-238');

  const isMLD = viewMode === 'mld';
  const isSummary = detailMode === 'summary';

  // Filter to main-only columns in summary mode
  const fc138m = isSummary ? c138m.filter(m => MAIN_IDS.has(m.id)) : c138m;
  const fc238m = isSummary ? c238m.filter(m => MAIN_IDS.has(m.id)) : c238m;
  const fc138l = isSummary ? c138l.filter(c => MAIN_IDS.has(c.id)) : c138l;
  const fc238l = isSummary ? c238l.filter(c => MAIN_IDS.has(c.id)) : c238l;

  el.innerHTML = `
    <div class="print-only">
      <h1>${t('print_title')}</h1>
      <p>CWSS 138/238 — ${monthNames[month]} ${year} ${isMLD ? '(MLD)' : `(${t('litres')})`}</p>
    </div>

    <div class="section-header" style="display:flex; justify-content:space-between; align-items:flex-start">
      <div>
        <div class="section-title">📋 ${t('monthly_readings')}</div>
      </div>
      <div class="pdf-dropdown" id="pdfDropdown">
        <button class="pdf-trigger" id="pdfTrigger">
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
        <div class="pdf-menu" id="pdfMenu">
          <button class="pdf-menu-item" id="dlPdfAll">
            <span class="pdf-menu-icon">📊</span>
            <div class="pdf-menu-text">
              <span class="pdf-menu-label">${t('all_readings')}</span>
              <span class="pdf-menu-desc">${t('all_readings_desc')}</span>
            </div>
          </button>
          <button class="pdf-menu-item" id="dlPdfMain">
            <span class="pdf-menu-icon">🎯</span>
            <div class="pdf-menu-text">
              <span class="pdf-menu-label">${t('main_readings_only')}</span>
              <span class="pdf-menu-desc">${t('main_readings_desc')}</span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <div class="filters-bar">
      <div class="select-wrap">
        <select id="mSel">${monthNames.map((m,i) => `<option value="${i}"${i===month?' selected':''}>${m}</option>`).join('')}</select>
      </div>
      <div class="select-wrap" style="max-width:90px">
        <select id="ySel">${Array.from({length: new Date().getFullYear() - 2024}, (_,i) => 2025 + i).map(y => `<option value="${y}"${y===year?' selected':''}>${y}</option>`).join('')}</select>
      </div>
      <div class="view-toggle-group">
        <button class="view-toggle-btn ${!isMLD ? '' : 'active'}" data-mode="mld">${t('mld')}</button>
        <button class="view-toggle-btn ${isMLD ? '' : 'active'}" data-mode="litres">${t('litres')}</button>
      </div>
      <div class="view-toggle-group">
        <button class="view-toggle-btn ${detailMode === 'summary' ? 'active' : ''}" data-detail="summary">${t('summary')}</button>
        <button class="view-toggle-btn ${detailMode === 'detailed' ? 'active' : ''}" data-detail="detailed">${t('detailed')}</button>
      </div>
    </div>

    ${isMLD ? renderMLDTable(rows, fc138m, fc238m, isSummary) : renderLitresTable(rows, fc138l, fc238l, isSummary)}

    <!-- Legend -->
    <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:10px; padding:14px 16px; margin-top:16px; overflow:hidden; word-wrap:break-word">
      <div style="font-size:0.82rem; font-weight:800; margin-bottom:10px; color:var(--text)">${t('legend_title')}</div>
      <div style="font-size:0.75rem; color:var(--text); line-height:2">
        <div><strong style="color:var(--accent)">Main/Main Ent</strong> — ${t('legend_main')}</div>
        ${isSummary ? '' : `<div class="col-non-main"><strong style="color:var(--accent)">C & EK</strong> — ${t('legend_cek')}</div>
        <div class="col-non-main"><strong style="color:var(--accent)">MGP</strong> — ${t('legend_mgp')}</div>
        <div class="col-non-main"><strong style="color:var(--accent)">Sump</strong> — ${t('legend_sump')}</div>`}
      </div>
    </div>
  `;

  // Month / Year change
  el.querySelector('#mSel').onchange = e => renderMonthlySheet(el, +e.target.value, +el.querySelector('#ySel').value);
  el.querySelector('#ySel').onchange = e => renderMonthlySheet(el, +el.querySelector('#mSel').value, +e.target.value);

  // View toggle (MLD/Litres)
  el.querySelectorAll('.view-toggle-btn[data-mode]').forEach(btn => {
    btn.onclick = () => {
      viewMode = btn.dataset.mode;
      renderMonthlySheet(el, +el.querySelector('#mSel').value, +el.querySelector('#ySel').value);
    };
  });

  // Detail toggle (Summary/Detailed)
  el.querySelectorAll('.view-toggle-btn[data-detail]').forEach(btn => {
    btn.onclick = () => {
      detailMode = btn.dataset.detail;
      renderMonthlySheet(el, +el.querySelector('#mSel').value, +el.querySelector('#ySel').value);
    };
  });

  // PDF dropdown toggle
  const dropdown = el.querySelector('#pdfDropdown');
  const trigger = el.querySelector('#pdfTrigger');
  const menu = el.querySelector('#pdfMenu');

  trigger.onclick = (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  };

  // Close dropdown when clicking outside
  document.addEventListener('click', () => dropdown.classList.remove('open'), { once: false });

  // Download ALL
  el.querySelector('#dlPdfAll').onclick = (e) => {
    e.stopPropagation();
    dropdown.classList.remove('open');
    triggerPrint(month, year, isMLD, false);
  };

  // Download MAIN only
  el.querySelector('#dlPdfMain').onclick = (e) => {
    e.stopPropagation();
    dropdown.classList.remove('open');
    triggerPrint(month, year, isMLD, true);
  };
}

function triggerPrint(month, year, isMLD, mainOnly) {
  const originalTitle = document.title;
  const suffix = mainOnly ? '_MainOnly' : '';
  const monthNames = getMonthNames();
  document.title = `CWSS_138_238_${monthNames[month]}_${year}_${isMLD ? 'MLD' : 'Litres'}${suffix}`;

  // For main-only: adjust colspans on group headers so 238 doesn't slide under 138
  const savedColspans = [];
  if (mainOnly) {
    document.body.classList.add('print-main-only');
    document.querySelectorAll('.col-group-138, .col-group-238').forEach(th => {
      savedColspans.push({ el: th, original: th.getAttribute('colspan') });
      const scheme = th.classList.contains('col-group-138') ? 'CWSS-138' : 'CWSS-238';
      const allCols = th.textContent.includes('MLD') ? METERS : LITRES_COLUMNS;
      const schemeCols = allCols.filter(m => m.scheme === scheme);
      let mainCount = schemeCols.filter(m => MAIN_IDS.has(m.id)).length;
      if (th.textContent.includes('Ltrs') || th.textContent.includes(t('litres'))) mainCount += 1; // Preserve Rec% column
      th.setAttribute('colspan', mainCount);
    });
  }

  window.print();

  setTimeout(() => {
    document.title = originalTitle;
    document.body.classList.remove('print-main-only');
    // Restore original colspans
    savedColspans.forEach(({ el, original }) => {
      if (original) el.setAttribute('colspan', original);
    });
  }, 500);
}

// Custom short date formatter to save space
function formatDayOnly(dateStr) {
  if (!dateStr) return '—';
  return dateStr.split('-')[2]; // Extract just the day part e.g., '01'
}

/* ---------- MLD Table ---------- */
function renderMLDTable(rows, c138, c238, isSummary) {
  const totalColSpan138 = isSummary ? c138.length + 1 : c138.length;
  const totalColSpan238 = isSummary ? c238.length + 1 : c238.length;
  return `
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th rowspan="2" class="cd box-date-start box-date-end" style="min-width:40px;">${t('date')}</th>
            <th colspan="${totalColSpan138}" class="gh col-group-138">CWSS-138 (MLD)</th>
            <th colspan="${totalColSpan238}" class="gh2 col-group-238">CWSS-238 (MLD)</th>
          </tr>
          <tr>
            ${c138.map((m,i) => `<th class="col-138 ${MAIN_IDS.has(m.id)?'col-main-138':'col-non-main'} ${i===0?'box-start':''} ${!isSummary && i===c138.length-1?'box-end':''}">${m.shortName}</th>`).join('')}
            ${isSummary ? `<th class="col-138 box-end" style="color:var(--text-secondary)">${t('total')}</th>` : ''}
            ${c238.map((m,i) => `<th class="col-238 ${MAIN_IDS.has(m.id)?'col-main-238':'col-non-main'} ${i===0?'box-start':''} ${!isSummary && i===c238.length-1?'box-end':''}">${m.shortName}</th>`).join('')}
            ${isSummary ? `<th class="col-238 box-end" style="color:var(--text-secondary)">${t('total')}</th>` : ''}
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => {
            if (r.isTotal) {
              const t138 = r.litres?.['cwss138_main'], t238 = r.litres?.['cwss238_main'];
              const totalMLD138 = t138 != null ? t138 / 1000 : null;
              const totalMLD238 = t238 != null ? t238 / 1000 : null;
              const combinedMLD = (totalMLD138 || 0) + (totalMLD238 || 0);
              return `<tr class="row-total"><td class="box-date-start box-date-end" style="font-weight:800;text-align:center;">${t('tot')}</td>${c138.map((m,i)=>`<td class="col-138 ${MAIN_IDS.has(m.id)?'col-main-138':'col-non-main'} ${i===0?'box-start':''} ${!isSummary && i===c138.length-1?'box-end':''} ${isSummary && totalMLD138 ? 'cv' : ''}">${isSummary && totalMLD138 != null ? fmtNum(totalMLD138) : ''}</td>`).join('')}${isSummary ? `<td class="col-138 box-end ${combinedMLD > 0 ? 'cv' : ''}" style="font-weight:800">${combinedMLD > 0 ? fmtNum(combinedMLD) : '—'}</td>` : ''}${c238.map((m,i)=>`<td class="col-238 ${MAIN_IDS.has(m.id)?'col-main-238':'col-non-main'} ${i===0?'box-start':''} ${!isSummary && i===c238.length-1?'box-end':''} ${isSummary && totalMLD238 ? 'cv' : ''}">${isSummary && totalMLD238 != null ? fmtNum(totalMLD238) : ''}</td>`).join('')}${isSummary ? `<td class="col-238 box-end ${combinedMLD > 0 ? 'cv' : ''}" style="font-weight:800">${combinedMLD > 0 ? fmtNum(combinedMLD) : '—'}</td>` : ''}</tr>`;
            }
            if (r.isAvg) {
              const a138 = r.litres?.['cwss138_main'], a238 = r.litres?.['cwss238_main'];
              const avgMLD138 = a138 != null ? a138 / 1000 : null;
              const avgMLD238 = a238 != null ? a238 / 1000 : null;
              const combinedAvg = (avgMLD138 || 0) + (avgMLD238 || 0);
              return `<tr class="row-avg"><td class="box-date-start box-date-end" style="font-weight:700;text-align:center;">${t('avg')}</td>${c138.map((m,i)=>`<td class="col-138 ${MAIN_IDS.has(m.id)?'col-main-138':'col-non-main'} ${i===0?'box-start':''} ${!isSummary && i===c138.length-1?'box-end':''} ${isSummary && avgMLD138 ? 'cv' : ''}">${isSummary && avgMLD138 != null ? fmtNum(avgMLD138) : ''}</td>`).join('')}${isSummary ? `<td class="col-138 box-end ${combinedAvg > 0 ? 'cv' : ''}" style="font-weight:700">${combinedAvg > 0 ? fmtNum(combinedAvg) : '—'}</td>` : ''}${c238.map((m,i)=>`<td class="col-238 ${MAIN_IDS.has(m.id)?'col-main-238':'col-non-main'} ${i===0?'box-start':''} ${!isSummary && i===c238.length-1?'box-end':''} ${isSummary && avgMLD238 ? 'cv' : ''}">${isSummary && avgMLD238 != null ? fmtNum(avgMLD238) : ''}</td>`).join('')}${isSummary ? `<td class="col-238 box-end ${combinedAvg > 0 ? 'cv' : ''}" style="font-weight:700">${combinedAvg > 0 ? fmtNum(combinedAvg) : '—'}</td>` : ''}</tr>`;
            }
            // For summary MLD: show daily consumption (litres/1000) instead of raw cumulative
            if (isSummary) {
              const lit138 = r.litres?.['cwss138_main'];
              const lit238 = r.litres?.['cwss238_main'];
              const d138 = lit138 != null ? lit138 / 1000 : null;
              const d238 = lit238 != null ? lit238 / 1000 : null;
              const total = (d138 != null || d238 != null) ? (d138 || 0) + (d238 || 0) : null;
              return `<tr class="${r.isBase ? 'row-base' : ''}">
                <td class="cd box-date-start box-date-end" style="text-align:center;">${r.isBase ? t('base') : formatDayOnly(r.date)}</td>
                ${c138.map((m,i) => `<td class="col-138 col-main-138 ${i===0?'box-start':''} ${d138!=null?'cv':'ce'}">${r.isBase ? '—' : (d138!=null ? fmtNum(d138) : '—')}</td>`).join('')}
                <td class="col-138 box-end ${total!=null?'cv':'ce'}">${r.isBase ? '—' : (total!=null ? fmtNum(total) : '—')}</td>
                ${c238.map((m,i) => `<td class="col-238 col-main-238 ${i===0?'box-start':''} ${d238!=null?'cv':'ce'}">${r.isBase ? '—' : (d238!=null ? fmtNum(d238) : '—')}</td>`).join('')}
                <td class="col-238 box-end ${total!=null?'cv':'ce'}">${r.isBase ? '—' : (total!=null ? fmtNum(total) : '—')}</td>
              </tr>`;
            }
            return `<tr class="${r.isBase ? 'row-base' : ''}">
              <td class="cd box-date-start box-date-end" style="text-align:center;">${r.isBase ? t('base') : formatDayOnly(r.date)}</td>
              ${c138.map((m,i) => { const v = r.mld[m.id]; return `<td class="col-138 ${MAIN_IDS.has(m.id)?'col-main-138':'col-non-main'} ${i===0?'box-start':''} ${i===c138.length-1?'box-end':''} ${v!=null?'cv':'ce'}">${v!=null ? fmtNum(v) : '—'}</td>`; }).join('')}
              ${c238.map((m,i) => { const v = r.mld[m.id]; return `<td class="col-238 ${MAIN_IDS.has(m.id)?'col-main-238':'col-non-main'} ${i===0?'box-start':''} ${i===c238.length-1?'box-end':''} ${v!=null?'cv':'ce'}">${v!=null ? fmtNum(v) : '—'}</td>`; }).join('')}
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ---------- Litres Table ---------- */
function renderLitresTable(rows, c138, c238, isSummary) {
  const getRecHtml = (v, target, colClass) => {
    if (v == null || v <= 0) return `<td class="${colClass} box-end ce">—</td>`;
    const pct = Math.round((v / target) * 100);
    let color = 'var(--danger)';
    if (pct >= 100) color = 'var(--success)';
    else if (pct >= 75) color = '#f59e0b';
    else if (pct >= 50) color = '#f97316';
    return `<td class="${colClass} box-end" style="color:${color};font-weight:bold">${pct}%</td>`;
  };

  const extraCols = isSummary ? 2 : 1; // Total + Rec% in summary, just Rec% in detailed

  return `
    <div class="table-wrapper">
      <table class="data-table" style="min-width:100%">
        <thead>
          <tr>
            <th rowspan="2" class="cd box-date-start box-date-end" style="min-width:40px;">${t('date')}</th>
            <th colspan="${c138.length + extraCols}" class="gh col-group-138">CWSS-138 (${t('litres')})</th>
            <th colspan="${c238.length + extraCols}" class="gh2 col-group-238">CWSS-238 (${t('litres')})</th>
          </tr>
          <tr>
            ${c138.map((c,i) => `<th class="col-138 ${MAIN_IDS.has(c.id)?'col-main-138':'col-non-main'} ${i===0?'box-start':''}">${c.name.replace('Main Ent','Main').replace('MGP C&EK','C&EK')}</th>`).join('')}${isSummary ? `<th class="col-138" style="color:var(--text-secondary)">${t('total')}</th>` : ''}<th class="col-138 box-end" style="color:var(--text-secondary)">${t('rec_pct')}</th>
            ${c238.map((c,i) => `<th class="col-238 ${MAIN_IDS.has(c.id)?'col-main-238':'col-non-main'} ${i===0?'box-start':''}">${c.name.replace('Main Ent','Main')}</th>`).join('')}${isSummary ? `<th class="col-238" style="color:var(--text-secondary)">${t('total')}</th>` : ''}<th class="col-238 box-end" style="color:var(--text-secondary)">${t('rec_pct')}</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => {
            if (r.isTotal) {
              const t138 = r.litres['cwss138_main'] || 0, t238 = r.litres['cwss238_main'] || 0;
              const combined = t138 + t238;
              return `<tr class="row-total"><td class="box-date-start box-date-end" style="font-weight:800;text-align:center;">${t('tot')}</td>${c138.map((c,i) => `<td class="col-138 ${MAIN_IDS.has(c.id)?'col-main-138':'col-non-main'} ${i===0?'box-start':''} ${r.litres[c.id]>0?'cv':''}">${fmtNum(r.litres[c.id])}</td>`).join('')}${isSummary ? `<td class="col-138 ${combined>0?'cv':''}" style="font-weight:800">${fmtNum(combined)}</td>` : ''}<td class="col-138 box-end">—</td>${c238.map((c,i) => `<td class="col-238 ${MAIN_IDS.has(c.id)?'col-main-238':'col-non-main'} ${i===0?'box-start':''} ${r.litres[c.id]>0?'cv':''}">${fmtNum(r.litres[c.id])}</td>`).join('')}${isSummary ? `<td class="col-238 ${combined>0?'cv':''}" style="font-weight:800">${fmtNum(combined)}</td>` : ''}<td class="col-238 box-end">—</td></tr>`;
            }
            if (r.isAvg) {
              const d1 = r.litres['cwss138_main'], d2 = r.litres['cwss238_main'];
              const combinedAvg = (d1 || 0) + (d2 || 0);
              return `<tr class="row-avg"><td class="box-date-start box-date-end" style="font-weight:700;text-align:center;">${t('avg')}</td>${c138.map((c,i) => `<td class="col-138 ${MAIN_IDS.has(c.id)?'col-main-138':'col-non-main'} ${i===0?'box-start':''} ${r.litres[c.id]!=null?'cv':''}">${fmtNum(r.litres[c.id])}</td>`).join('')}${isSummary ? `<td class="col-138 ${combinedAvg>0?'cv':''}" style="font-weight:700">${fmtNum(combinedAvg)}</td>` : ''}${getRecHtml(d1, 142000, 'col-138')}${c238.map((c,i) => `<td class="col-238 ${MAIN_IDS.has(c.id)?'col-main-238':'col-non-main'} ${i===0?'box-start':''} ${r.litres[c.id]!=null?'cv':''}">${fmtNum(r.litres[c.id])}</td>`).join('')}${isSummary ? `<td class="col-238 ${combinedAvg>0?'cv':''}" style="font-weight:700">${fmtNum(combinedAvg)}</td>` : ''}${getRecHtml(d2, 14000, 'col-238')}</tr>`;
            }
            if (r.isBase) {
              return `<tr class="row-base"><td class="cd box-date-start box-date-end" style="text-align:center;">Base</td>${c138.map((c,i) => `<td class="col-138 ${MAIN_IDS.has(c.id)?'col-main-138':'col-non-main'} ${i===0?'box-start':''} ce">—</td>`).join('')}${isSummary ? '<td class="col-138 ce">—</td>' : ''}<td class="col-138 box-end">—</td>${c238.map((c,i) => `<td class="col-238 ${MAIN_IDS.has(c.id)?'col-main-238':'col-non-main'} ${i===0?'box-start':''} ce">—</td>`).join('')}${isSummary ? '<td class="col-238 ce">—</td>' : ''}<td class="col-238 box-end">—</td></tr>`;
            }
            const d1 = r.litres['cwss138_main'], d2 = r.litres['cwss238_main'];
            const totalLit = (d1 != null || d2 != null) ? (d1 || 0) + (d2 || 0) : null;
            return `<tr>
              <td class="cd box-date-start box-date-end" style="text-align:center;">${formatDayOnly(r.date)}</td>
              ${c138.map((c,i) => { const v = r.litres[c.id]; return `<td class="col-138 ${MAIN_IDS.has(c.id)?'col-main-138':'col-non-main'} ${i===0?'box-start':''} ${v!=null?'cv':'ce'}">${v!=null ? fmtNum(v) : '—'}</td>`; }).join('')}${isSummary ? `<td class="col-138 ${totalLit!=null?'cv':'ce'}">${totalLit!=null ? fmtNum(totalLit) : '—'}</td>` : ''}${getRecHtml(d1, 142000, 'col-138')}
              ${c238.map((c,i) => { const v = r.litres[c.id]; return `<td class="col-238 ${MAIN_IDS.has(c.id)?'col-main-238':'col-non-main'} ${i===0?'box-start':''} ${v!=null?'cv':'ce'}">${v!=null ? fmtNum(v) : '—'}</td>`; }).join('')}${isSummary ? `<td class="col-238 ${totalLit!=null?'cv':'ce'}">${totalLit!=null ? fmtNum(totalLit) : '—'}</td>` : ''}${getRecHtml(d2, 14000, 'col-238')}
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}
