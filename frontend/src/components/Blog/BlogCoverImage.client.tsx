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
          loading={priority ? 'eager' : 'lazy'}
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

          <p
            className="relative z-10 line-clamp-2 text-base font-semibold leading-snug text-slate-200/90"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {alt}
          </p>
        </div>
      )}
    </div>
  )
}

export default BlogCoverImage
