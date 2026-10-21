// frontend/src/utils/theme.js

const THEME_KEY = 'optix-theme';
const DEFAULT_THEME = 'dark';

export const themeUtil = {
  init() {
    const saved = localStorage.getItem(THEME_KEY);
    const theme = saved || DEFAULT_THEME;
    this.set(theme);
  },

  set(theme) {
    if (theme !== 'dark' && theme !== 'light') return;
    
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    
    // Emitir evento
    window.dispatchEvent(new CustomEvent('themeChange', { detail: { theme } }));
  },

  toggle() {
    const current = this.get();
    const next = current === 'dark' ? 'light' : 'dark';
    this.set(next);
    return next;
  },

  get() {
    return document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
  },

  isDark() {
    return this.get() === 'dark';
  },
};

export default themeUtil;
