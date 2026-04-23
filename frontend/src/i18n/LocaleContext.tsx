'use client';

/**
 * i18n/LocaleContext.tsx
 *
 * Cookie-first locale state. The server reads the same cookie via
 * `getServerLocale()` so SSR and client render match on first paint.
 *
 * Resolution order on mount:
 *   1. `initialLocale` prop (passed from the server-rendered layout)
 *   2. Cookie `site-locale`
 *   3. `localStorage` fallback (legacy users migrating to cookie)
 *   4. DEFAULT_LOCALE
 *
 * Whenever locale changes we write it to both the cookie and localStorage,
 * and update `<html lang>`.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { LOCALES, DEFAULT_LOCALE, LOCALE_KEY, type Locale } from './constants';

interface LocaleContextValue {
  locale: Locale;
  toggleLocale: () => void;
  setLocale: (l: Locale) => void;
}

const DEFAULT_CTX: LocaleContextValue = {
  locale: DEFAULT_LOCALE,
  toggleLocale: () => {},
  setLocale: () => {},
};

const LocaleContext = createContext<LocaleContextValue>(DEFAULT_CTX);

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year

function readCookieLocale(): Locale | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${LOCALE_KEY}=`));
  if (!match) return null;
  const raw = decodeURIComponent(match.split('=')[1] ?? '');
  return LOCALES.includes(raw as Locale) ? (raw as Locale) : null;
}

function writeCookieLocale(locale: Locale): void {
  if (typeof document === 'undefined') return;
  document.cookie = [
    `${LOCALE_KEY}=${encodeURIComponent(locale)}`,
    'path=/',
    `max-age=${COOKIE_MAX_AGE_SECONDS}`,
    'samesite=lax',
  ].join('; ');
}

function readStoredLocale(): Locale | null {
  try {
    const stored = localStorage.getItem(LOCALE_KEY);
    if (LOCALES.includes(stored as Locale)) return stored as Locale;
  } catch {}
  return null;
}

function writeStoredLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {}
}

interface LocaleProviderProps {
  children: ReactNode;
  /** Locale resolved on the server (cookie / accept-language). */
  initialLocale?: Locale;
}

export function LocaleProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();
  // Track the first effect so we don't `router.refresh()` on initial mount —
  // server components are already rendered with the correct locale from the
  // cookie on first paint.
  const firstRunRef = useRef(true);

  // Reconcile with client-side sources (cookie/localStorage) once on mount.
  // If the server already read the cookie via `getServerLocale`, this is a no-op.
  useEffect(() => {
    const fromCookie = readCookieLocale();
    const fromStorage = readStoredLocale();
    const resolved = fromCookie ?? fromStorage ?? initialLocale;
    if (resolved !== locale) setLocaleState(resolved);
    // Backfill cookie/localStorage so server/client agree on next navigation.
    writeCookieLocale(resolved);
    writeStoredLocale(resolved);
    // Intentionally run only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist + reflect on <html lang> whenever locale changes.
  // On every *user-initiated* change we also refresh the router so Server
  // Components that render via `getServerTranslations` (Contact, Blog, legal
  // pages) pick up the new cookie and re-render in the new language.
  useEffect(() => {
    writeCookieLocale(locale);
    writeStoredLocale(locale);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', locale);
    }
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }
    router.refresh();
  }, [locale, router]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const idx = LOCALES.indexOf(prev);
      const next = LOCALES[(idx + 1) % LOCALES.length] as Locale;
      return next;
    });
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, toggleLocale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
