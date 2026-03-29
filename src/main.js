/* main.js – App entry point & router */
import './styles/index.css';
import { initStore, getSettings, saveSettings } from './lib/store.js';
import { t } from './lib/i18n.js';
import { renderYearlySummary } from './screens/yearly-summary.js';
import { renderMonthlySheet } from './screens/monthly-sheet.js';
import { renderAdminEntry } from './screens/admin-entry.js';
import { renderInsights } from './screens/insights.js';
import { renderSettings } from './screens/settings.js';

let isAdmin = false, currentScreen = 'summary';

// ---- Toast (exported for other modules) ----
export function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ---- Theme ----
let autoThemeTimer = null;

function getAutoTheme() {
  const h = new Date().getHours();
  return (h >= 6 && h < 18) ? 'light' : 'dark';
}

function applyTheme(mode) {
  // mode can be 'light', 'dark', or 'auto'
  if (autoThemeTimer) { clearInterval(autoThemeTimer); autoThemeTimer = null; }

  const resolved = mode === 'auto' ? getAutoTheme() : mode;
  document.documentElement.dataset.theme = resolved;
  document.getElementById('themeIcon').textContent =
    mode === 'auto' ? '🔄' : resolved === 'dark' ? '☀️' : '🌙';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = resolved === 'dark' ? '#0a0f1e' : '#f4f7fe';

  // Re-check every minute when in auto mode
  if (mode === 'auto') {
    autoThemeTimer = setInterval(() => applyTheme('auto'), 60000);
  }
}

// ---- Update translatable UI ----
function updateStaticUI() {
  document.querySelectorAll('.nav-item').forEach(b => {
    const scr = b.dataset.screen;
    const labelEl = b.querySelector('.nav-label');
    if (!labelEl) return;
    const map = { summary: 'nav_summary', monthly: 'nav_monthly', entry: 'nav_add', insights: 'nav_insights', settings: 'nav_settings' };
    if (map[scr]) labelEl.textContent = t(map[scr]);
  });
  const pinModalTitle = document.querySelector('#pinModal h2');
  const pinModalDesc = document.querySelector('#pinModal p');
  const pinCancel = document.getElementById('pinCancel');
  const pinSubmit = document.getElementById('pinSubmit');
  if (pinModalTitle) pinModalTitle.textContent = t('admin_access');
  if (pinModalDesc) pinModalDesc.textContent = t('enter_pin');
  if (pinCancel) pinCancel.textContent = t('cancel');
  if (pinSubmit) pinSubmit.textContent = t('unlock');
}

// ---- Navigation ----
function navigateTo(screen) {
  currentScreen = screen;
  const el = document.getElementById('screenContainer');

  // Update nav states
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.screen === screen));

  // Update header subtitle per screen
  const subtitleKeys = {
    summary: 'subtitle_summary',
    monthly: 'subtitle_monthly',
    entry: 'subtitle_entry',
    insights: 'subtitle_insights',
    settings: 'subtitle_settings'
  };
  const subEl = document.getElementById('appSubtitle');
  if (subEl) subEl.textContent = t(subtitleKeys[screen]) || 'CWSS 138 / 238';

  updateStaticUI();

  // Animate
  el.classList.remove('screen-enter');
  void el.offsetWidth; // reflow
  el.classList.add('screen-enter');

  switch (screen) {
    case 'summary': renderYearlySummary(el); break;
    case 'monthly': renderMonthlySheet(el); break;
    case 'entry': renderAdminEntry(el, isAdmin); break;
    case 'insights': renderInsights(el); break;
    case 'settings': renderSettings(el, { onThemeChange: applyTheme, onRefresh: () => navigateTo(currentScreen) }); break;
  }
}

// ---- PIN Modal ----
function showPin() {
  document.getElementById('pinModal').classList.add('show');
  const inp = document.getElementById('pinInput');
  inp.value = ''; updateDots(0);
  setTimeout(() => inp.focus(), 200);
}

function hidePin() {
  document.getElementById('pinModal').classList.remove('show');
  document.getElementById('pinInput').value = '';
  updateDots(0);
}

function updateDots(n) {
  document.querySelectorAll('.pin-dot').forEach((d, i) => d.classList.toggle('filled', i < n));
}

function tryPin() {
  const inp = document.getElementById('pinInput');
  const correct = (getSettings().pin || '1234');
  if (inp.value === correct) {
    isAdmin = true;
    document.body.classList.add('is-admin');
    document.getElementById('adminToggle').classList.add('active');
    document.getElementById('adminIcon').textContent = '🔓';
    hidePin(); showToast('🔓 ' + t('admin_enabled'));
    navigateTo('entry');
  } else {
    document.querySelectorAll('.pin-dot').forEach(d => { d.style.borderColor = 'var(--danger)'; d.style.background = 'rgba(239,68,68,0.3)'; });
    showToast('❌ ' + t('wrong_pin'));
    setTimeout(() => { inp.value = ''; updateDots(0); document.querySelectorAll('.pin-dot').forEach(d => { d.style.borderColor = ''; d.style.background = ''; }); }, 800);
  }
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
  const loader = document.getElementById('appLoader');
  const appContent = document.getElementById('appContent');

  try {
    // Initialize Firebase and load data from cloud
    await initStore(() => {
      // Real-time callback: when another device saves data, refresh current screen
      navigateTo(currentScreen);
    });

    // Data loaded — hide loader, show app
    if (loader) loader.style.display = 'none';
    if (appContent) appContent.style.display = '';

    const s = getSettings();
    // Migrate existing users to auto theme (one-time, per device via localStorage)
    if (!localStorage.getItem('kudineer_theme_migrated')) {
      s.theme = 'auto';
      saveSettings(s);
      localStorage.setItem('kudineer_theme_migrated', '1');
    }
    applyTheme(s.theme || 'auto');

    // Nav clicks
    document.querySelectorAll('.nav-item').forEach(b => {
      b.addEventListener('click', () => {
        const scr = b.dataset.screen;
        if (scr === 'entry' && !isAdmin) { showPin(); return; }
        navigateTo(scr);
      });
    });

    // Theme toggle: cycles auto → light → dark → auto
    document.getElementById('themeToggle').onclick = () => {
      const s = getSettings();
      const cycle = { auto: 'light', light: 'dark', dark: 'auto' };
      s.theme = cycle[s.theme] || 'auto';
      saveSettings(s); applyTheme(s.theme);
      navigateTo(currentScreen);
    };

    // Admin toggle
    document.getElementById('adminToggle').onclick = () => {
      if (isAdmin) {
        isAdmin = false; document.body.classList.remove('is-admin');
        document.getElementById('adminToggle').classList.remove('active');
        document.getElementById('adminIcon').textContent = '👤';
        showToast('🔒 ' + t('locked'));
        navigateTo(currentScreen);
      } else showPin();
    };

    // PIN modal events
    document.getElementById('pinCancel').onclick = hidePin;
    document.getElementById('pinSubmit').onclick = tryPin;
    const pinInp = document.getElementById('pinInput');
    pinInp.oninput = () => updateDots(pinInp.value.length);
    pinInp.onkeydown = e => { if (e.key === 'Enter') tryPin(); };

    // Focus PIN input when modal tapped
    document.getElementById('pinModal').addEventListener('click', e => {
      if (e.target.classList.contains('modal-overlay') || e.target.closest('.pin-dots')) pinInp.focus();
    });

    navigateTo('summary');
  } catch (err) {
    // Show error if Firebase isn't configured
    if (loader) loader.innerHTML = `
      <div style="text-align:center;padding:40px 20px;max-width:400px">
        <div style="font-size:2.5rem;margin-bottom:16px">⚠️</div>
        <h2 style="color:var(--danger);margin-bottom:12px;font-size:1.1rem">${t('connection_error')}</h2>
        <p style="color:var(--text-muted);font-size:.85rem;line-height:1.6">${err.message}</p>
      </div>`;
  }
});
