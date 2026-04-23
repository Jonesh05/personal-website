/**
 * i18n/constants.ts
 *
 * Single source of truth for locale config.
 * NO imports — pure constants only.
 * Safe to import from Server Components, Client Components, and middleware.
 *
 * Dependency graph BEFORE fix:
 *   utils.ts → routing.ts → next-intl/navigation  ← server API, breaks clients
 *
 * Dependency graph AFTER fix:
 *   utils.ts → constants.ts   (no side effects)
 *   routing.ts → constants.ts (next-intl kept isolated for nav utilities only)
 */

export const LOCALES        = ['en', 'es'] as const;
/**
 * English is the canonical default. All site copy is authored in English; the
 * Spanish dictionary is an opt-in translation triggered by the user via the
 * navbar toggle. Server-side resolution order (see `getServerLocale`):
 *   1) `site-locale` cookie  2) Accept-Language  3) DEFAULT_LOCALE
 */
export const DEFAULT_LOCALE = 'en' as const;
export const LOCALE_KEY     = 'site-locale';

export const LOCALE_LABELS: Record<string, string> = {
  en: 'En',
  es: 'Es',
};

export const LOCALE_TO_HREFLANG: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
};

export type Locale = (typeof LOCALES)[number]; // 'en' | 'es'
