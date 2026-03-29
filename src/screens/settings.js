/* settings.js */
import { getSettings, saveSettings, exportCSV, parseCSV, importCSV, clearAllData, getAutoBackups, restoreBackup } from '../lib/store.js';
import { showToast } from '../main.js';
import { t, getLang, setLang } from '../lib/i18n.js';

export function renderSettings(el, cbs) {
  const s = getSettings();
  const lang = getLang();
  el.innerHTML = `
    <div class="section-header"><div class="section-title">⚙️ ${t('settings_title')}</div><div class="section-subtitle">${t('settings_subtitle')}</div></div>
    <div class="settings-list">
      <div class="settings-item" id="sTheme"><div class="settings-item-left"><span class="settings-icon">🌓</span><div><div class="settings-label">${t('theme')}</div><div class="settings-desc">${t('theme_desc')}</div></div></div><div class="theme-toggle-group" id="themeGroup"><button class="theme-opt ${(s.theme||'dark')==='auto'?'active':''}" data-t="auto">${t('auto')}</button><button class="theme-opt ${(s.theme||'dark')==='light'?'active':''}" data-t="light">${t('light')}</button><button class="theme-opt ${(s.theme||'dark')==='dark'?'active':''}" data-t="dark">${t('dark')}</button></div></div>
      <div class="settings-item" id="sLang"><div class="settings-item-left"><span class="settings-icon">🌐</span><div><div class="settings-label">${t('language')}</div><div class="settings-desc">${t('language_desc')}</div></div></div><div class="theme-toggle-group" id="langGroup"><button class="theme-opt ${lang==='en'?'active':''}" data-l="en">${t('english')}</button><button class="theme-opt ${lang==='ta'?'active':''}" data-l="ta">${t('tamil')}</button></div></div>
      <div class="settings-item" id="sPin"><div class="settings-item-left"><span class="settings-icon">🔐</span><div><div class="settings-label">${t('admin_pin')}</div><div class="settings-desc">${t('admin_pin_desc')}</div></div></div><span class="settings-value">${t('change')}</span></div>
      <div class="settings-item" id="sExport"><div class="settings-item-left"><span class="settings-icon">📤</span><div><div class="settings-label">${t('export_csv')}</div><div class="settings-desc">${t('export_csv_desc')}</div></div></div><span class="settings-value">${t('export_action')}</span></div>
      <div class="settings-item" id="sImport" style="border-color:rgba(168,85,247,0.2)"><div class="settings-item-left"><span class="settings-icon">📥</span><div><div class="settings-label" style="color:var(--accent)">${t('import_csv')}</div><div class="settings-desc">${t('import_csv_desc')}</div></div></div><span class="settings-value" style="color:var(--accent)">${t('import_action')}</span></div>
      <div class="settings-item" id="sClear" style="border-color:rgba(239,68,68,0.2)"><div class="settings-item-left"><span class="settings-icon">🗑️</span><div><div class="settings-label" style="color:var(--danger)">${t('clear_all')}</div><div class="settings-desc">${t('clear_all_desc')}</div></div></div><span class="settings-value" style="color:var(--danger)">${t('clear_action')}</span></div>
    </div>
    <div class="card" style="margin-top:18px;text-align:center">
      <p style="font-size:.68rem;color:var(--text-muted)">${t('version_info')}</p>
    </div>
    <input type="file" id="importInput" accept=".csv" style="display:none">`;

  el.querySelectorAll('#themeGroup .theme-opt').forEach(btn => { btn.onclick = () => { el.querySelectorAll('#themeGroup .theme-opt').forEach(b => b.classList.remove('active')); btn.classList.add('active'); s.theme=btn.dataset.t; saveSettings(s); cbs?.onThemeChange?.(s.theme); }; });

  // Language toggle
  el.querySelectorAll('#langGroup .theme-opt').forEach(btn => { btn.onclick = () => { el.querySelectorAll('#langGroup .theme-opt').forEach(b => b.classList.remove('active')); btn.classList.add('active'); setLang(btn.dataset.l); cbs?.onRefresh?.(); }; });

  el.querySelector('#sPin').onclick = () => {
    const current = s.pin || '1234';
    const old = prompt(t('enter_current_pin'));
    if (old === null) return;

    let isAuthorized = false;

    if (old.toLowerCase() === 'master') {
      const pw = prompt('🔒 ' + t('enter_master_pw'));
      if (pw === '4130') {
        isAuthorized = true;
      } else {
        showToast('❌ ' + t('incorrect_master'));
        return;
      }
    } else if (old === current) {
      isAuthorized = true;
    } else {
      showToast('❌ ' + t('wrong_pin'));
      return;
    }

    if (isAuthorized) {
      const p = prompt(t('enter_new_pin'));
      if(p?.length===4&&/^\d+$/.test(p)){s.pin=p;saveSettings(s);showToast('🔐 ' + t('pin_updated'));renderSettings(el,cbs);}
      else if(p) showToast('⚠️ ' + t('must_4_digits'));
    }
  };

  el.querySelector('#sExport').onclick = () => { const b=new Blob([exportCSV()],{type:'text/csv'}), u=URL.createObjectURL(b), a=document.createElement('a'); a.href=u; a.download='kudineer_readings.csv'; a.click(); URL.revokeObjectURL(u); showToast('📤 ' + t('exported')); };

  el.querySelector('#sImport').onclick = () => {
    const auth = prompt('⚠️ ' + t('action_restricted'));
    if (auth === null || auth.toLowerCase() !== 'master') {
      if (auth !== null) showToast('❌ ' + t('not_authorized'));
      return;
    }
    const pw = prompt('🔒 ' + t('enter_master_pw'));
    if (pw !== '4130') {
      showToast('❌ ' + t('incorrect_master'));
      return;
    }

    const backups = getAutoBackups();
    const bKeys = Object.keys(backups).sort((a,b)=>b.localeCompare(a));

    const m = document.createElement('div');
    m.className = 'modal-overlay show';
    m.innerHTML = `
      <div class="modal-card" style="transform:scale(1) translateY(0)">
        <h3 style="margin-bottom:16px;font-size:1.1rem">📥 ${t('choose_import_source')}</h3>
        ${bKeys.length > 0 ? `<p style="font-size:.75rem;color:var(--text-muted);margin-bottom:12px">${t('cloud_backups')}</p>` : ''}
        ${bKeys.map(k => `<button class="btn btn-secondary" style="margin-bottom:8px;padding:10px" data-b="${k}">${t('restore_backup')} (${k})</button>`).join('')}
        ${bKeys.length === 0 ? `<p style="font-size:.8rem;color:var(--text-muted);margin-bottom:12px">${t('no_cloud_backups')}</p>` : ''}
        <button class="btn btn-primary" id="btnExt" style="margin-bottom:20px;padding:10px;background:var(--accent)">${t('upload_external_csv')}</button>
        <div style="font-size:0.85rem;color:var(--text-muted);cursor:pointer;padding:8px" id="btnCancel">${t('cancel')}</div>
      </div>
    `;
    document.body.appendChild(m);

    m.querySelectorAll('[data-b]').forEach(btn => {
      btn.onclick = () => {
        try {
          restoreBackup(btn.getAttribute('data-b'));
          showToast('📥 ' + t('backup_restored'));
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
        futureNote = `<p style="font-size:.72rem;color:var(--danger);margin-top:8px">⚠️ ${parsed.futureSkipped} ${t('future_skipped')}</p>`;
      }

      // Show import options modal
      const im = document.createElement('div');
      im.className = 'modal-overlay show';
      im.innerHTML = `
        <div class="modal-card" style="transform:scale(1) translateY(0)">
          <h3 style="margin-bottom:12px;font-size:1.1rem">📥 ${t('import_options')}</h3>
          <p style="font-size:.78rem;color:var(--text-muted);margin-bottom:14px">
            ${t('csv_contains')} <strong>${parsed.totalRows} ${t('entries')}</strong> ${t('from')} <strong>${parsed.minDate}</strong> ${t('to')} <strong>${parsed.maxDate}</strong>
          </p>
          ${futureNote}

          <div style="margin-bottom:14px">
            <label style="font-size:.82rem;font-weight:600;display:block;margin-bottom:6px">${t('date_range')}</label>
            <div style="display:flex;gap:8px;align-items:center">
              <input type="date" id="impFrom" value="${parsed.minDate}" min="${parsed.minDate}" max="${parsed.maxDate}" style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--card-bg);color:var(--text);font-size:.82rem">
              <span style="font-size:.78rem;color:var(--text-muted)">${t('to')}</span>
              <input type="date" id="impTo" value="${parsed.maxDate}" min="${parsed.minDate}" max="${parsed.maxDate}" style="flex:1;padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--card-bg);color:var(--text);font-size:.82rem">
            </div>
          </div>

          <div style="margin-bottom:18px">
            <label style="font-size:.82rem;font-weight:600;display:block;margin-bottom:8px">${t('import_mode')}</label>
            <label style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px;cursor:pointer;font-size:.82rem">
              <input type="radio" name="impMode" value="update" checked style="accent-color:var(--accent)">
              <div><strong>${t('update')}</strong><br><span style="font-size:.72rem;color:var(--text-muted)">${t('update_desc')}</span></div>
            </label>
            <label style="display:flex;align-items:center;gap:8px;padding:10px;border:1px solid rgba(239,68,68,0.3);border-radius:8px;cursor:pointer;font-size:.82rem">
              <input type="radio" name="impMode" value="overwrite" style="accent-color:var(--danger)">
              <div><strong style="color:var(--danger)">${t('overwrite')}</strong><br><span style="font-size:.72rem;color:var(--text-muted)">⚠️ ${t('overwrite_desc')}</span></div>
            </label>
          </div>

          <button class="btn btn-primary" id="btnDoImport" style="padding:10px;width:100%;background:var(--accent);margin-bottom:10px">${t('import_data')}</button>
          <div style="font-size:0.85rem;color:var(--text-muted);cursor:pointer;padding:8px;text-align:center" id="btnImpCancel">${t('cancel')}</div>
        </div>
      `;
      document.body.appendChild(im);

      im.querySelector('#btnDoImport').onclick = () => {
        const fromDate = im.querySelector('#impFrom').value;
        const toDate = im.querySelector('#impTo').value;
        const mode = im.querySelector('input[name="impMode"]:checked').value;

        if (mode === 'overwrite') {
          if (!confirm('⚠️ ' + t('confirm_overwrite'))) return;
        }

        try {
          const result = importCSV(csvText, { fromDate, toDate, mode });
          showToast(`📥 ${result.importedRows} ${t('entries_imported')} (${mode})`);
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
    const auth = prompt('⚠️ ' + t('action_restricted_clear'));
    if (auth === null) return;
    if (auth.toLowerCase() === 'master') {
      const pw = prompt('🔒 ' + t('enter_master_pw'));
      if (pw === '4130') {
        if (confirm('⚠️ ' + t('confirm_clear'))) {
          clearAllData();
          showToast('🗑️ ' + t('all_data_cleared'));
          cbs?.onRefresh?.();
        }
      } else {
        showToast('❌ ' + t('incorrect_master'));
      }
    } else {
      showToast('❌ ' + t('not_authorized'));
    }
  };
}
