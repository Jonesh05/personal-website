export { LOCALE_TO_HREFLANG, LOCALES, DEFAULT_LOCALE } from './routing'

export function useTranslations(locale: string) {
  return (key: string) => key
}