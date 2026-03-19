/* settings.js */
import { getSettings, saveSettings, exportCSV, clearAllData, seedSampleData } from '../lib/store.js';
import { showToast } from '../main.js';

export function renderSettings(el, cbs) {
  const s = getSettings();
  el.innerHTML = `
    <div class="section-header"><div class="section-title">⚙️ Settings</div><div class="section-subtitle">Preferences & data management</div></div>
    <div class="settings-list">
      <div class="settings-item" id="sTheme"><div class="settings-item-left"><span class="settings-icon">🌓</span><div><div class="settings-label">Dark Mode</div><div class="settings-desc">Toggle light / dark theme</div></div></div><button class="toggle ${s.theme==='dark'?'active':''}" id="tSwitch"></button></div>
      <div class="settings-item" id="sPin"><div class="settings-item-left"><span class="settings-icon">🔐</span><div><div class="settings-label">Admin PIN</div><div class="settings-desc">Update access code</div></div></div><span class="settings-value">Change →</span></div>
      <div class="settings-item" id="sSeed" style="border-color:rgba(239,68,68,0.2)"><div class="settings-item-left"><span class="settings-icon">📥</span><div><div class="settings-label" style="color:var(--danger)">Load Sample Data</div><div class="settings-desc">Password protected • Overwrites data</div></div></div><span class="settings-value" style="color:var(--danger)">Load →</span></div>
      <div class="settings-item" id="sExport"><div class="settings-item-left"><span class="settings-icon">📤</span><div><div class="settings-label">Export as CSV</div><div class="settings-desc">Download all readings</div></div></div><span class="settings-value">Export →</span></div>
      <div class="settings-item" id="sClear" style="border-color:rgba(239,68,68,0.2)"><div class="settings-item-left"><span class="settings-icon">🗑️</span><div><div class="settings-label" style="color:var(--danger)">Clear All Data</div><div class="settings-desc">Password protected • Irreversible action</div></div></div><span class="settings-value" style="color:var(--danger)">Clear →</span></div>
    </div>
    <div class="card" style="margin-top:18px;text-align:center">
      <p style="font-size:.95rem;font-weight:900;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent">💧 Kudineer</p>
      <p style="font-size:.68rem;color:var(--text-muted);margin-top:3px">Water Meter Tracker v2.0 • CWSS 138/238</p>
    </div>`;

  el.querySelector('#tSwitch').onclick = e => { e.currentTarget.classList.toggle('active'); const t = e.currentTarget.classList.contains('active')?'dark':'light'; s.theme=t; saveSettings(s); cbs?.onThemeChange?.(t); };
  el.querySelector('#sPin').onclick = () => { 
    const current = s.pin || '1234';
    const old = prompt('Enter Current PIN\\n(Or type "forgot" to reset via email):');
    if (old === null) return;
    if (old.toLowerCase() === 'forgot') {
      window.location.href = 'mailto:punjaithalvaipalyam@gmail.com?subject=PIN%20Reset%20Request';
      showToast('📧 Redirecting to email...');
      return;
    }
    if (old !== current) { showToast('❌ Incorrect PIN'); return; }
    const p = prompt('Enter New 4-digit PIN:'); 
    if(p?.length===4&&/^\d+$/.test(p)){s.pin=p;saveSettings(s);showToast('🔐 PIN updated');renderSettings(el,cbs);}
    else if(p) showToast('⚠️ Must be 4 digits'); 
  };
  el.querySelector('#sSeed').onclick = () => {
    const pw = prompt('🔒 Enter Master Password to load sample data:');
    if (pw === null) return;
    if (pw !== '4130') { showToast('❌ Incorrect master password'); return; }
    if (confirm('⚠️ This will overwrite existing readings. Are you sure?')) {
      seedSampleData(); 
      showToast('📥 Sample data loaded!'); 
      cbs?.onRefresh?.(); 
    }
  };
  el.querySelector('#sExport').onclick = () => { const b=new Blob([exportCSV()],{type:'text/csv'}), u=URL.createObjectURL(b), a=document.createElement('a'); a.href=u; a.download='kudineer_readings.csv'; a.click(); URL.revokeObjectURL(u); showToast('📤 Exported'); };
  el.querySelector('#sClear').onclick = () => {
    const pw = prompt('🔒 Enter Master Password to clear all data:');
    if (pw === null) return;
    if (pw !== '4130') { showToast('❌ Incorrect master password'); return; }
    if (confirm('⚠️ This will permanently delete ALL readings. Are you sure?')) {
      clearAllData();
      showToast('🗑️ All data cleared');
      cbs?.onRefresh?.();
    }
  };
}
