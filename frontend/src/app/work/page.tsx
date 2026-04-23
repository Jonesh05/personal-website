import type { Metadata } from 'next'
import Link from 'next/link'
import Projects from '@/components/Projects/Projects'
import { getServerTranslations } from '@/i18n/server'

/**
 * /work — standalone landing page for the portfolio.
 *
 * Design intent:
 *   • Acts as the canonical destination for external "portfolio" links
 *     (footer, resume, CV, email signature). It reuses the existing
 *     `<Projects />` section so we stay DRY and the content never drifts
 *     out of sync with the home page.
 *   • Adds a focused hero so the page reads as a deliberate landing page
 *     and not as a fragment of the homepage.
 *   • Honours the site-wide i18n resolver (locale comes from the cookie
 *     written by middleware).
 */

export const metadata: Metadata = {
  title: 'Work · Jhonny Pimiento',
  description:
    'Selected products, platforms, and open-source experiments by Jhonny Pimiento.',
  alternates: { canonical: '/work' },
}

export default async function WorkPage() {
  const { t } = await getServerTranslations('Work')

  return (
    <main
      className="relative min-h-screen pt-28"
      style={{ background: 'var(--color-surface)' }}
    >
      <header className="relative mx-auto w-full max-w-5xl px-6 pb-4">
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

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold
              transition-all duration-200 hover:-translate-y-0.5
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/80
              focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{
              background:
                'linear-gradient(135deg, rgba(124,58,237,0.95) 0%, rgba(191,94,255,0.95) 100%)',
              color: '#fff',
              fontFamily: 'var(--font-body)',
            }}
          >
            {t('readTheBlog')}
          </Link>
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04]
              px-4 py-2 text-sm font-semibold text-white/80 transition-colors
              hover:border-white/30 hover:bg-white/[0.08] hover:text-white
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/80
              focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            hello@
          </Link>
        </div>
      </header>

      <Projects />
    </main>
  )
}
