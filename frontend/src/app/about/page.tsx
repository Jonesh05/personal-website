import type { Metadata } from 'next'
import Link from 'next/link'
import About from '@/components/About/About'
import { getServerTranslations } from '@/i18n/server'

/**
 * /about — standalone landing page for biographical context.
 * Embeds the existing home-page `<About />` section so content remains
 * a single source of truth, and adds a focused hero + CTA to reach out.
 */

export const metadata: Metadata = {
  title: 'About · Jhonny Pimiento',
  description:
    'About Jhonny Pimiento — a developer focused on web systems, blockchain and thoughtful UX.',
  alternates: { canonical: '/about' },
}

export default async function AboutPage() {
  const { t } = await getServerTranslations('AboutPage')

  return (
    <main
      className="relative min-h-screen pt-28"
      style={{ background: 'var(--color-surface)' }}
    >
      <header className="relative mx-auto w-full max-w-5xl px-6 pb-6">
        <p
          className="mb-3 text-xs uppercase tracking-[0.22em]"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-green-neon)',
          }}
        >
          {t('eyebrow')}
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.4rem, 5vw, 4rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.05,
            color: 'var(--color-text)',
          }}
        >
          {t('title')}
        </h1>
        <p
          className="mt-5 max-w-2xl text-base leading-relaxed sm:text-lg"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {t('subtitle')}
        </p>
      </header>

      <About />

      {/* Contact CTA */}
      <section className="relative mx-auto w-full max-w-5xl px-6 pb-24 pt-4">
        <div
          className="rounded-3xl p-[1px]"
          style={{
            background:
              'linear-gradient(135deg, rgba(124,58,237,0.4) 0%, rgba(0,255,178,0.25) 60%, rgba(191,94,255,0.4) 100%)',
          }}
        >
          <div
            className="rounded-[23px] p-8 sm:p-10"
            style={{
              background: 'var(--color-surface-2)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <h2
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text)',
              }}
            >
              {t('contactCtaHeading')}
            </h2>
            <p
              className="mt-3 max-w-2xl text-sm leading-relaxed sm:text-base"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {t('contactCtaBody')}
            </p>

            <Link
              href="/#contact"
              className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm
                font-semibold tracking-wide transition-all duration-200 hover:-translate-y-0.5
                hover:shadow-[0_12px_40px_-12px_rgba(124,58,237,0.55)]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/80
                focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
              style={{
                background:
                  'linear-gradient(135deg, rgba(124,58,237,0.95) 0%, rgba(191,94,255,0.95) 100%)',
                color: '#fff',
                fontFamily: 'var(--font-body)',
              }}
            >
              {t('contactCtaAction')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
