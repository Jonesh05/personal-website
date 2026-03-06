import { createNavigation } from 'next-intl/navigation'
import { defineRouting }    from 'next-intl/routing'

export const LOCALES         = ['en', 'es'] as const
export const DEFAULT_LOCALE  = 'es'

export const LOCALE_ICONS: Record<string, string> = {
  en: 'En',
  es: 'Es',
}

export const LOCALE_TO_HREFLANG: Record<Locale, string> = {
  en: 'en-US',
  es: 'es-ES',
}

export const routing = defineRouting({
  locales:       LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix:  'as-needed',
})

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)

export type Locale = (typeof routing.locales)[number]
