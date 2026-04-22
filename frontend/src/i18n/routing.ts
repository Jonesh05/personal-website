/**
 * i18n/routing.ts
 *
 * next-intl navigation utilities — ISOLATED to this file only.
 * Only import from here when you need Link/redirect/useRouter from next-intl.
 * Do NOT import from utils.ts or constants.ts here to avoid circular deps.
 *
 * ⚠️  Do NOT re-export from utils.ts — that would pull next-intl into the
 *     client context chain and break components outside the IntlProvider.
 */

export { LOCALES, DEFAULT_LOCALE, LOCALE_KEY, LOCALE_TO_HREFLANG, type Locale }
  from './constants';
