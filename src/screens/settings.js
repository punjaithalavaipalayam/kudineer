/* settings.js */
import { getSettings, saveSettings, exportCSV, parseCSV, importCSV, clearAllData, getAutoBackups, restoreBackup } from '../lib/store.js';
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
      <p style="font-size:.68rem;color:var(--text-muted)">Water Meter Tracker v3.0 • CWSS 138/238 • Cloud Sync</p>
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
      const csvText = ev.target.result;
      let parsed;
      try {
        parsed = parseCSV(csvText);
      } catch (err) {
        if (err.message.includes('Format mismatch')) showToast('❌ Format mismatch: First column must be "Date"');
        else if (err.message.includes('Unknown meter')) showToast('❌ Unknown meter column in CSV');
        else showToast('❌ Failed to read CSV');
        alert('File Error: ' + err.message);
        return;
      }

      if (!parsed.minDate || parsed.totalRows === 0) {
        showToast('❌ CSV has no valid data rows');
        return;
      }

      let futureNote = '';
      if (parsed.futureSkipped > 0) {
        futureNote = `<p style="font-size:.72rem;color:var(--danger);margin-top:8px">⚠️ ${parsed.futureSkipped} future date entries were skipped</p>`;
      }

      // Show import options modal
      const im = document.createElement('div');
      im.className = 'modal-overlay show';
      im.innerHTML = `
        <div class="modal-card" style="transform:scale(1) translateY(0)">
          <h3 style="margin-bottom:12px;font-size:1.1rem">📥 Import Options</h3>
          <p style="font-size:.78rem;color:var(--text-muted);margin-bottom:14px">
            CSV contains <strong>${parsed.totalRows} entries</strong> from <strong>${parsed.minDate}</strong> to <strong>${parsed.maxDate}</strong>
          </p>
          ${futureNote}

          <div style="margin-bottom:14px">
            <label style="font-size:.82rem;font-weight:600;display:block;margin-bottom:6px">Date Range</label>
            <div style="display:flex;gap:8px;align-items:center">
              <input type="date" id="impFrom" value="${parsed.minDate}" min="${parsed.minDate}" max="${parsed.maxDate}" style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--card-bg);color:var(--text);font-size:.82rem">
              <span style="font-size:.78rem;color:var(--text-muted)">to</span>
              <input type="date" id="impTo" value="${parsed.maxDate}" min="${parsed.minDate}" max="${parsed.maxDate}" style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--card-bg);color:var(--text);font-size:.82rem">
            </div>
          </div>

          <div style="margin-bottom:18px">
            <label style="font-size:.82rem;font-weight:600;display:block;margin-bottom:8px">Import Mode</label>
            <label style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;cursor:pointer;font-size:.82rem">
              <input type="radio" name="impMode" value="update" checked style="accent-color:var(--accent)">
              <div><strong>Update</strong><br><span style="font-size:.72rem;color:var(--text-muted)">Merge with existing data — adds new, updates matching dates</span></div>
            </label>
            <label style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid rgba(239,68,68,0.3);border-radius:8px;cursor:pointer;font-size:.82rem">
              <input type="radio" name="impMode" value="overwrite" style="accent-color:var(--danger)">
              <div><strong style="color:var(--danger)">Overwrite</strong><br><span style="font-size:.72rem;color:var(--text-muted)">⚠️ Erase ALL existing data and replace with CSV</span></div>
            </label>
          </div>

          <button class="btn btn-primary" id="btnDoImport" style="padding:10px;width:100%;background:var(--accent);margin-bottom:10px">Import Data</button>
          <div style="font-size:0.85rem;color:var(--text-muted);cursor:pointer;padding:8px;text-align:center" id="btnImpCancel">Cancel</div>
        </div>
      `;
      document.body.appendChild(im);

      im.querySelector('#btnDoImport').onclick = () => {
        const fromDate = im.querySelector('#impFrom').value;
        const toDate = im.querySelector('#impTo').value;
        const mode = im.querySelector('input[name="impMode"]:checked').value;

        if (mode === 'overwrite') {
          if (!confirm('⚠️ This will ERASE all existing data and replace with the imported CSV. Are you sure?')) return;
        }

        try {
          const result = importCSV(csvText, { fromDate, toDate, mode });
          showToast(`📥 ${result.importedRows} entries imported (${mode})`);
          cbs?.onRefresh?.();
        } catch (err) {
          showToast('❌ Import failed');
          alert('Import Error: ' + err.message);
        }
        document.body.removeChild(im);
      };

      im.querySelector('#btnImpCancel').onclick = () => document.body.removeChild(im);
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
