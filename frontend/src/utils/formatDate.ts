import { LOCALE_TO_HREFLANG, type Locale } from '@/i18n/constants'

type RawDate = string | Date | { _seconds?: number } | null | undefined

function toMillis(raw: RawDate): number | null {
  if (!raw) return null
  if (raw instanceof Date) return raw.getTime()
  if (typeof raw === 'string') {
    const parsed = Date.parse(raw)
    return Number.isNaN(parsed) ? null : parsed
  }
  if (typeof raw === 'object' && typeof raw._seconds === 'number') {
    return raw._seconds * 1000
  }
  return null
}

export function formatDateByLocale(
  raw: RawDate,
  locale: Locale = 'es',
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
): string {
  const ms = toMillis(raw)
  if (ms == null) return ''

  return new Date(ms).toLocaleDateString(LOCALE_TO_HREFLANG[locale] ?? 'es-ES', options)
}
