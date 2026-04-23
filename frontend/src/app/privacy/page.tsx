import type { Metadata } from 'next'
import { LegalPage } from '@/components/Legal/LegalPage'
import { getServerTranslations } from '@/i18n/server'
import { PrivacyBodyEN } from './content.en'
import { PrivacyBodyES } from './content.es'

export const metadata: Metadata = {
  title: 'Privacy Policy · Jhonny Pimiento',
  description:
    'How your data is collected, used, and protected when you visit jhonnypimiento.com.',
  alternates: { canonical: '/privacy' },
}

const UPDATED_AT = '2026-04-01'

export default async function PrivacyPage() {
  const { locale, t } = await getServerTranslations('Legal')

  return (
    <LegalPage
      eyebrow={t('privacyEyebrow')}
      title={t('privacyTitle')}
      subtitle={t('privacySubtitle')}
      updatedAt={UPDATED_AT}
      updatedLabel={t('updatedAt')}
      backLabel={t('backHome')}
      locale={locale}
    >
      {locale === 'es' ? <PrivacyBodyES /> : <PrivacyBodyEN />}
    </LegalPage>
  )
}
