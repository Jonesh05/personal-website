'use client'

import { useCallback, useState } from 'react'
import { toast } from '@/lib/toast'
import { useTranslations } from '@/i18n'

/**
 * ShareButtons — single-consistent component for all article share surfaces.
 *
 * Surfaces
 * ────────
 *   • X (formerly Twitter)     twitter.com/intent/tweet
 *   • Facebook                 facebook.com/sharer
 *   • LinkedIn                 linkedin.com/sharing/share-offsite
 *   • Farcaster                warpcast.com/~/compose (primary Farcaster client)
 *   • Copy link                Clipboard API, with visual confirmation
 *   • Native share (mobile)    navigator.share — only rendered when available
 *
 * Variants
 * ────────
 *   variant="bar"  – horizontal bar with labels (used in article footer)
 *   variant="rail" – vertical icon-only rail (used in the sticky desktop rail)
 */

type Platform = 'x' | 'facebook' | 'linkedin' | 'farcaster'

interface ShareButtonsProps {
  url: string
  title: string
  description?: string
  variant?: 'bar' | 'rail'
  className?: string
}

function buildShareUrl(
  platform: Platform,
  { url, title, description }: { url: string; title: string; description?: string }
): string {
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedDesc = encodeURIComponent(description ?? '')

  switch (platform) {
    case 'x':
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDesc}`
    case 'farcaster':
      return `https://warpcast.com/~/compose?text=${encodedTitle}&embeds[]=${encodedUrl}`
  }
}

function openShareWindow(href: string) {
  if (typeof window === 'undefined') return
  const width = 600
  const height = 540
  const left = Math.max(0, (window.screen.width - width) / 2)
  const top = Math.max(0, (window.screen.height - height) / 2)
  window.open(
    href,
    'share',
    `width=${width},height=${height},left=${left},top=${top},noopener,noreferrer`
  )
}

interface IconProps {
  className?: string
}

function XIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2H21l-6.52 7.45L22 22h-6.777l-5.307-6.94L3.8 22H1l7.02-8.02L1.5 2h6.94l4.79 6.33L18.244 2Zm-1.19 18h1.59L7.01 4H5.32l11.734 16Z" />
    </svg>
  )
}

function FacebookIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.25-1.5 1.55-1.5H16.7V4.6c-.3 0-1.3-.1-2.45-.1-2.4 0-4.05 1.45-4.05 4.15v2.25H7.5V14h2.7v8h3.3Z" />
    </svg>
  )
}

function LinkedInIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433A2.063 2.063 0 1 1 5.34 3.31a2.063 2.063 0 0 1-.003 4.123ZM7.119 20.452H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
    </svg>
  )
}

function FarcasterIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 225 225" fill="currentColor" aria-hidden="true">
      <path d="M45 22h135v181h-21v-83h-.206a47.294 47.294 0 0 0-93.588 0H65v83H45V22Z" />
      <path d="M15 49.56L23.56 78H31v116c-3.87 0-7 3.13-7 7v8H23v8h69v-8H91v-8c0-3.87-3.13-7-7-7h-8V78h76v116c-3.87 0-7 3.13-7 7v8H144v8h69v-8H212v-8c0-3.87-3.13-7-7-7h-8V78h7.44L213 49.56H15Z" />
    </svg>
  )
}

function CopyIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ShareIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

// Shared base styles per variant, parameterized by platform accent
const PLATFORM_META: Record<Platform, { label: string; hover: string; ariaKey: string }> = {
  x:         { label: 'X',         hover: 'hover:bg-white hover:text-black',       ariaKey: 'shareOnX' },
  facebook:  { label: 'Facebook',  hover: 'hover:bg-blue-600 hover:text-white',    ariaKey: 'shareOnFacebook' },
  linkedin:  { label: 'LinkedIn',  hover: 'hover:bg-sky-700 hover:text-white',     ariaKey: 'shareOnLinkedIn' },
  farcaster: { label: 'Farcaster', hover: 'hover:bg-violet-600 hover:text-white',  ariaKey: 'shareOnFarcaster' },
}

const PLATFORM_ICON: Record<Platform, React.ComponentType<IconProps>> = {
  x: XIcon,
  facebook: FacebookIcon,
  linkedin: LinkedInIcon,
  farcaster: FarcasterIcon,
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({
  url,
  title,
  description,
  variant = 'bar',
  className = '',
}) => {
  const t = useTranslations('Blog')
  const [copied, setCopied] = useState(false)
  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success(t('linkCopied'))
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t('linkCopyError'))
    }
  }, [url, t])

  const handleNativeShare = useCallback(async () => {
    if (!canNativeShare) return
    try {
      await navigator.share({ title, text: description, url })
    } catch {
      // User cancelled — silent.
    }
  }, [canNativeShare, title, description, url])

  const handlePlatform = useCallback(
    (platform: Platform) => openShareWindow(buildShareUrl(platform, { url, title, description })),
    [url, title, description]
  )

  const platforms: Platform[] = ['x', 'facebook', 'linkedin', 'farcaster']

  if (variant === 'rail') {
    return (
      <div
        role="group"
        aria-label={t('shareArticle')}
        className={`flex flex-col items-center gap-1 ${className}`}
      >
        {platforms.map((p) => {
          const Icon = PLATFORM_ICON[p]
          const meta = PLATFORM_META[p]
          return (
            <button
              key={p}
              type="button"
              onClick={() => handlePlatform(p)}
              aria-label={t(meta.ariaKey)}
              title={meta.label}
              className={`h-10 w-10 grid place-items-center rounded-full bg-gray-900 text-gray-400
                border border-gray-800 transition-colors focus:outline-none focus:ring-2
                focus:ring-orange-500/50 ${meta.hover}`}
            >
              <Icon className="h-4 w-4" />
            </button>
          )
        })}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? t('linkCopied') : t('copyLink')}
          title={copied ? t('linkCopied') : t('copyLink')}
          className={`h-10 w-10 grid place-items-center rounded-full border transition-colors
            focus:outline-none focus:ring-2 focus:ring-orange-500/50
            ${copied
              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
              : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-white'}`}
        >
          {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
        </button>
      </div>
    )
  }

  return (
    <div
      role="group"
      aria-label={t('shareArticle')}
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      <span className="text-sm font-medium text-gray-400 mr-1">{t('shareArticle')}</span>

      {platforms.map((p) => {
        const Icon = PLATFORM_ICON[p]
        const meta = PLATFORM_META[p]
        return (
          <button
            key={p}
            type="button"
            onClick={() => handlePlatform(p)}
            aria-label={t(meta.ariaKey)}
            className={`inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-gray-900
              text-gray-300 border border-gray-800 text-sm font-medium transition-colors
              focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${meta.hover}`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{meta.label}</span>
          </button>
        )
      })}

      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? t('linkCopied') : t('copyLink')}
        className={`inline-flex items-center gap-2 h-10 px-3 rounded-lg border text-sm font-medium
          transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50
          ${copied
            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
            : 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white'}`}
      >
        {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
        <span className="hidden sm:inline">{copied ? t('linkCopied') : t('copyLink')}</span>
      </button>

      {canNativeShare && (
        <button
          type="button"
          onClick={handleNativeShare}
          aria-label={t('shareOther')}
          className="inline-flex items-center gap-2 h-10 px-3 rounded-lg bg-gray-900
            text-gray-300 border border-gray-800 text-sm font-medium transition-colors
            hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2
            focus:ring-orange-500/50 sm:hidden"
        >
          <ShareIcon className="h-4 w-4" />
          <span>{t('shareOther')}</span>
        </button>
      )}
    </div>
  )
}
