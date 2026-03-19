/* settings.js */
import { getSettings, saveSettings, exportCSV, importCSV, clearAllData } from '../lib/store.js';
import { showToast } from '../main.js';

export function renderSettings(el, cbs) {
  const s = getSettings();
  el.innerHTML = `
    <div class="section-header"><div class="section-title">⚙️ Settings</div><div class="section-subtitle">Preferences & data management</div></div>
    <div class="settings-list">
      <div class="settings-item" id="sTheme"><div class="settings-item-left"><span class="settings-icon">🌓</span><div><div class="settings-label">Dark Mode</div><div class="settings-desc">Toggle light / dark theme</div></div></div><button class="toggle ${s.theme==='dark'?'active':''}" id="tSwitch"></button></div>
      <div class="settings-item" id="sPin"><div class="settings-item-left"><span class="settings-icon">🔐</span><div><div class="settings-label">Admin PIN</div><div class="settings-desc">Update access code</div></div></div><span class="settings-value">Change →</span></div>
      <div class="settings-item" id="sExport"><div class="settings-item-left"><span class="settings-icon">📤</span><div><div class="settings-label">Export as CSV</div><div class="settings-desc">Download all readings backup</div></div></div><span class="settings-value">Export →</span></div>
      <div class="settings-item" id="sImport" style="border-color:rgba(168,85,247,0.2)"><div class="settings-item-left"><span class="settings-icon">📥</span><div><div class="settings-label" style="color:var(--accent)">Import from CSV</div><div class="settings-desc">Restore or add prefilled data</div></div></div><span class="settings-value" style="color:var(--accent)">Import →</span></div>
      <div class="settings-item" id="sClear" style="border-color:rgba(239,68,68,0.2)"><div class="settings-item-left"><span class="settings-icon">🗑️</span><div><div class="settings-label" style="color:var(--danger)">Clear All Data</div><div class="settings-desc">Password protected • Irreversible action</div></div></div><span class="settings-value" style="color:var(--danger)">Clear →</span></div>
    </div>
    <div class="card" style="margin-top:18px;text-align:center">
      <p style="font-size:.95rem;font-weight:900;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent">💧 Kudineer</p>
      <p style="font-size:.68rem;color:var(--text-muted);margin-top:3px">Water Meter Tracker v2.0 • CWSS 138/238</p>
    </div>
    <input type="file" id="importInput" accept=".csv" style="display:none">`;

  el.querySelector('#tSwitch').onclick = e => { e.currentTarget.classList.toggle('active'); const t = e.currentTarget.classList.contains('active')?'dark':'light'; s.theme=t; saveSettings(s); cbs?.onThemeChange?.(t); };
  el.querySelector('#sPin').onclick = () => { 
    const current = s.pin || '1234';
    const old = prompt('Enter Current PIN\\n(If forgotten, contact System Admin):');
    if (old === null) return;
    
    let isAuthorized = false;

    if (old.toLowerCase() === 'master') {
      const pw = prompt('🔒 Enter Master Password:');
      if (pw === '4130') {
        isAuthorized = true;
      } else {
        showToast('❌ Incorrect master password');
        return;
      }
    } else if (old === current) {
      isAuthorized = true;
    } else {
      showToast('❌ Incorrect PIN'); 
      return; 
    }

    if (isAuthorized) {
      const p = prompt('Enter New 4-digit PIN:'); 
      if(p?.length===4&&/^\d+$/.test(p)){s.pin=p;saveSettings(s);showToast('🔐 PIN updated');renderSettings(el,cbs);}
      else if(p) showToast('⚠️ Must be 4 digits'); 
    }
  };

  el.querySelector('#sExport').onclick = () => { const b=new Blob([exportCSV()],{type:'text/csv'}), u=URL.createObjectURL(b), a=document.createElement('a'); a.href=u; a.download='kudineer_readings.csv'; a.click(); URL.revokeObjectURL(u); showToast('📤 Exported to Downloads folder'); };
  
  el.querySelector('#sImport').onclick = () => { 
    el.querySelector('#importInput').click(); 
  };

  el.querySelector('#importInput').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Prompt for authorization AFTER selecting file so browser doesn't block the file picker
    const auth = prompt('⚠️ Action restricted.\nContact System Admin to import data.');
    if (auth === null || auth.toLowerCase() !== 'master') {
      if (auth !== null) showToast('❌ Not authorized');
      e.target.value = '';
      return;
    }

    const pw = prompt('🔒 Enter Master Password to authorize import:');
    if (pw !== '4130') {
      showToast('❌ Incorrect master password');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        importCSV(ev.target.result);
        showToast('📥 Data imported successfully');
        cbs?.onRefresh?.();
      } catch (err) {
        if (err.message.includes('Format mismatch')) {
          showToast('❌ Format mismatch');
        } else {
          showToast('❌ Failed to import');
        }
        alert('File Import Error: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset so same file can be selected again
  };

  el.querySelector('#sClear').onclick = () => {
    const auth = prompt('⚠️ Action restricted.\nContact System Admin to clear data.');
    if (auth === null) return;
    if (auth.toLowerCase() === 'master') {
      const pw = prompt('🔒 Enter Master Password:');
      if (pw === '4130') {
        if (confirm('⚠️ This will permanently delete ALL readings. Are you sure?')) {
          clearAllData();
          showToast('🗑️ All data cleared');
          cbs?.onRefresh?.();
        }
      } else {
        showToast('❌ Incorrect master password');
      }
    } else {
      showToast('❌ Not authorized');
    }
  };
}

