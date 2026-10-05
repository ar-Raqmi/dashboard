import { useCallback, useEffect, useState } from 'react';
import { useStore, type Theme } from '@/store';

const STORAGE_KEY = 'raqmi-theme';
export const THEME_COLORS: Record<Theme, string> = { dark: '#232A2E', light: '#EFEBD4' };

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch { return 'dark'; }
}

/** Light/dark appearance: this device's last choice until an account preference arrives, which then wins. */
export function useTheme() {
  const savedTheme = useStore(s => s.preferences.theme);
  const [theme, setThemeState] = useState<Theme>(readTheme);

  useEffect(() => { if (savedTheme) setThemeState(savedTheme); }, [savedTheme]);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* Preference remains for this session. */ }
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    void useStore.getState().updatePreferences({ theme: next }).catch(() => undefined);
  }, []);

  return { theme, setTheme };
}
