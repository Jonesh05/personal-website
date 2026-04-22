'use client';

/**
 * i18n/utils.ts
 *
 * Public API for i18n in ALL Client Components across all routes.
 *
 * Root cause fixes:
 *
 * [FIX-1] Import chain broken
 *         BEFORE: utils → routing → next-intl/navigation (server API, breaks clients)
 *         AFTER:  utils → constants (pure data, zero side-effects)
 *
 * [FIX-2] useCallback with stale section closure
 *         BEFORE: section defined outside useCallback, NOT in deps →
 *                 on route remount, t() closed over wrong dictionary object
 *         AFTER:  useMemo for section, t() reads from the memoized section
 *                 always in sync with current locale
 *
 * [FIX-3] Static keys — some words should NEVER translate (brand names,
 *         tech terms, internationally-recognized labels).
 *         Words in STATIC_KEYS always return the English value regardless
 *         of active locale.
 *
 * [FIX-4] getTranslations() — pure function (no hooks) for Server Components
 *         and utility files that need translations outside React tree.
 */

import { useMemo } from 'react';
import { useLocale } from './LocaleContext';
import type { Namespace } from './locales/en';
import en from './locales/en';
import es from './locales/es';

// Re-export pure constants
export { LOCALES, DEFAULT_LOCALE, LOCALE_KEY, LOCALE_TO_HREFLANG, type Locale }
  from './constants';

// Re-export hook
export { useLocale } from './LocaleContext';

// ── Dictionary registry ────────────────────────────────────────────────────
const dictionaries = { en, es } as const;
type DictLocale = keyof typeof dictionaries;

// ── Static keys — always return English value regardless of locale ─────────
// Add any word that should NOT translate across the site.
// Typically: brand names, proper nouns, tech terms, globally-recognized labels.
const STATIC_KEYS = new Set([
  'Web3',
  'Blockchain',
  'GitHub',
  'LinkedIn',
  'TypeScript',
  'Next.js',
  'React',
  'AWS',
  'Solidity',
  'IPFS',
  'DevRel',
  'Blog',        // "Blog" is internationally recognized — stays as-is
]);

// ── Pure resolver (shared by hook and getTranslations) ────────────────────
function resolve(
  locale: DictLocale,
  namespace: Namespace,
  key: string,
): string {
  // Static keys always use English
  if (STATIC_KEYS.has(key)) {
    return (en[namespace] as Record<string, string>)[key] ?? key;
  }

  const dict    = dictionaries[locale] ?? dictionaries.es;
  const section = dict[namespace] as Record<string, string>;
  return section[key] ?? (en[namespace] as Record<string, string>)[key] ?? key;
}

// ── useTranslations — Client Component hook ───────────────────────────────
/**
 * useTranslations<N extends Namespace>(namespace: N)
 *
 * Returns a memoized `t(key)` function via useMemo ("use memory").
 * Recomputes only when locale or namespace changes.
 * Works on ALL routes — home, blog, blog/[slug], etc.
 *
 * @example
 *   const t = useTranslations('Contact')
 *   t('heading_line1')  // → "Let's build something" | "Construyamos algo"
 *   t('Blog')           // → "Blog" always (static key)
 */
export function useTranslations<N extends Namespace>(namespace: N) {
  const { locale } = useLocale();

  // FIX-2: useMemo — section AND t() both memoized, recompute only on
  //         locale/namespace change. No stale closure across route changes.
  const t = useMemo(() => {
    return (key: string): string => resolve(locale as DictLocale, namespace, key);
  }, [locale, namespace]);

  return t;
}

// ── getTranslations — pure function for Server Components ─────────────────
/**
 * getTranslations(locale, namespace)
 *
 * Non-hook version for Server Components, API routes, or any non-React context.
 * Pass the locale you need explicitly (read from cookies/headers server-side).
 *
 * @example  (Server Component)
 *   import { getTranslations } from '@/i18n/utils'
 *   const t = getTranslations('es', 'Hero')
 *   t('heading')  // → "Hola, soy Jhonny 👋"
 */
export function getTranslations(locale: string, namespace: Namespace) {
  const safe = (LOCALES.includes(locale as DictLocale) ? locale : 'es') as DictLocale;
  return (key: string): string => resolve(safe, namespace, key);
}

// Type helper — kept for external consumers that use Namespace type
export type { Namespace };
