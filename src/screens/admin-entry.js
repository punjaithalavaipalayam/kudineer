/* admin-entry.js */
import { METERS, calcConsumption, calcLitres, fmtNum, fmtDate, getTodayStr } from '../lib/calculations.js';
import { saveAllReadings, getPreviousReading } from '../lib/store.js';
import { showToast } from '../main.js';

export function renderAdminEntry(el, isAdmin) {
  const today = getTodayStr();
  // Allow admin to enter readings for last 7 days only
  const minDateObj = new Date(); minDateObj.setDate(minDateObj.getDate() - 7);
  const minDate = fmtDate(minDateObj);
  if (!isAdmin) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔐</div><div class="empty-state-text">Admin Access Required</div><div class="empty-state-sub">Tap the 👤 button in the top bar to unlock.</div></div>`;
    return;
  }
  el.innerHTML = `
    <div class="section-header"><div class="section-title">✏️ Add Readings</div><div class="section-subtitle">Enter MLD readings for all meters at once (last 7 days only)</div></div>
    <div class="form-group"><label class="form-label">📅 Select Date</label><input type="date" class="form-input" id="eDate" value="${today}" min="${minDate}" max="${today}"></div>
    <div class="entry-grid">${METERS.map(m => {
      const prev = getPreviousReading(today, m.id);
      return `<div class="entry-meter-card"><div class="meter-card-header"><span class="meter-name">${m.name}</span><span class="meter-scheme">${m.scheme}</span></div>
        <input type="number" class="form-input mri" data-m="${m.id}" placeholder="Enter MLD" inputmode="numeric" step="1">
        <div class="meter-prev" id="prev_${m.id}">Previous: <strong>${prev != null ? fmtNum(prev) : 'No data'}</strong></div>
        <div class="meter-result" id="res_${m.id}"></div></div>`;
    }).join('')}</div>
    <div class="preview-card" id="pCard" style="display:none"><div class="preview-title">📝 Preview</div><div id="pContent"></div></div>
    <button class="btn btn-primary btn-full btn-lg" id="saveBtn" style="margin-top:16px" disabled>💾 Save All Readings</button>`;

  const dateEl = el.querySelector('#eDate'), inputs = el.querySelectorAll('.mri'), saveBtn = el.querySelector('#saveBtn');

  function refresh() {
    const ds = dateEl.value; let ok = false, ph = '';
    METERS.forEach(m => { const p = getPreviousReading(ds, m.id); el.querySelector(`#prev_${m.id}`).innerHTML = `Previous: <strong>${p != null ? fmtNum(p) : 'No data'}</strong>`; });
    inputs.forEach(inp => {
      const mid = inp.dataset.m, val = inp.value ? +inp.value : null, prev = getPreviousReading(ds, mid), res = el.querySelector(`#res_${mid}`), meter = METERS.find(m => m.id === mid);
      if (val != null && !isNaN(val)) {
        const cons = calcConsumption(val, prev), lit = calcLitres(cons);
        if (cons != null && cons >= 0) { res.innerHTML = `<span class="result-chip result-consumption">${fmtNum(cons)} MLD</span><span class="result-chip result-litres">${fmtNum(lit)} L</span>`; ph += `<div class="preview-row"><span class="preview-label">${meter.scheme} ${meter.name}</span><span class="preview-value">${fmtNum(val)} → ${fmtNum(lit)} L</span></div>`; ok = true; }
        else if (cons != null) res.innerHTML = `<span class="result-chip result-error">⚠️ Below previous!</span>`;
        else { res.innerHTML = `<span class="result-chip result-consumption">First entry</span>`; ok = true; }
      } else res.innerHTML = '';
    });
    saveBtn.disabled = !ok;
    const pc = el.querySelector('#pCard'); if (ok) { pc.style.display = 'block'; el.querySelector('#pContent').innerHTML = ph; } else pc.style.display = 'none';
  }

  dateEl.onchange = refresh;
  inputs.forEach(i => { i.oninput = refresh; });
  saveBtn.onclick = () => {
    const ds = dateEl.value, readings = {};
    // Validate date: must be within last 7 days and not future
    if (ds > today) { showToast('❌ Future dates are not allowed'); return; }
    if (ds < minDate) { showToast('❌ Only last 7 days allowed for manual entry'); return; }
    inputs.forEach(i => { const v = i.value ? +i.value : null; if (v != null && !isNaN(v)) readings[i.dataset.m] = v; });
    saveAllReadings(ds, readings);
    showToast('✅ Readings saved!');
    inputs.forEach(i => { i.value = ''; el.querySelector(`#res_${i.dataset.m}`).innerHTML = ''; });
    saveBtn.disabled = true; el.querySelector('#pCard').style.display = 'none'; refresh();
  };
}
