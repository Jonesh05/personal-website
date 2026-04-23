import type { Metadata } from 'next'
import { LegalPage } from '@/components/Legal/LegalPage'
import { getServerTranslations } from '@/i18n/server'
import { DisclaimerBodyEN } from './content.en'
import { DisclaimerBodyES } from './content.es'

export const metadata: Metadata = {
  title: 'Disclaimer · Jhonny Pimiento',
  description:
    'Disclaimer for the articles and code published on jhonnypimiento.com.',
  alternates: { canonical: '/disclaimer' },
}

const UPDATED_AT = '2026-04-01'

export default async function DisclaimerPage() {
  const { locale, t } = await getServerTranslations('Legal')

  return (
    <LegalPage
      eyebrow={t('disclaimerEyebrow')}
      title={t('disclaimerTitle')}
      subtitle={t('disclaimerSubtitle')}
      updatedAt={UPDATED_AT}
      updatedLabel={t('updatedAt')}
      backLabel={t('backHome')}
      locale={locale}
    >
      {locale === 'es' ? <DisclaimerBodyES /> : <DisclaimerBodyEN />}
    </LegalPage>
  )
}
