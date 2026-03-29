/* settings.js */
import { getSettings, saveSettings, exportCSV, importCSV, clearAllData, getAutoBackups, restoreBackup } from '../lib/store.js';
import { showToast } from '../main.js';

export function renderSettings(el, cbs) {
  const s = getSettings();
  el.innerHTML = `
    <div class="section-header"><div class="section-title">⚙️ Settings</div><div class="section-subtitle">Preferences & data management</div></div>
    <div class="settings-list">
      <div class="settings-item" id="sTheme"><div class="settings-item-left"><span class="settings-icon">🌓</span><div><div class="settings-label">Theme</div><div class="settings-desc">Auto switches at 6 AM / 6 PM</div></div></div><div class="theme-toggle-group" id="themeGroup"><button class="theme-opt ${(s.theme||'dark')==='auto'?'active':''}" data-t="auto">Auto</button><button class="theme-opt ${(s.theme||'dark')==='light'?'active':''}" data-t="light">Light</button><button class="theme-opt ${(s.theme||'dark')==='dark'?'active':''}" data-t="dark">Dark</button></div></div>
      <div class="settings-item" id="sPin"><div class="settings-item-left"><span class="settings-icon">🔐</span><div><div class="settings-label">Admin PIN</div><div class="settings-desc">Update access code</div></div></div><span class="settings-value">Change →</span></div>
      <div class="settings-item" id="sExport"><div class="settings-item-left"><span class="settings-icon">📤</span><div><div class="settings-label">Export as CSV</div><div class="settings-desc">Download all readings backup</div></div></div><span class="settings-value">Export →</span></div>
      <div class="settings-item" id="sImport" style="border-color:rgba(168,85,247,0.2)"><div class="settings-item-left"><span class="settings-icon">📥</span><div><div class="settings-label" style="color:var(--accent)">Import from CSV</div><div class="settings-desc">Restore or add prefilled data</div></div></div><span class="settings-value" style="color:var(--accent)">Import →</span></div>
      <div class="settings-item" id="sClear" style="border-color:rgba(239,68,68,0.2)"><div class="settings-item-left"><span class="settings-icon">🗑️</span><div><div class="settings-label" style="color:var(--danger)">Clear All Data</div><div class="settings-desc">Password protected • Irreversible action</div></div></div><span class="settings-value" style="color:var(--danger)">Clear →</span></div>
    </div>
    <div class="card" style="margin-top:18px;text-align:center">
      <p style="font-size:.95rem;font-weight:900;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent">💧 Kudineer</p>
      <p style="font-size:.68rem;color:var(--text-muted);margin-top:3px">Water Meter Tracker v3.0 • CWSS 138/238 • Cloud Sync</p>
    </div>
    <input type="file" id="importInput" accept=".csv" style="display:none">`;

  el.querySelectorAll('#themeGroup .theme-opt').forEach(btn => { btn.onclick = () => { el.querySelectorAll('#themeGroup .theme-opt').forEach(b => b.classList.remove('active')); btn.classList.add('active'); s.theme=btn.dataset.t; saveSettings(s); cbs?.onThemeChange?.(s.theme); }; });
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
    const auth = prompt('⚠️ Action restricted.\nContact System Admin to import data.');
    if (auth === null || auth.toLowerCase() !== 'master') {
      if (auth !== null) showToast('❌ Not authorized');
      return;
    }
    const pw = prompt('🔒 Enter Master Password:');
    if (pw !== '4130') {
      showToast('❌ Incorrect master password');
      return;
    }

    const backups = getAutoBackups();
    const bKeys = Object.keys(backups).sort((a,b)=>b.localeCompare(a));

    const m = document.createElement('div');
    m.className = 'modal-overlay show';
    m.innerHTML = `
      <div class="modal-card" style="transform:scale(1) translateY(0)">
        <h3 style="margin-bottom:16px;font-size:1.1rem">📥 Choose Import Source</h3>
        ${bKeys.length > 0 ? '<p style="font-size:.75rem;color:var(--text-muted);margin-bottom:12px">Cloud backups (last 3 days)</p>' : ''}
        ${bKeys.map(k => `<button class="btn btn-secondary" style="margin-bottom:8px;padding:10px" data-b="${k}">Restore Backup (${k})</button>`).join('')}
        ${bKeys.length === 0 ? '<p style="font-size:.8rem;color:var(--text-muted);margin-bottom:12px">No cloud backups available</p>' : ''}
        <button class="btn btn-primary" id="btnExt" style="margin-bottom:20px;padding:10px;background:var(--accent)">Upload External CSV</button>
        <div style="font-size:0.85rem;color:var(--text-muted);cursor:pointer;padding:8px" id="btnCancel">Cancel</div>
      </div>
    `;
    document.body.appendChild(m);

    m.querySelectorAll('[data-b]').forEach(btn => {
      btn.onclick = () => {
        try {
          restoreBackup(btn.getAttribute('data-b'));
          showToast('📥 Backup restored from cloud');
          cbs?.onRefresh?.();
        } catch(e) {
          showToast('❌ Failed: ' + e.message.split('.')[0]);
        }
        document.body.removeChild(m);
      };
    });

    m.querySelector('#btnExt').onclick = () => {
      document.body.removeChild(m);
      el.querySelector('#importInput').click();
    };

    m.querySelector('#btnCancel').onclick = () => document.body.removeChild(m);
  };

  el.querySelector('#importInput').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
    e.target.value = '';
  };

  el.querySelector('#sClear').onclick = () => {
    const auth = prompt('⚠️ Action restricted.\nContact System Admin to clear data.');
    if (auth === null) return;
    if (auth.toLowerCase() === 'master') {
      const pw = prompt('🔒 Enter Master Password:');
      if (pw === '4130') {
        if (confirm('⚠️ This will permanently delete ALL readings from the cloud database. Are you sure?')) {
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
