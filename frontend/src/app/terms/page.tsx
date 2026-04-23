import type { Metadata } from 'next'
import { LegalPage } from '@/components/Legal/LegalPage'
import { getServerTranslations } from '@/i18n/server'
import { TermsBodyEN } from './content.en'
import { TermsBodyES } from './content.es'

export const metadata: Metadata = {
  title: 'Terms of Service · Jhonny Pimiento',
  description:
    'The rules for using jhonnypimiento.com, its articles, and its tools.',
  alternates: { canonical: '/terms' },
}

const UPDATED_AT = '2026-04-01'

export default async function TermsPage() {
  const { locale, t } = await getServerTranslations('Legal')

  return (
    <LegalPage
      eyebrow={t('termsEyebrow')}
      title={t('termsTitle')}
      subtitle={t('termsSubtitle')}
      updatedAt={UPDATED_AT}
      updatedLabel={t('updatedAt')}
      backLabel={t('backHome')}
      locale={locale}
    >
      {locale === 'es' ? <TermsBodyES /> : <TermsBodyEN />}
    </LegalPage>
  )
}
