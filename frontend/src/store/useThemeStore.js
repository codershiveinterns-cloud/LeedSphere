import { create } from 'zustand';

const STORAGE_KEY = 'theme';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';
  // 1. Restore the user's explicit preference if they've ever toggled.
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  // 2. Otherwise default to light (per design spec). We deliberately ignore
  //    the OS-level prefers-color-scheme on first visit so the marketing
  //    pages render in the design we control by default.
  return 'light';
};

const applyThemeClass = (theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
  root.style.colorScheme = theme;
};

const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),

  setTheme: (theme) => {
    applyThemeClass(theme);
    localStorage.setItem(STORAGE_KEY, theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  initTheme: () => {
    applyThemeClass(get().theme);
  },
}));

export default useThemeStore;
