'use client'

/**
 * Resilient, zero-crash image component for Blog covers & thumbnails.
 *
 * Why this exists:
 * 1. `next/image` throws a fatal runtime exception if an author pastes a URL
 *    from a new host or a signed URL (`?token=...`) that isn't whitelisted.
 * 2. When a post has no `featuredImage` or a signed URL expires (HTTP 403/404),
 *    we degrade gracefully to a subtle, Figma-grade editorial cover canvas
 *    using the site's typography and subtle ambient lighting — never crashing
 *    the page and never showing a broken image icon.
 */

import { useState } from 'react'

interface BlogCoverImageProps {
  src?: string | null
  alt: string
  categoryTag?: string
  priority?: boolean
  aspectClassName?: string
  className?: string
}

export function BlogCoverImage({
  src,
  alt,
  categoryTag,
  priority = false,
  aspectClassName = 'aspect-[16/10]',
  className = '',
}: BlogCoverImageProps) {
  const [failed, setFailed] = useState(false)
  const cleanSrc = typeof src === 'string' ? src.trim() : ''
  const showImage = Boolean(cleanSrc) && !failed

  return (
    <div
      className={`relative w-full overflow-hidden bg-slate-100 dark:bg-[#0B111E] ${aspectClassName} ${className}`}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cleanSrc}
          alt={alt}
          width={1200}
          height={750}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
        />
      ) : (
        /* Editorial Fallback Canvas — Minimalist Linear/Vercel-inspired surface */
        <div
          className="relative flex h-full w-full flex-col justify-between p-6 select-none"
          style={{
            background:
              'radial-gradient(120% 120% at 85% 15%, rgba(124, 58, 237, 0.16) 0%, rgba(16, 185, 129, 0.06) 45%, rgba(8, 14, 24, 0.98) 100%)',
          }}
          aria-hidden="true"
        >
          {/* Subtle architectural dot matrix */}
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(rgba(255, 255, 255, 0.14) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          <div className="relative z-10 flex items-center justify-between">
            <span
              className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {categoryTag ? `#${categoryTag}` : 'EDITORIAL'}
            </span>
            <span
              className="h-1.5 w-1.5 rounded-full bg-emerald-400/70"
            />
          </div>

          {/* Minimal geometric emblem instead of duplicating the card title */}
          <div className="relative z-10 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <span className="h-[2px] w-7 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 opacity-80" />
              <span
                className="text-[10px] uppercase tracking-[0.2em] text-slate-500"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Article
              </span>
            </div>
            <svg
              className="h-7 w-7 text-cyan-400/30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              aria-hidden="true"
            >
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
              <line x1="12" y1="22" x2="12" y2="12" />
              <line x1="22" y1="8.5" x2="12" y2="12" />
              <line x1="2" y1="8.5" x2="12" y2="12" />
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlogCoverImage
