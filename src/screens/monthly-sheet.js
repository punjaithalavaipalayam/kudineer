/* monthly-sheet.js – Excel-like monthly table with MLD/Litres toggle */
import { METERS, LITRES_COLUMNS, MONTHS, fmtDateDisplay, fmtNum } from '../lib/calculations.js';
import { getMonthlyTable } from '../lib/store.js';

// Persisted view mode
let viewMode = 'litres'; // 'mld' | 'litres'

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
    <div class="section-header" style="display:flex; justify-content:space-between; align-items:flex-start">
      <div>
        <div class="section-title">📋 Monthly Readings</div>
        <div class="section-subtitle">Punjai Thalavaipalayam CWSS 138/238</div>
      </div>
      <button class="btn btn-ghost" id="dlPdf" style="padding:6px 12px; font-size:0.75rem; border-color:var(--accent); color:var(--accent)"><span style="font-size:1rem; margin-right:4px">📥</span> PDF</button>
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

  // Download PDF
  el.querySelector('#dlPdf').onclick = () => {
    const originalTitle = document.title;
    document.title = `Kudineer_${MONTHS[month]}_${year}_${isMLD ? 'MLD' : 'Litres'}`;
    window.print();
    // Revert title after print dialog closes
    setTimeout(() => { document.title = originalTitle; }, 500);
  };
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
            <th rowspan="2" style="min-width:40px">Date</th>
            <th colspan="${c138.length}" class="gh">CWSS-138 (MLD)</th>
            <th colspan="${c238.length}" class="gh2">CWSS-238</th>
          </tr>
          <tr>
            ${c138.map((m,i) => `<th class="col-138 ${i===0?'box-start':''} ${i===c138.length-1?'box-end':''}">${m.shortName}</th>`).join('')}
            ${c238.map((m,i) => `<th class="col-238 ${i===0?'box-start':''} ${i===c238.length-1?'box-end':''}">${m.shortName}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => {
            if (r.isTotal) return `<tr class="row-total"><td style="font-weight:800;text-align:center;border-right:2px solid var(--border)">Tot</td>${c138.map((_,i)=>`<td class="col-138 ${i===0?'box-start':''} ${i===c138.length-1?'box-end':''}"></td>`).join('')}${c238.map((_,i)=>`<td class="col-238 ${i===0?'box-start':''} ${i===c238.length-1?'box-end':''}"></td>`).join('')}</tr>`;
            if (r.isAvg)   return `<tr class="row-avg"><td style="font-weight:700;text-align:center;border-right:2px solid var(--border)">Avg</td>${c138.map((_,i)=>`<td class="col-138 ${i===0?'box-start':''} ${i===c138.length-1?'box-end':''}"></td>`).join('')}${c238.map((_,i)=>`<td class="col-238 ${i===0?'box-start':''} ${i===c238.length-1?'box-end':''}"></td>`).join('')}</tr>`;
            return `<tr class="${r.isBase ? 'row-base' : ''}">
              <td class="cd" style="text-align:center;border-right:2px solid var(--border)">${r.isBase ? 'Base' : formatDayOnly(r.date)}</td>
              ${c138.map((m,i) => { const v = r.mld[m.id]; return `<td class="col-138 ${i===0?'box-start':''} ${i===c138.length-1?'box-end':''} ${v!=null?'cv':'ce'}">${v!=null ? fmtNum(v) : '—'}</td>`; }).join('')}
              ${c238.map((m,i) => { const v = r.mld[m.id]; return `<td class="col-238 ${i===0?'box-start':''} ${i===c238.length-1?'box-end':''} ${v!=null?'cv':'ce'}">${v!=null ? fmtNum(v) : '—'}</td>`; }).join('')}
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
            <th rowspan="2" style="min-width:40px">Date</th>
            <th colspan="${c138.length}" class="gh">CWSS-138 (Litres)</th>
            <th colspan="${c238.length}" class="gh2">CWSS-238</th>
          </tr>
          <tr>
            ${c138.map((c,i) => `<th class="col-138 ${i===0?'box-start':''} ${i===c138.length-1?'box-end':''}">${c.name.replace('Main Ent','Main').replace('MGP C&EK','C&EK')}</th>`).join('')}
            ${c238.map((c,i) => `<th class="col-238 ${i===0?'box-start':''} ${i===c238.length-1?'box-end':''}">${c.name.replace('Main Ent','Main')}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => {
            if (r.isTotal) {
              return `<tr class="row-total"><td style="font-weight:800;text-align:center;border-right:2px solid var(--border)">Tot</td>${c138.map((c,i) => `<td class="col-138 ${i===0?'box-start':''} ${i===c138.length-1?'box-end':''} ${r.litres[c.id]>0?'cv':''}">${fmtNum(r.litres[c.id])}</td>`).join('')}${c238.map((c,i) => `<td class="col-238 ${i===0?'box-start':''} ${i===c238.length-1?'box-end':''} ${r.litres[c.id]>0?'cv':''}">${fmtNum(r.litres[c.id])}</td>`).join('')}</tr>`;
            }
            if (r.isAvg) {
              return `<tr class="row-avg"><td style="font-weight:700;text-align:center;border-right:2px solid var(--border)">Avg</td>${c138.map((c,i) => `<td class="col-138 ${i===0?'box-start':''} ${i===c138.length-1?'box-end':''} ${r.litres[c.id]!=null?'cv':''}">${fmtNum(r.litres[c.id])}</td>`).join('')}${c238.map((c,i) => `<td class="col-238 ${i===0?'box-start':''} ${i===c238.length-1?'box-end':''} ${r.litres[c.id]!=null?'cv':''}">${fmtNum(r.litres[c.id])}</td>`).join('')}</tr>`;
            }
            if (r.isBase) {
              return `<tr class="row-base"><td class="cd" style="text-align:center;border-right:2px solid var(--border)">Base</td>${c138.map((_,i) => `<td class="col-138 ${i===0?'box-start':''} ${i===c138.length-1?'box-end':''} ce">—</td>`).join('')}${c238.map((_,i) => `<td class="col-238 ${i===0?'box-start':''} ${i===c238.length-1?'box-end':''} ce">—</td>`).join('')}</tr>`;
            }
            return `<tr>
              <td class="cd" style="text-align:center;border-right:2px solid var(--border)">${formatDayOnly(r.date)}</td>
              ${c138.map((c,i) => { const v = r.litres[c.id]; return `<td class="col-138 ${i===0?'box-start':''} ${i===c138.length-1?'box-end':''} ${v!=null?'cv':'ce'}">${v!=null ? fmtNum(v) : '—'}</td>`; }).join('')}
              ${c238.map((c,i) => { const v = r.litres[c.id]; return `<td class="col-238 ${i===0?'box-start':''} ${i===c238.length-1?'box-end':''} ${v!=null?'cv':'ce'}">${v!=null ? fmtNum(v) : '—'}</td>`; }).join('')}
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}
