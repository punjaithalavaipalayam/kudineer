/* settings.js */
import { getSettings, saveSettings, exportCSV, clearAllData, seedSampleData } from '../lib/store.js';
import { showToast } from '../main.js';

export function renderSettings(el, cbs) {
  const s = getSettings();
  el.innerHTML = `
    <div class="section-header"><div class="section-title">⚙️ Settings</div><div class="section-subtitle">Preferences & data management</div></div>
    <div class="settings-list">
      <div class="settings-item" id="sTheme"><div class="settings-item-left"><span class="settings-icon">🌓</span><div><div class="settings-label">Dark Mode</div><div class="settings-desc">Toggle light / dark theme</div></div></div><button class="toggle ${s.theme==='dark'?'active':''}" id="tSwitch"></button></div>
      <div class="settings-item" id="sPin"><div class="settings-item-left"><span class="settings-icon">🔐</span><div><div class="settings-label">Admin PIN</div><div class="settings-desc">Current: ${s.pin||'1234'}</div></div></div><span class="settings-value">Change →</span></div>
      <div class="settings-item" id="sSeed"><div class="settings-item-left"><span class="settings-icon">📥</span><div><div class="settings-label">Load Sample Data</div><div class="settings-desc">Demo readings (Aug 2026, 5 days)</div></div></div><span class="settings-value">Load →</span></div>
      <div class="settings-item" id="sExport"><div class="settings-item-left"><span class="settings-icon">📤</span><div><div class="settings-label">Export as CSV</div><div class="settings-desc">Download all readings</div></div></div><span class="settings-value">Export →</span></div>
      <div class="settings-item" id="sClear" style="border-color:rgba(239,68,68,0.2)"><div class="settings-item-left"><span class="settings-icon">🗑️</span><div><div class="settings-label" style="color:var(--danger)">Clear All Data</div><div class="settings-desc">Permanently remove all readings</div></div></div><span class="settings-value" style="color:var(--danger)">Clear →</span></div>
    </div>
    <div class="card" style="margin-top:18px;text-align:center">
      <p style="font-size:.95rem;font-weight:900;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent">💧 Kudineer</p>
      <p style="font-size:.68rem;color:var(--text-muted);margin-top:3px">Water Meter Tracker v2.0 • CWSS 138/238</p>
    </div>`;

  el.querySelector('#tSwitch').onclick = e => { e.currentTarget.classList.toggle('active'); const t = e.currentTarget.classList.contains('active')?'dark':'light'; s.theme=t; saveSettings(s); cbs?.onThemeChange?.(t); };
  el.querySelector('#sPin').onclick = () => { const p = prompt('New 4-digit PIN:', s.pin); if(p?.length===4&&/^\d+$/.test(p)){s.pin=p;saveSettings(s);showToast('🔐 PIN updated');renderSettings(el,cbs);}else if(p) showToast('⚠️ Must be 4 digits'); };
  el.querySelector('#sSeed').onclick = () => { seedSampleData(); showToast('📥 Sample data loaded!'); cbs?.onRefresh?.(); };
  el.querySelector('#sExport').onclick = () => { const b=new Blob([exportCSV()],{type:'text/csv'}), u=URL.createObjectURL(b), a=document.createElement('a'); a.href=u; a.download='kudineer_readings.csv'; a.click(); URL.revokeObjectURL(u); showToast('📤 Exported'); };
  el.querySelector('#sClear').onclick = () => { if(confirm('⚠️ Delete ALL data?')){clearAllData();showToast('🗑️ Cleared');cbs?.onRefresh?.();} };
}
