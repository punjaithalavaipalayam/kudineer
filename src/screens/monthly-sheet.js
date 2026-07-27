/* monthly-sheet.js – Excel-like monthly table with MLD/Litres toggle */
import { METERS, LITRES_COLUMNS, fmtNum, recColor, TARGET_138, TARGET_238, TARGET_COMBINED } from '../lib/calculations.js';
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
      <button class="pdf-trigger" id="dlPdf">
        <span class="pdf-trigger-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </span>
        <span>${t('download_pdf')}</span>
      </button>
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

  // Download PDF based on current view mode
  el.querySelector('#dlPdf').onclick = () => {
    triggerPrint(month, year, isMLD, isSummary);
  };
}

function triggerPrint(month, year, isMLD, mainOnly) {
  const originalTitle = document.title;
  const suffix = mainOnly ? '_MainOnly' : '';
  const monthNames = getMonthNames();
  document.title = `CWSS_138_238_${monthNames[month]}_${year}_${isMLD ? 'MLD' : 'Litres'}${suffix}`;

  // Only apply print-main-only CSS hack when in Detailed mode and printing main-only.
  // In Summary mode the table is already rendered with only main columns — no adjustment needed.
  const needsHide = mainOnly && detailMode === 'detailed';
  const savedColspans = [];
  if (needsHide) {
    document.body.classList.add('print-main-only');
    document.querySelectorAll('.col-group-138, .col-group-238').forEach(th => {
      savedColspans.push({ el: th, original: th.getAttribute('colspan') });
      const scheme = th.classList.contains('col-group-138') ? 'CWSS-138' : 'CWSS-238';
      const allCols = th.textContent.includes('MLD') ? METERS : LITRES_COLUMNS;
      const schemeCols = allCols.filter(m => m.scheme === scheme);
      let mainCount = schemeCols.filter(m => MAIN_IDS.has(m.id)).length;
      if (th.textContent.includes('Ltrs') || th.textContent.includes(t('litres'))) mainCount += 1;
      th.setAttribute('colspan', mainCount);
    });
  }

  window.print();

  setTimeout(() => {
    document.title = originalTitle;
    if (needsHide) {
      document.body.classList.remove('print-main-only');
      savedColspans.forEach(({ el, original }) => {
        if (original) el.setAttribute('colspan', original);
      });
    }
  }, 500);
}

// Custom short date formatter to save space
function formatDayOnly(dateStr) {
  if (!dateStr) return '—';
  return dateStr.split('-')[2]; // Extract just the day part e.g., '01'
}

/* ---------- MLD Table ---------- */
function renderMLDTable(rows, c138, c238, isSummary) {
  if (isSummary) return renderSummaryMLDTable(rows);
  return `
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th rowspan="2" class="cd box-date-start box-date-end" style="min-width:40px;">${t('date')}</th>
            <th colspan="${c138.length}" class="gh col-group-138">CWSS-138 (MLD)</th>
            <th colspan="${c238.length}" class="gh2 col-group-238">CWSS-238 (MLD)</th>
          </tr>
          <tr>
            ${c138.map((m,i) => `<th class="col-138 ${MAIN_IDS.has(m.id)?'col-main-138':'col-non-main'} ${i===0?'box-start':''} ${i===c138.length-1?'box-end':''}">${m.shortName}</th>`).join('')}
            ${c238.map((m,i) => `<th class="col-238 ${MAIN_IDS.has(m.id)?'col-main-238':'col-non-main'} ${i===0?'box-start':''} ${i===c238.length-1?'box-end':''}">${m.shortName}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => {
            if (r.isTotal) return `<tr class="row-total"><td class="box-date-start box-date-end" style="font-weight:800;text-align:center;">${t('tot')}</td>${c138.map((m,i)=>`<td class="col-138 ${MAIN_IDS.has(m.id)?'col-main-138':'col-non-main'} ${i===0?'box-start':''} ${i===c138.length-1?'box-end':''}"></td>`).join('')}${c238.map((m,i)=>`<td class="col-238 ${MAIN_IDS.has(m.id)?'col-main-238':'col-non-main'} ${i===0?'box-start':''} ${i===c238.length-1?'box-end':''}"></td>`).join('')}</tr>`;
            if (r.isAvg) return `<tr class="row-avg"><td class="box-date-start box-date-end" style="font-weight:700;text-align:center;">${t('avg')}</td>${c138.map((m,i)=>`<td class="col-138 ${MAIN_IDS.has(m.id)?'col-main-138':'col-non-main'} ${i===0?'box-start':''} ${i===c138.length-1?'box-end':''}"></td>`).join('')}${c238.map((m,i)=>`<td class="col-238 ${MAIN_IDS.has(m.id)?'col-main-238':'col-non-main'} ${i===0?'box-start':''} ${i===c238.length-1?'box-end':''}"></td>`).join('')}</tr>`;
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

/* ---------- Summary MLD Table ---------- */
function renderSummaryMLDTable(rows) {
  const getRecHtml = (v) => {
    if (v == null || v <= 0) return `<td class="box-end ce">—</td>`;
    const pct = Math.round((v / TARGET_COMBINED) * 100);
    return `<td class="box-end" style="color:${recColor(pct)};font-weight:bold">${pct}%</td>`;
  };

  return `
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th rowspan="2" class="cd box-date-start box-date-end" style="min-width:40px;">${t('date')}</th>
            <th class="gh col-group-138 box-start box-end">CWSS-138</th>
            <th class="gh2 col-group-238 box-start box-end">CWSS-238</th>
            <th colspan="2" class="gh box-start box-end" style="background:linear-gradient(135deg,#4a1d96,#7c3aed);color:#fff">${t('total')} (MLD)</th>
          </tr>
          <tr>
            <th class="col-138 col-main-138 box-start box-end">Main</th>
            <th class="col-238 col-main-238 box-start box-end">Main</th>
            <th class="box-start">${t('total')}</th>
            <th class="box-end" style="color:var(--text-secondary)">${t('rec_pct')}</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => {
            if (r.isTotal) {
              const t138 = r.litres?.['cwss138_main'] != null ? r.litres['cwss138_main'] / 1000 : null;
              const t238 = r.litres?.['cwss238_main'] != null ? r.litres['cwss238_main'] / 1000 : null;
              const combined = (t138 || 0) + (t238 || 0);
              return `<tr class="row-total"><td class="box-date-start box-date-end" style="font-weight:800;text-align:center;">${t('tot')}</td><td class="col-138 col-main-138 box-start box-end ${t138?'cv':''}">${t138 != null ? fmtNum(t138) : '—'}</td><td class="col-238 col-main-238 box-start box-end ${t238?'cv':''}">${t238 != null ? fmtNum(t238) : '—'}</td><td class="box-start ${combined>0?'cv':''}" style="font-weight:800">${combined > 0 ? fmtNum(combined) : '—'}</td><td class="box-end">—</td></tr>`;
            }
            if (r.isAvg) {
              const a138 = r.litres?.['cwss138_main'] != null ? r.litres['cwss138_main'] / 1000 : null;
              const a238 = r.litres?.['cwss238_main'] != null ? r.litres['cwss238_main'] / 1000 : null;
              const combined = (a138 || 0) + (a238 || 0);
              const combinedLitres = (r.litres?.['cwss138_main'] || 0) + (r.litres?.['cwss238_main'] || 0);
              return `<tr class="row-avg"><td class="box-date-start box-date-end" style="font-weight:700;text-align:center;">${t('avg')}</td><td class="col-138 col-main-138 box-start box-end ${a138?'cv':''}">${a138 != null ? fmtNum(a138) : '—'}</td><td class="col-238 col-main-238 box-start box-end ${a238?'cv':''}">${a238 != null ? fmtNum(a238) : '—'}</td><td class="box-start ${combined>0?'cv':''}" style="font-weight:700">${combined > 0 ? fmtNum(combined) : '—'}</td>${getRecHtml(combinedLitres)}</tr>`;
            }
            const lit138 = r.litres?.['cwss138_main'];
            const lit238 = r.litres?.['cwss238_main'];
            const d138 = lit138 != null ? lit138 / 1000 : null;
            const d238 = lit238 != null ? lit238 / 1000 : null;
            const total = (d138 != null || d238 != null) ? (d138 || 0) + (d238 || 0) : null;
            const totalLitres = (lit138 != null || lit238 != null) ? (lit138 || 0) + (lit238 || 0) : null;
            return `<tr class="${r.isBase ? 'row-base' : ''}">
              <td class="cd box-date-start box-date-end" style="text-align:center;">${r.isBase ? t('base') : formatDayOnly(r.date)}</td>
              <td class="col-138 col-main-138 box-start box-end ${d138!=null?'cv':'ce'}">${r.isBase ? '—' : (d138 != null ? fmtNum(d138) : '—')}</td>
              <td class="col-238 col-main-238 box-start box-end ${d238!=null?'cv':'ce'}">${r.isBase ? '—' : (d238 != null ? fmtNum(d238) : '—')}</td>
              <td class="box-start ${total!=null?'cv':'ce'}">${r.isBase ? '—' : (total != null ? fmtNum(total) : '—')}</td>
              ${r.isBase ? '<td class="box-end ce">—</td>' : getRecHtml(totalLitres)}
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ---------- Litres Table ---------- */
function renderLitresTable(rows, c138, c238, isSummary) {
  if (isSummary) return renderSummaryLitresTable(rows);

  const getRecHtml = (v, target, colClass) => {
    if (v == null || v <= 0) return `<td class="${colClass} box-end ce">—</td>`;
    const pct = Math.round((v / target) * 100);
    return `<td class="${colClass} box-end" style="color:${recColor(pct)};font-weight:bold">${pct}%</td>`;
  };

  return `
    <div class="table-wrapper">
      <table class="data-table" style="min-width:100%">
        <thead>
          <tr>
            <th rowspan="2" class="cd box-date-start box-date-end" style="min-width:40px;">${t('date')}</th>
            <th colspan="${c138.length + 1}" class="gh col-group-138">CWSS-138 (${t('litres')})</th>
            <th colspan="${c238.length + 1}" class="gh2 col-group-238">CWSS-238 (${t('litres')})</th>
          </tr>
          <tr>
            ${c138.map((c,i) => `<th class="col-138 ${MAIN_IDS.has(c.id)?'col-main-138':'col-non-main'} ${i===0?'box-start':''}">${c.name.replace('Main Ent','Main').replace('MGP C&EK','C&EK')}</th>`).join('')}<th class="col-138 box-end" style="color:var(--text-secondary)">${t('rec_pct')}</th>
            ${c238.map((c,i) => `<th class="col-238 ${MAIN_IDS.has(c.id)?'col-main-238':'col-non-main'} ${i===0?'box-start':''}">${c.name.replace('Main Ent','Main')}</th>`).join('')}<th class="col-238 box-end" style="color:var(--text-secondary)">${t('rec_pct')}</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => {
            if (r.isTotal) {
              return `<tr class="row-total"><td class="box-date-start box-date-end" style="font-weight:800;text-align:center;">${t('tot')}</td>${c138.map((c,i) => `<td class="col-138 ${MAIN_IDS.has(c.id)?'col-main-138':'col-non-main'} ${i===0?'box-start':''} ${r.litres[c.id]>0?'cv':''}">${fmtNum(r.litres[c.id])}</td>`).join('')}<td class="col-138 box-end">—</td>${c238.map((c,i) => `<td class="col-238 ${MAIN_IDS.has(c.id)?'col-main-238':'col-non-main'} ${i===0?'box-start':''} ${r.litres[c.id]>0?'cv':''}">${fmtNum(r.litres[c.id])}</td>`).join('')}<td class="col-238 box-end">—</td></tr>`;
            }
            if (r.isAvg) {
              const d1 = r.litres['cwss138_main'], d2 = r.litres['cwss238_main'];
              return `<tr class="row-avg"><td class="box-date-start box-date-end" style="font-weight:700;text-align:center;">${t('avg')}</td>${c138.map((c,i) => `<td class="col-138 ${MAIN_IDS.has(c.id)?'col-main-138':'col-non-main'} ${i===0?'box-start':''} ${r.litres[c.id]!=null?'cv':''}">${fmtNum(r.litres[c.id])}</td>`).join('')}${getRecHtml(d1, TARGET_138, 'col-138')}${c238.map((c,i) => `<td class="col-238 ${MAIN_IDS.has(c.id)?'col-main-238':'col-non-main'} ${i===0?'box-start':''} ${r.litres[c.id]!=null?'cv':''}">${fmtNum(r.litres[c.id])}</td>`).join('')}${getRecHtml(d2, TARGET_238, 'col-238')}</tr>`;
            }
            if (r.isBase) {
              return `<tr class="row-base"><td class="cd box-date-start box-date-end" style="text-align:center;">Base</td>${c138.map((c,i) => `<td class="col-138 ${MAIN_IDS.has(c.id)?'col-main-138':'col-non-main'} ${i===0?'box-start':''} ce">—</td>`).join('')}<td class="col-138 box-end">—</td>${c238.map((c,i) => `<td class="col-238 ${MAIN_IDS.has(c.id)?'col-main-238':'col-non-main'} ${i===0?'box-start':''} ce">—</td>`).join('')}<td class="col-238 box-end">—</td></tr>`;
            }
            const d1 = r.litres['cwss138_main'], d2 = r.litres['cwss238_main'];
            return `<tr>
              <td class="cd box-date-start box-date-end" style="text-align:center;">${formatDayOnly(r.date)}</td>
              ${c138.map((c,i) => { const v = r.litres[c.id]; return `<td class="col-138 ${MAIN_IDS.has(c.id)?'col-main-138':'col-non-main'} ${i===0?'box-start':''} ${v!=null?'cv':'ce'}">${v!=null ? fmtNum(v) : '—'}</td>`; }).join('')}${getRecHtml(d1, TARGET_138, 'col-138')}
              ${c238.map((c,i) => { const v = r.litres[c.id]; return `<td class="col-238 ${MAIN_IDS.has(c.id)?'col-main-238':'col-non-main'} ${i===0?'box-start':''} ${v!=null?'cv':'ce'}">${v!=null ? fmtNum(v) : '—'}</td>`; }).join('')}${getRecHtml(d2, TARGET_238, 'col-238')}
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ---------- Summary Litres Table ---------- */
function renderSummaryLitresTable(rows) {
  const getRecHtml = (v) => {
    if (v == null || v <= 0) return `<td class="box-end ce">—</td>`;
    const pct = Math.round((v / TARGET_COMBINED) * 100);
    return `<td class="box-end" style="color:${recColor(pct)};font-weight:bold">${pct}%</td>`;
  };

  return `
    <div class="table-wrapper">
      <table class="data-table" style="min-width:100%">
        <thead>
          <tr>
            <th rowspan="2" class="cd box-date-start box-date-end" style="min-width:40px;">${t('date')}</th>
            <th class="gh col-group-138 box-start box-end">CWSS-138</th>
            <th class="gh2 col-group-238 box-start box-end">CWSS-238</th>
            <th colspan="2" class="gh box-start box-end" style="background:linear-gradient(135deg,#4a1d96,#7c3aed);color:#fff">${t('total')} (${t('litres')})</th>
          </tr>
          <tr>
            <th class="col-138 col-main-138 box-start box-end">Main</th>
            <th class="col-238 col-main-238 box-start box-end">Main</th>
            <th class="box-start">${t('total')}</th>
            <th class="box-end" style="color:var(--text-secondary)">${t('rec_pct')}</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => {
            if (r.isTotal) {
              const t138 = r.litres['cwss138_main'] || 0, t238 = r.litres['cwss238_main'] || 0;
              const combined = t138 + t238;
              return `<tr class="row-total"><td class="box-date-start box-date-end" style="font-weight:800;text-align:center;">${t('tot')}</td><td class="col-138 col-main-138 box-start box-end ${t138>0?'cv':''}">${fmtNum(t138)}</td><td class="col-238 col-main-238 box-start box-end ${t238>0?'cv':''}">${fmtNum(t238)}</td><td class="box-start ${combined>0?'cv':''}" style="font-weight:800">${fmtNum(combined)}</td><td class="box-end">—</td></tr>`;
            }
            if (r.isAvg) {
              const d1 = r.litres['cwss138_main'] || 0, d2 = r.litres['cwss238_main'] || 0;
              const combined = d1 + d2;
              return `<tr class="row-avg"><td class="box-date-start box-date-end" style="font-weight:700;text-align:center;">${t('avg')}</td><td class="col-138 col-main-138 box-start box-end ${d1>0?'cv':''}">${fmtNum(d1)}</td><td class="col-238 col-main-238 box-start box-end ${d2>0?'cv':''}">${fmtNum(d2)}</td><td class="box-start ${combined>0?'cv':''}" style="font-weight:700">${fmtNum(combined)}</td>${getRecHtml(combined)}</tr>`;
            }
            if (r.isBase) {
              return `<tr class="row-base"><td class="cd box-date-start box-date-end" style="text-align:center;">Base</td><td class="col-138 col-main-138 box-start box-end ce">—</td><td class="col-238 col-main-238 box-start box-end ce">—</td><td class="box-start ce">—</td><td class="box-end ce">—</td></tr>`;
            }
            const d1 = r.litres['cwss138_main'], d2 = r.litres['cwss238_main'];
            const totalLit = (d1 != null || d2 != null) ? (d1 || 0) + (d2 || 0) : null;
            return `<tr>
              <td class="cd box-date-start box-date-end" style="text-align:center;">${formatDayOnly(r.date)}</td>
              <td class="col-138 col-main-138 box-start box-end ${d1!=null?'cv':'ce'}">${d1 != null ? fmtNum(d1) : '—'}</td>
              <td class="col-238 col-main-238 box-start box-end ${d2!=null?'cv':'ce'}">${d2 != null ? fmtNum(d2) : '—'}</td>
              <td class="box-start ${totalLit!=null?'cv':'ce'}">${totalLit != null ? fmtNum(totalLit) : '—'}</td>
              ${getRecHtml(totalLit)}
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}
