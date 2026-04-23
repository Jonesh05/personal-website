'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

// ── Types ──────────────────────────────────────────────────────────────────
type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme:       Theme;
  toggleTheme: () => void;
  setTheme:    (t: Theme) => void;
}

const THEME_KEY     = 'site-theme';
const DEFAULT_THEME: Theme = 'dark';

function readStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'dark' || v === 'light') return v;
  } catch {}
  // Respect OS preference as fallback
  try {
    if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  } catch {}
  return DEFAULT_THEME;
}

// ── Context ────────────────────────────────────────────────────────────────
const ThemeContext = createContext<ThemeContextValue>({
  theme:       DEFAULT_THEME,
  toggleTheme: () => {},
  setTheme:    () => {},
});

// ── Provider ───────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  // Hydrate from localStorage on mount (avoids SSR mismatch)
  useEffect(() => {
    const stored = readStoredTheme();
    setThemeState(stored);
    applyTheme(stored);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(
    () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark')),
    [],
  );

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Consumer hook ──────────────────────────────────────────────────────────
export function useTheme() {
  return useContext(ThemeContext);
}

// ── DOM helper ─────────────────────────────────────────────────────────────
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
}
