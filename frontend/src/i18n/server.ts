import 'server-only'
import { cookies, headers } from 'next/headers'
import type { Namespace } from './locales/en'
import en from './locales/en'
import es from './locales/es'
import { LOCALES, DEFAULT_LOCALE, LOCALE_KEY, type Locale } from './constants'

const dictionaries = { en, es } as const
type DictLocale = keyof typeof dictionaries

// Keep this list in sync with the client copy in `i18n/utils.ts`.
// Both client and server must enforce the same "do not translate" rules so
// a key resolves identically whether rendered via SSR or in a client hook.
const STATIC_KEYS = new Set([
  'Web3',
  'Blockchain',
  'AI',
  'ML',
  'ReFi',
  'GitHub',
  'LinkedIn',
  'TypeScript',
  'Next.js',
  'React',
  'AWS',
  'Solidity',
  'IPFS',
  'DevRel',
  'Blog',
  'Home',
  'About',
])

function resolve(locale: DictLocale, namespace: Namespace, key: string): string {
  if (STATIC_KEYS.has(key)) {
    return (en[namespace] as Record<string, string>)[key] ?? key
  }

  const dict = dictionaries[locale] ?? dictionaries.en
  const section = dict[namespace] as Record<string, string>
  return section[key] ?? (en[namespace] as Record<string, string>)[key] ?? key
}

function normalizeLocale(input?: string | null): Locale {
  if (!input) return DEFAULT_LOCALE
  const lower = input.toLowerCase()
  if (LOCALES.includes(lower as Locale)) return lower as Locale
  const short = lower.split(/[-_]/)[0]
  if (LOCALES.includes(short as Locale)) return short as Locale
  return DEFAULT_LOCALE
}

/**
 * getServerLocale()
 *
 * Resolution order:
 *   1. Cookie `site-locale` (user-selected)
 *   2. Accept-Language header (first supported)
 *   3. DEFAULT_LOCALE
 *
 * Must be called inside a Server Component or Server Action.
 */
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_KEY)?.value
  const cookieResolved = normalizeLocale(cookieLocale)
  if (cookieLocale && LOCALES.includes(cookieResolved)) return cookieResolved

  try {
    const hdrs = await headers()
    const accept = hdrs.get('accept-language')
    if (accept) {
      const first = accept.split(',')[0]?.trim()
      const parsed = normalizeLocale(first)
      if (LOCALES.includes(parsed)) return parsed
    }
  } catch {
    // headers() may throw in some contexts; fall back to default
  }

  return DEFAULT_LOCALE
}

/**
 * getTranslations(locale, namespace)
 *
 * Pure server-safe accessor. Pass locale explicitly (use `getServerLocale()` to
 * read the cookie in Server Components).
 */
export function getTranslations(locale: string, namespace: Namespace) {
  const safe = normalizeLocale(locale) as DictLocale
  return (key: string): string => resolve(safe, namespace, key)
}

/**
 * Convenience: read locale from cookie and return a bound translator in one call.
 */
export async function getServerTranslations(namespace: Namespace) {
  const locale = await getServerLocale()
  return {
    locale,
    t: getTranslations(locale, namespace),
  }
}
