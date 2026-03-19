/* monthly-sheet.js – Excel-like monthly table with MLD/Litres toggle */
import { METERS, LITRES_COLUMNS, MONTHS, fmtDateDisplay, fmtNum } from '../lib/calculations.js';
import { getMonthlyTable } from '../lib/store.js';

// Persisted view mode
let viewMode = 'litres'; // 'mld' | 'litres'

// Main-only meter IDs
const MAIN_IDS = new Set(['cwss138_main', 'cwss238_main']);

export function renderMonthlySheet(el, selMonth, selYear) {
  const month = selMonth ?? new Date().getMonth();
  const year = selYear ?? 2026;
  const rows = getMonthlyTable(month, year);

  const mldMeters  = METERS; // columns for MLD view
  const litMeters  = LITRES_COLUMNS; // columns for Litres view
  const c138m = mldMeters.filter(m => m.scheme === 'CWSS-138');
  const c238m = mldMeters.filter(m => m.scheme === 'CWSS-238');
  const c138l = litMeters.filter(c => c.scheme === 'CWSS-138');
  const c238l = litMeters.filter(c => c.scheme === 'CWSS-238');

  const isMLD = viewMode === 'mld';

  el.innerHTML = `
    <div class="print-only">
      <h1>Kudineer</h1>
      <p>Punjai Thalavaipalayam CWSS 138/238 — ${MONTHS[month]} ${year} ${isMLD ? '(MLD)' : '(Litres)'}</p>
    </div>

    <div class="section-header" style="display:flex; justify-content:space-between; align-items:flex-start">
      <div>
        <div class="section-title">📋 Monthly Readings</div>
        <div class="section-subtitle">Punjai Thalavaipalayam CWSS 138/238</div>
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
          <span>Download PDF</span>
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
              <span class="pdf-menu-label">All Readings</span>
              <span class="pdf-menu-desc">Every meter column included</span>
            </div>
          </button>
          <button class="pdf-menu-item" id="dlPdfMain">
            <span class="pdf-menu-icon">🎯</span>
            <div class="pdf-menu-text">
              <span class="pdf-menu-label">Main Readings Only</span>
              <span class="pdf-menu-desc">CWSS-138 & 238 Main Entrance</span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <div class="filters-bar">
      <div class="select-wrap">
        <select id="mSel">${MONTHS.map((m,i) => `<option value="${i}"${i===month?' selected':''}>${m}</option>`).join('')}</select>
      </div>
      <div class="select-wrap" style="max-width:90px">
        <select id="ySel">
          <option value="2025">2025</option>
          <option value="2026" selected>2026</option>
          <option value="2027">2027</option>
        </select>
      </div>
      <div class="view-toggle-group">
        <button class="view-toggle-btn ${!isMLD ? '' : 'active'}" data-mode="mld">MLD</button>
        <button class="view-toggle-btn ${isMLD ? '' : 'active'}" data-mode="litres">Litres</button>
      </div>
    </div>

    ${isMLD ? renderMLDTable(rows, c138m, c238m) : renderLitresTable(rows, c138l, c238l)}
  `;

  // Month / Year change
  el.querySelector('#mSel').onchange = e => renderMonthlySheet(el, +e.target.value, +el.querySelector('#ySel').value);
  el.querySelector('#ySel').onchange = e => renderMonthlySheet(el, +el.querySelector('#mSel').value, +e.target.value);

  // View toggle
  el.querySelectorAll('.view-toggle-btn').forEach(btn => {
    btn.onclick = () => {
      viewMode = btn.dataset.mode;
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
  document.title = `Kudineer_${MONTHS[month]}_${year}_${isMLD ? 'MLD' : 'Litres'}${suffix}`;

  // For main-only: adjust colspans on group headers so 238 doesn't slide under 138
  const savedColspans = [];
  if (mainOnly) {
    document.body.classList.add('print-main-only');
    document.querySelectorAll('.col-group-138, .col-group-238').forEach(th => {
      savedColspans.push({ el: th, original: th.getAttribute('colspan') });
      // Count only main columns in this group
      const scheme = th.classList.contains('col-group-138') ? 'CWSS-138' : 'CWSS-238';
      const allCols = scheme === 'CWSS-138'
        ? (isMLD ? METERS : LITRES_COLUMNS).filter(m => m.scheme === 'CWSS-138')
        : (isMLD ? METERS : LITRES_COLUMNS).filter(m => m.scheme === 'CWSS-238');
      const mainCount = allCols.filter(m => MAIN_IDS.has(m.id)).length;
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
function renderMLDTable(rows, c138, c238) {
  return `
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th rowspan="2" class="cd box-date-start box-date-end" style="min-width:40px;">Date</th>
            <th colspan="${c138.length}" class="gh col-group-138">CWSS-138 (MLD)</th>
            <th colspan="${c238.length}" class="gh2 col-group-238">CWSS-238</th>
          </tr>
          <tr>
            ${c138.map((m,i) => `<th class="col-138 ${MAIN_IDS.has(m.id)?'':'col-non-main'} ${i===0?'box-start':''} ${i===c138.length-1?'box-end':''}">${m.shortName}</th>`).join('')}
            ${c238.map((m,i) => `<th class="col-238 ${MAIN_IDS.has(m.id)?'':'col-non-main'} ${i===0?'box-start':''} ${i===c238.length-1?'box-end':''}">${m.shortName}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => {
            if (r.isTotal) return `<tr class="row-total"><td class="box-date-start box-date-end" style="font-weight:800;text-align:center;">Tot</td>${c138.map((m,i)=>`<td class="col-138 ${MAIN_IDS.has(m.id)?'':'col-non-main'} ${i===0?'box-start':''} ${i===c138.length-1?'box-end':''}"></td>`).join('')}${c238.map((m,i)=>`<td class="col-238 ${MAIN_IDS.has(m.id)?'':'col-non-main'} ${i===0?'box-start':''} ${i===c238.length-1?'box-end':''}"></td>`).join('')}</tr>`;
            if (r.isAvg)   return `<tr class="row-avg"><td class="box-date-start box-date-end" style="font-weight:700;text-align:center;">Avg</td>${c138.map((m,i)=>`<td class="col-138 ${MAIN_IDS.has(m.id)?'':'col-non-main'} ${i===0?'box-start':''} ${i===c138.length-1?'box-end':''}"></td>`).join('')}${c238.map((m,i)=>`<td class="col-238 ${MAIN_IDS.has(m.id)?'':'col-non-main'} ${i===0?'box-start':''} ${i===c238.length-1?'box-end':''}"></td>`).join('')}</tr>`;
            return `<tr class="${r.isBase ? 'row-base' : ''}">
              <td class="cd box-date-start box-date-end" style="text-align:center;">${r.isBase ? 'Base' : formatDayOnly(r.date)}</td>
              ${c138.map((m,i) => { const v = r.mld[m.id]; return `<td class="col-138 ${MAIN_IDS.has(m.id)?'':'col-non-main'} ${i===0?'box-start':''} ${i===c138.length-1?'box-end':''} ${v!=null?'cv':'ce'}">${v!=null ? fmtNum(v) : '—'}</td>`; }).join('')}
              ${c238.map((m,i) => { const v = r.mld[m.id]; return `<td class="col-238 ${MAIN_IDS.has(m.id)?'':'col-non-main'} ${i===0?'box-start':''} ${i===c238.length-1?'box-end':''} ${v!=null?'cv':'ce'}">${v!=null ? fmtNum(v) : '—'}</td>`; }).join('')}
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

/* ---------- Litres Table ---------- */
function renderLitresTable(rows, c138, c238) {
  return `
    <div class="table-wrapper">
      <table class="data-table" style="min-width:100%">
        <thead>
          <tr>
            <th rowspan="2" class="cd box-date-start box-date-end" style="min-width:40px;">Date</th>
            <th colspan="${c138.length}" class="gh col-group-138">CWSS-138 (Litres)</th>
            <th colspan="${c238.length}" class="gh2 col-group-238">CWSS-238</th>
          </tr>
          <tr>
            ${c138.map((c,i) => `<th class="col-138 ${MAIN_IDS.has(c.id)?'':'col-non-main'} ${i===0?'box-start':''} ${i===c138.length-1?'box-end':''}">${c.name.replace('Main Ent','Main').replace('MGP C&EK','C&EK')}</th>`).join('')}
            ${c238.map((c,i) => `<th class="col-238 ${MAIN_IDS.has(c.id)?'':'col-non-main'} ${i===0?'box-start':''} ${i===c238.length-1?'box-end':''}">${c.name.replace('Main Ent','Main')}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => {
            if (r.isTotal) {
              return `<tr class="row-total"><td class="box-date-start box-date-end" style="font-weight:800;text-align:center;">Tot</td>${c138.map((c,i) => `<td class="col-138 ${MAIN_IDS.has(c.id)?'':'col-non-main'} ${i===0?'box-start':''} ${i===c138.length-1?'box-end':''} ${r.litres[c.id]>0?'cv':''}">${fmtNum(r.litres[c.id])}</td>`).join('')}${c238.map((c,i) => `<td class="col-238 ${MAIN_IDS.has(c.id)?'':'col-non-main'} ${i===0?'box-start':''} ${i===c238.length-1?'box-end':''} ${r.litres[c.id]>0?'cv':''}">${fmtNum(r.litres[c.id])}</td>`).join('')}</tr>`;
            }
            if (r.isAvg) {
              return `<tr class="row-avg"><td class="box-date-start box-date-end" style="font-weight:700;text-align:center;">Avg</td>${c138.map((c,i) => `<td class="col-138 ${MAIN_IDS.has(c.id)?'':'col-non-main'} ${i===0?'box-start':''} ${i===c138.length-1?'box-end':''} ${r.litres[c.id]!=null?'cv':''}">${fmtNum(r.litres[c.id])}</td>`).join('')}${c238.map((c,i) => `<td class="col-238 ${MAIN_IDS.has(c.id)?'':'col-non-main'} ${i===0?'box-start':''} ${i===c238.length-1?'box-end':''} ${r.litres[c.id]!=null?'cv':''}">${fmtNum(r.litres[c.id])}</td>`).join('')}</tr>`;
            }
            if (r.isBase) {
              return `<tr class="row-base"><td class="cd box-date-start box-date-end" style="text-align:center;">Base</td>${c138.map((c,i) => `<td class="col-138 ${MAIN_IDS.has(c.id)?'':'col-non-main'} ${i===0?'box-start':''} ${i===c138.length-1?'box-end':''} ce">—</td>`).join('')}${c238.map((c,i) => `<td class="col-238 ${MAIN_IDS.has(c.id)?'':'col-non-main'} ${i===0?'box-start':''} ${i===c238.length-1?'box-end':''} ce">—</td>`).join('')}</tr>`;
            }
            return `<tr>
              <td class="cd box-date-start box-date-end" style="text-align:center;">${formatDayOnly(r.date)}</td>
              ${c138.map((c,i) => { const v = r.litres[c.id]; return `<td class="col-138 ${MAIN_IDS.has(c.id)?'':'col-non-main'} ${i===0?'box-start':''} ${i===c138.length-1?'box-end':''} ${v!=null?'cv':'ce'}">${v!=null ? fmtNum(v) : '—'}</td>`; }).join('')}
              ${c238.map((c,i) => { const v = r.litres[c.id]; return `<td class="col-238 ${MAIN_IDS.has(c.id)?'':'col-non-main'} ${i===0?'box-start':''} ${i===c238.length-1?'box-end':''} ${v!=null?'cv':'ce'}">${v!=null ? fmtNum(v) : '—'}</td>`; }).join('')}
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}
