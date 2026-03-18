/* main.js – App entry point & router */
import './styles/index.css';
import { getSettings, saveSettings } from './lib/store.js';
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
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.getElementById('themeIcon').textContent = theme === 'dark' ? '☀️' : '🌙';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'dark' ? '#0a0f1e' : '#f4f7fe';
}

// ---- Navigation ----
function navigateTo(screen) {
  currentScreen = screen;
  const el = document.getElementById('screenContainer');
  
  // Update nav states
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.screen === screen));
  
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
    hidePin(); showToast('🔓 Admin mode enabled');
    navigateTo('entry');
  } else {
    document.querySelectorAll('.pin-dot').forEach(d => { d.style.borderColor = 'var(--danger)'; d.style.background = 'rgba(239,68,68,0.3)'; });
    showToast('❌ Wrong PIN');
    setTimeout(() => { inp.value = ''; updateDots(0); document.querySelectorAll('.pin-dot').forEach(d => { d.style.borderColor = ''; d.style.background = ''; }); }, 800);
  }
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  const s = getSettings();
  applyTheme(s.theme || 'dark');

  // Nav clicks
  document.querySelectorAll('.nav-item').forEach(b => {
    b.addEventListener('click', () => {
      const scr = b.dataset.screen;
      if (scr === 'entry' && !isAdmin) { showPin(); return; }
      navigateTo(scr);
    });
  });

  // Theme toggle
  document.getElementById('themeToggle').onclick = () => {
    const s = getSettings();
    s.theme = s.theme === 'dark' ? 'light' : 'dark';
    saveSettings(s); applyTheme(s.theme);
    navigateTo(currentScreen);
  };

  // Admin toggle
  document.getElementById('adminToggle').onclick = () => {
    if (isAdmin) {
      isAdmin = false; document.body.classList.remove('is-admin');
      document.getElementById('adminToggle').classList.remove('active');
      document.getElementById('adminIcon').textContent = '👤';
      showToast('🔒 Locked');
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
});
