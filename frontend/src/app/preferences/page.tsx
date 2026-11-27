// frontend/src/app/preferences/page.tsx
// Passwordless Preference Center (Server Component).
// Reads `?token={magicToken}` from searchParams, validates UUID v4 format,
// fetches current subscriber state from PostgreSQL (Prisma), and renders
// the interactive PreferencesForm or a clean security error state.

import type { Metadata } from 'next'
import Link from 'next/link'
import { MagicTokenSchema } from '@personal-website/shared/schemas/newsletter.schema'
import {
  getSubscriberByMagicToken,
  type SubscriberRecord,
} from '@/lib/firestore/subscribers'
import PreferencesForm from './PreferencesForm.client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reading Preferences · Execution Layer · Jhonny Pimiento',
  description: 'Manage your reading segments, delivery email, or subscription status.',
  robots: { index: false, follow: false },
}

interface PreferencesPageProps {
  searchParams: Promise<{
    token?: string | string[]
    action?: string | string[]
  }>
}

export default async function PreferencesPage({ searchParams }: PreferencesPageProps) {
  const resolvedParams = await searchParams
  const rawToken = Array.isArray(resolvedParams.token)
    ? resolvedParams.token[0]
    : resolvedParams.token
  const rawAction = Array.isArray(resolvedParams.action)
    ? resolvedParams.action[0]
    : resolvedParams.action

  const parsedToken = MagicTokenSchema.safeParse(rawToken ?? '')

  if (!parsedToken.success) {
    return (
      <SecurityStateCard
        code="ERR_INVALID_MAGIC_TOKEN"
        title="Invalid or Missing Access Token"
        message="Preferences can only be accessed via the cryptographic magic link at the bottom of your newsletter dispatch. Please use the exact link from your inbox."
      />
    )
  }

  let subscriber: SubscriberRecord | null = null

  try {
    subscriber = await getSubscriberByMagicToken(parsedToken.data)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    // eslint-disable-next-line no-console
    console.error(`[app/preferences] database query failed: ${message}`)
    return (
      <SecurityStateCard
        code="ERR_SERVICE_UNAVAILABLE"
        title="Preference Center Temporarily Unavailable"
        message="We could not reach the subscriber database right now. Please try again in a few moments."
      />
    )
  }

  if (!subscriber) {
    return (
      <SecurityStateCard
        code="ERR_TOKEN_NOT_FOUND_OR_EXPIRED"
        title="Access Token Not Found or Expired"
        message="No subscriber record matches this security token. It may have been rotated or removed. You can subscribe again on the blog."
      />
    )
  }

  return (
    <main
      className="relative min-h-screen pt-32 pb-24 px-6"
      style={{ background: 'var(--color-surface)' }}
    >
      <div className="mx-auto w-full max-w-2xl">
        {/* Terminal Header Card */}
        <div
          className="rounded-2xl overflow-hidden border"
          style={{
            background: 'var(--color-surface-2)',
            borderColor: 'var(--color-border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {/* Top Accent Bar */}
          <div
            className="h-1 w-full"
            style={{ background: 'var(--gradient-plasma)' }}
          />

          {/* Terminal Window Bar */}
          <div
            className="flex items-center justify-between px-6 py-3 border-b"
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span
                className="ml-2 text-xs text-slate-400"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                jpimiento@execution-layer:~/preferences
              </span>
            </div>
            <span
              className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              AUTH: MAGIC_TOKEN
            </span>
          </div>

          <div className="p-6 sm:p-8">
            <header className="mb-8">
              <p
                className="text-xs uppercase tracking-[0.2em] mb-2"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-green-neon)',
                }}
              >
                EXECUTION LAYER DISPATCH
              </p>
              <h1
                className="text-2xl sm:text-3xl font-bold mb-2"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--color-text)',
                }}
              >
                Reading Preferences & Segmentation
              </h1>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Customize the technical topics you receive from Jhonny Pimiento
                (Web3, AI Agents, Cybersecurity, Lanark, Solidifair &amp; HealthChain
                Assistant) or manage your delivery status.
              </p>
            </header>

            <PreferencesForm
              token={parsedToken.data}
              initialData={{
                email:     subscriber.email,
                status:    subscriber.status,
                tags:      subscriber.tags,
                updatedAt: subscriber.updatedAt.toISOString(),
              }}
              autoUnsubscribePrompt={rawAction === 'unsubscribe'}
            />
          </div>
        </div>
      </div>
    </main>
  )
}

function SecurityStateCard({
  code,
  title,
  message,
}: {
  code: string
  title: string
  message: string
}) {
  return (
    <main
      className="relative min-h-screen pt-36 pb-24 px-6 flex items-start justify-center"
      style={{ background: 'var(--color-surface)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-8 border"
        style={{
          background: 'var(--color-surface-2)',
          borderColor: 'rgba(239, 68, 68, 0.35)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <p
          className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          [{code}]
        </p>
        <h1
          className="text-2xl font-bold mb-3"
          style={{
            fontFamily: 'var(--font-display)',
            color: 'var(--color-text)',
          }}
        >
          {title}
        </h1>
        <p
          className="text-sm leading-relaxed mb-6"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {message}
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/blog"
            className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all"
            style={{
              fontFamily: 'var(--font-mono)',
              background: 'var(--gradient-plasma)',
            }}
          >
            Go to Blog →
          </Link>
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition-colors"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  )
}
