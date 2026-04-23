import type { ReactNode } from 'react'
import Link from 'next/link'
import { formatDateByLocale } from '@/utils/formatDate'
import type { Locale } from '@/i18n/constants'

/**
 * LegalPage — shared chrome for static informational pages (Privacy, Terms,
 * Disclaimer, About, Work, etc.). Centralising the layout here guarantees:
 *
 *   • Consistent spacing, typography and scroll behaviour across every static
 *     page.
 *   • A single place to tweak the plasma/ambient background so all pages
 *     stay visually coordinated with the rest of the site.
 *   • Accessible landmarks (header / main / nav) and a predictable H1 so
 *     screen readers and SEO crawlers have reliable structure.
 */

export interface LegalPageProps {
  eyebrow?: string
  title: string
  subtitle?: string
  /**
   * Date the page content was last reviewed. We format it client/server-safe
   * through the locale-aware helper to avoid hydration drift.
   */
  updatedAt?: Date | string
  locale?: Locale
  /** Optional "updated on" label — defaults to English/Spanish from locale. */
  updatedLabel?: string
  /** Back link shown in the breadcrumb row. Defaults to the home page. */
  backHref?: string
  backLabel?: string
  children: ReactNode
}

export function LegalPage({
  eyebrow,
  title,
  subtitle,
  updatedAt,
  locale,
  updatedLabel,
  backHref = '/',
  backLabel,
  children,
}: LegalPageProps) {
  const effectiveLocale: Locale = locale ?? 'en'
  const defaultBack = effectiveLocale === 'es' ? '← Inicio' : '← Home'
  const defaultUpdatedLabel =
    effectiveLocale === 'es' ? 'Última actualización' : 'Last updated'

  return (
    <main
      id="main"
      className="relative min-h-screen overflow-hidden pb-28 pt-28"
      style={{ background: 'var(--color-surface)' }}
    >
      {/* Ambient plasma — matches the hero/contact visual language */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute -top-40 left-[10%] h-[420px] w-[420px] rounded-full opacity-[0.18]"
          style={{
            background:
              'radial-gradient(circle at 40% 40%, #7C3AED 0%, #4C1D95 40%, transparent 70%)',
            filter: 'blur(90px)',
          }}
        />
        <div
          className="absolute top-[40%] right-[4%] h-[340px] w-[340px] rounded-full opacity-[0.12]"
          style={{
            background:
              'radial-gradient(circle at 60% 60%, #00FFB2 0%, #059669 40%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl px-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-10">
          <Link
            href={backHref}
            className="group inline-flex items-center gap-2 text-sm font-medium
              text-white/50 transition-colors hover:text-white
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/80
              focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-md"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <span aria-hidden="true">{backLabel ?? defaultBack}</span>
          </Link>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          {eyebrow && (
            <p
              className="mb-3 text-xs uppercase tracking-[0.22em]"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-green-neon)',
              }}
            >
              {eyebrow}
            </p>
          )}
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              color: 'var(--color-text)',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="mt-5 max-w-2xl text-base leading-relaxed sm:text-lg"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {subtitle}
            </p>
          )}
          {updatedAt && (
            <p
              className="mt-6 text-xs tracking-wide"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-text-faint)',
              }}
            >
              {(updatedLabel ?? defaultUpdatedLabel)}:{' '}
              {formatDateByLocale(updatedAt, effectiveLocale)}
            </p>
          )}
        </header>

        {/* Content wrapper */}
        <article
          className="rounded-3xl border border-white/5 bg-[var(--color-surface-2)]/70
            p-8 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.6)] backdrop-blur-sm sm:p-12"
        >
          <Prose>{children}</Prose>
        </article>
      </div>
    </main>
  )
}

/**
 * Prose — scoped typographic styles for static informational pages.
 * Uses Tailwind's arbitrary child selectors so we don't depend on
 * @tailwindcss/typography and can match the site's custom type tokens.
 */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div
      className="
        text-[15.5px] leading-[1.75]
        [&>p]:mb-5 [&>p]:text-white/75
        [&>h2]:mt-12 [&>h2]:mb-4 [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:tracking-tight [&>h2]:text-white
        [&>h3]:mt-9 [&>h3]:mb-3 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:tracking-tight [&>h3]:text-white/95
        [&>ul]:my-5 [&>ul]:ml-5 [&>ul]:list-disc [&>ul>li]:mb-2 [&>ul>li]:text-white/75
        [&>ol]:my-5 [&>ol]:ml-5 [&>ol]:list-decimal [&>ol>li]:mb-2 [&>ol>li]:text-white/75
        [&_a]:text-[var(--color-purple-neon)] [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-white/20
        [&_a:hover]:decoration-[var(--color-purple-neon)]
        [&_strong]:text-white [&_strong]:font-semibold
        [&_code]:rounded-md [&_code]:bg-white/[0.06] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_code]:text-white
        [&>blockquote]:border-l-2 [&>blockquote]:border-[var(--color-purple-neon)]/60 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-white/80
      "
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {children}
    </div>
  )
}
