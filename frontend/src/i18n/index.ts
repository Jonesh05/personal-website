/**
 * i18n/index.ts — public barrel
 *
 * Single import point for all i18n utilities.
 *
 * Usage in Client Components:
 *   import { useTranslations, useLocale } from '@/i18n'
 *
 * Usage in Server Components:
 *   import { getTranslations } from '@/i18n'
 *
 * Usage for constants only (Server Components, middleware):
 *   import { LOCALES, DEFAULT_LOCALE } from '@/i18n/constants'
 */

// Hooks + pure function — all from utils (safe import chain)
export {
  useTranslations,
  useLocale,
  getTranslations,
  LOCALES,
  DEFAULT_LOCALE,
  LOCALE_KEY,
  LOCALE_TO_HREFLANG,
  type Locale,
  type Namespace,
} from './utils';

// Provider — needs to stay imported from LocaleContext directly in layout
export { LocaleProvider } from './LocaleContext';
