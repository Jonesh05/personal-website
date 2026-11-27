'use client'

import { useState } from 'react'
import Link from 'next/link'
import { NEWSLETTER_TAGS, type SubscriberStatus } from '@personal-website/shared/schemas/newsletter.schema'

export interface InitialPreferences {
  email: string
  status: SubscriberStatus
  tags: string[]
  updatedAt: string
}

interface PreferencesFormProps {
  token: string
  initialData: InitialPreferences
  autoUnsubscribePrompt?: boolean
}

const TAG_LABELS: Record<string, { label: string; desc: string }> = {
  web3: {
    label: '#WEB3 & DEFI',
    desc: 'Smart contracts, on-chain protocols, Lanark & Solidifair updates',
  },
  ai: {
    label: '#AI AGENTS',
    desc: 'Autonomous execution layers, LLM orchestration & HealthChain Assistant',
  },
  cybersecurity: {
    label: '#CYBERSECURITY',
    desc: 'Zero-trust engineering, cryptographic primitives & protocol audits',
  },
  cloud: {
    label: '#CLOUD ARCH',
    desc: 'Distributed systems, AWS/Railway infrastructure & high-availability',
  },
  refi: {
    label: '#REFI',
    desc: 'Regenerative finance, carbon markets & tokenized real-world impact',
  },
  engineering: {
    label: '#SYSTEM DESIGN',
    desc: 'Full-stack TypeScript, Next.js architecture & performance deep-dives',
  },
}

export default function PreferencesForm({
  token,
  initialData,
  autoUnsubscribePrompt = false,
}: PreferencesFormProps) {
  const [email, setEmail] = useState(initialData.email)
  const [status, setStatus] = useState<SubscriberStatus>(initialData.status)
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData.tags)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  function toggleTag(tag: string) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    )
  }

  async function submitChanges(overrideStatus?: 'active' | 'unsubscribed') {
    setSaving(true)
    setFeedback(null)

    const targetStatus =
      overrideStatus ?? (status === 'unsubscribed' ? 'unsubscribed' : 'active')

    try {
      const res = await fetch('/api/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email: email.trim().toLowerCase(),
          status: targetStatus,
          tags: selectedTags,
        }),
      })

      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean
        error?: string
        subscriber?: InitialPreferences
      }

      if (!res.ok || !body.ok) {
        const msg =
          body.error === 'email_already_in_use'
            ? 'That email address is already registered to another subscription.'
            : body.error === 'rate_limited'
            ? 'Too many requests. Please wait a few minutes and try again.'
            : 'Could not update your preferences. Please verify your inputs.'
        setFeedback({ type: 'error', message: msg })
        setSaving(false)
        return
      }

      if (body.subscriber) {
        setEmail(body.subscriber.email)
        setStatus(body.subscriber.status)
        setSelectedTags(body.subscriber.tags)
      } else {
        setStatus(targetStatus)
      }

      setFeedback({
        type: 'success',
        message:
          targetStatus === 'unsubscribed'
            ? 'You have been unsubscribed from all future dispatches.'
            : 'Your reading preferences and email settings have been saved.',
      })
    } catch {
      setFeedback({
        type: 'error',
        message: 'Network error while updating preferences. Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    await submitChanges(status === 'unsubscribed' ? 'unsubscribed' : 'active')
  }

  return (
    <div className="space-y-6">
      {autoUnsubscribePrompt && status !== 'unsubscribed' && (
        <div
          className="rounded-xl p-4 border"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            borderColor: 'rgba(239, 68, 68, 0.35)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-wider text-red-400"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                [UNSUBSCRIBE REQUEST DETECTED]
              </p>
              <p className="text-sm text-slate-300 mt-1">
                Confirm below to immediately opt out of all Execution Layer dispatches.
              </p>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => submitChanges('unsubscribed')}
              className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              Confirm Unsubscribe
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Status Indicator & Toggle */}
        <div
          className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div>
            <span
              className="text-xs uppercase tracking-widest block mb-1"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
            >
              SUBSCRIPTION STATUS
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  status === 'active'
                    ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                    : status === 'unsubscribed'
                    ? 'bg-red-400'
                    : 'bg-amber-400'
                }`}
              />
              <span
                className="text-sm font-bold uppercase"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}
              >
                {status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStatus('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
              }`}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              ACTIVE
            </button>
            <button
              type="button"
              onClick={() => setStatus('unsubscribed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                status === 'unsubscribed'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
              }`}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              UNSUBSCRIBED
            </button>
          </div>
        </div>

        {/* Email Address Field */}
        <div>
          <label
            htmlFor="pref-email"
            className="block text-xs uppercase tracking-widest mb-2"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
          >
            DELIVERY EMAIL ADDRESS
          </label>
          <input
            id="pref-email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={saving}
            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/60 transition-all"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-mono)',
            }}
          />
        </div>

        {/* Reading Segmentation Tags */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label
              className="block text-xs uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
            >
              READING SEGMENTS (TAGS)
            </label>
            <span
              className="text-xs"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-green-neon)' }}
            >
              {selectedTags.length} selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {NEWSLETTER_TAGS.map(tag => {
              const active = selectedTags.includes(tag)
              const meta = TAG_LABELS[tag] ?? {
                label: `#${tag.toUpperCase()}`,
                desc: 'Technical articles & dispatches',
              }

              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  disabled={saving}
                  aria-pressed={active}
                  className="text-left p-3.5 rounded-xl border transition-all cursor-pointer"
                  style={{
                    background: active
                      ? 'rgba(124, 58, 237, 0.14)'
                      : 'rgba(255, 255, 255, 0.02)',
                    borderColor: active
                      ? 'rgba(191, 94, 255, 0.45)'
                      : 'var(--color-border)',
                    boxShadow: active
                      ? '0 0 20px rgba(124, 58, 237, 0.15)'
                      : 'none',
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs font-bold tracking-wider"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: active ? 'var(--color-purple-neon)' : 'var(--color-text)',
                      }}
                    >
                      {meta.label}
                    </span>
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                        active
                          ? 'bg-purple-500 text-white'
                          : 'border border-slate-600 text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                  </div>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {meta.desc}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            role="status"
            aria-live="polite"
            className={`p-4 rounded-xl border text-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {feedback.type === 'success' ? '✓ ' : '✕ '}
            {feedback.message}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer disabled:opacity-50"
            style={{
              fontFamily: 'var(--font-mono)',
              background: 'var(--gradient-plasma)',
              boxShadow: '0 0 24px rgba(124, 58, 237, 0.3)',
            }}
          >
            {saving ? 'SAVING CHANGES…' : 'SAVE PREFERENCES'}
          </button>

          {status !== 'unsubscribed' && (
            <button
              type="button"
              disabled={saving}
              onClick={() => submitChanges('unsubscribed')}
              className="w-full sm:w-auto px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/25 transition-all cursor-pointer disabled:opacity-50"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              One-Click Unsubscribe
            </button>
          )}
        </div>
      </form>

      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <Link href="/blog" className="hover:text-slate-300 transition-colors">
          ← Return to Blog
        </Link>
        <span style={{ fontFamily: 'var(--font-mono)' }}>
          Token: {token.slice(0, 8)}…{token.slice(-4)}
        </span>
      </div>
    </div>
  )
}
