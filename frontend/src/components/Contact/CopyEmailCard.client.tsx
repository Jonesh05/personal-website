'use client'

import { useCallback, useState } from 'react'
import { toast } from '@/lib/toast'
import { useTranslations } from '@/i18n'

/**
 * CopyEmailCard — single source of truth for the "contact by email" UX.
 *
 * The component exposes two actions on the same address:
 *   • Primary  — copies the email to the clipboard AND opens the user's mail
 *                client (mailto:). One click delivers both expected outcomes.
 *   • Secondary — a focused "copy only" button for users who prefer to paste
 *                the address elsewhere (Slack, CRM, etc.).
 *
 * Visual style: vibrant gradient plasma ring around a frosted-glass card,
 * matching the hero/contact ambient treatment. Typography uses the global
 * display/mono font tokens for consistency with the rest of the site.
 *
 * Accessibility:
 *   • Buttons are real <button>/<a> elements with descriptive aria-labels.
 *   • Copy feedback is mirrored in an `aria-live="polite"` region so screen
 *     readers announce the state change.
 *   • Focus rings follow the site convention (ring-2 ring-offset).
 */

interface CopyEmailCardProps {
  email: string
  subject?: string
  body?: string
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 2 11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  )
}

export function CopyEmailCard({ email, subject, body }: CopyEmailCardProps) {
  const t = useTranslations('Contact')
  const [copied, setCopied] = useState(false)

  const mailtoHref = (() => {
    const params = new URLSearchParams()
    if (subject) params.set('subject', subject)
    if (body) params.set('body', body)
    const qs = params.toString()
    return `mailto:${email}${qs ? `?${qs}` : ''}`
  })()

  const copyToClipboard = useCallback(async (): Promise<boolean> => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email)
        return true
      }
      // Legacy fallback for non-secure contexts.
      const ta = document.createElement('textarea')
      ta.value = email
      ta.setAttribute('readonly', '')
      ta.style.position = 'absolute'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      return true
    } catch {
      return false
    }
  }, [email])

  const flashCopied = useCallback(() => {
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }, [])

  const handleCopyOnly = useCallback(async () => {
    const ok = await copyToClipboard()
    if (ok) {
      flashCopied()
      toast.success(t('emailCopied'))
    } else {
      toast.error(t('emailCopyError'))
    }
  }, [copyToClipboard, flashCopied, t])

  const handleCopyAndSend = useCallback(
    async (event: React.MouseEvent<HTMLAnchorElement>) => {
      // We keep the <a href="mailto:"> so that middle-click, cmd-click,
      // and right-click "Copy link address" behave correctly. We intercept
      // the normal left-click to also copy, then let the browser open mailto.
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const ok = await copyToClipboard()
      if (ok) {
        flashCopied()
        toast.success(t('emailCopiedAndOpening'))
      }
      // Let the default navigation (mailto:) proceed.
    },
    [copyToClipboard, flashCopied, t]
  )

  return (
    <div
      className="group relative rounded-2xl p-[1px] transition-transform duration-200
        hover:-translate-y-0.5"
      style={{
        background:
          'linear-gradient(135deg, rgba(124,58,237,0.55) 0%, rgba(0,255,178,0.35) 55%, rgba(191,94,255,0.55) 100%)',
      }}
    >
      <div
        className="relative rounded-[15px] p-6 sm:p-7 overflow-hidden"
        style={{
          background: 'var(--color-surface-2)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {/* Decorative corner glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full blur-3xl opacity-40"
          style={{
            background:
              'radial-gradient(circle, rgba(124,58,237,0.6) 0%, transparent 70%)',
          }}
        />

        <div className="relative flex flex-col gap-5">
          {/* Label */}
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: 'var(--color-green-neon)' }}
              aria-hidden="true"
            />
            <span
              className="text-xs uppercase tracking-[0.18em]"
              style={{
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-text-faint)',
              }}
            >
              {t('emailLabel')}
            </span>
          </div>

          {/* Email + copy chip */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCopyOnly}
              aria-label={copied ? t('emailCopied') : `${t('copyEmailAria')} ${email}`}
              className="group/email inline-flex items-center gap-2 rounded-xl
                border border-white/10 bg-white/[0.04] px-3 py-2
                text-[15px] sm:text-base font-medium transition-colors
                hover:border-white/25 hover:bg-white/[0.08]
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-purple-400/70 focus-visible:ring-offset-2
                focus-visible:ring-offset-transparent"
              style={{
                color: 'var(--color-text)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span className="select-all truncate max-w-[65vw] sm:max-w-none">
                {email}
              </span>
              <span
                className="inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors"
                style={{
                  background: copied
                    ? 'rgba(16, 185, 129, 0.18)'
                    : 'rgba(124, 58, 237, 0.18)',
                  color: copied
                    ? 'var(--color-green-neon)'
                    : 'var(--color-purple-neon)',
                }}
                aria-hidden="true"
              >
                {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
              </span>
            </button>
          </div>

          {/* Helper copy */}
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {t('emailHelper')}
          </p>

          {/* Primary CTA */}
          <a
            href={mailtoHref}
            onClick={handleCopyAndSend}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3
              text-sm font-semibold tracking-wide transition-all duration-200
              hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-12px_rgba(124,58,237,0.55)]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/80
              focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            style={{
              background:
                'linear-gradient(135deg, rgba(124,58,237,0.95) 0%, rgba(191,94,255,0.95) 100%)',
              color: '#fff',
              fontFamily: 'var(--font-body)',
            }}
            aria-label={`${t('sendEmailAria')} ${email}`}
          >
            <SendIcon className="h-4 w-4" />
            <span>{t('copyAndSend')}</span>
          </a>

          {/* Screen-reader live region */}
          <span className="sr-only" role="status" aria-live="polite">
            {copied ? t('emailCopied') : ''}
          </span>
        </div>
      </div>
    </div>
  )
}
