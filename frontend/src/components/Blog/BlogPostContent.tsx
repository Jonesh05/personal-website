'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import type { Post } from '@/lib/firestore/posts'
import { useLocale, useTranslations } from '@/i18n'
import { formatDateByLocale } from '@/utils/formatDate'
import { estimateReadingTime } from '@/utils/readingTime'
import { LikeButton } from '@/components/Blog/LikeButton'
import { SaveButton } from '@/components/Blog/SaveButton'
import { ShareButtons } from '@/components/Blog/ShareButtons'
import { ReadingProgress } from '@/components/Blog/ReadingProgress'
import { MarkdownContent } from '@/components/Blog/MarkdownContent'
import { useViewTracker } from '@/hooks/useViewTracker'

interface Props {
  post: Post & { readingTime?: number; coverImage?: string }
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function AuthorAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || 'JP'

  return (
    <div className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-orange-500 to-pink-500
      grid place-items-center text-white font-semibold text-sm ring-2 ring-gray-900">
      {initials}
    </div>
  )
}

export function BlogPostContent({ post }: Props) {
  const t = useTranslations('BlogPost')
  const tBlog = useTranslations('Blog')
  const { locale } = useLocale()
  useViewTracker(post.id)

  const readingTime = useMemo(
    () => post.readingTime ?? estimateReadingTime(post.content),
    [post.readingTime, post.content]
  )

  // Canonical share URL — prefers the configured site URL so shared links
  // always point to production even if a visitor shares while on staging.
  const [shareUrl, setShareUrl] = useState<string>('')
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    setShareUrl(`${base.replace(/\/$/, '')}/blog/${post.slug}`)
  }, [post.slug])

  const authorName = post.authorName ?? 'Jhonny Pimiento'
  const coverImage = post.featuredImage ?? post.coverImage ?? null
  const publishedLabel = formatDateByLocale(post.createdAt, locale)

  return (
    <>
      <ReadingProgress />

      <article className="min-h-screen bg-gray-950 pt-[106px] text-gray-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

          {/* Top breadcrumb */}
          <div className="pt-10">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-400
                hover:text-orange-300 transition-colors focus:outline-none focus:ring-2
                focus:ring-orange-500/40 rounded"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              {t('backToBlog')}
            </Link>
          </div>

          {/* Hero / header */}
          <header className="pt-8 pb-10 max-w-3xl">
            {post.tags?.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="inline-flex items-center rounded-full bg-orange-500/10
                      px-3 py-1 text-xs font-medium text-orange-300 ring-1 ring-inset
                      ring-orange-500/20 hover:bg-orange-500/15 transition"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-[1.1] tracking-tight">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="mt-5 text-lg sm:text-xl text-gray-400 leading-relaxed">
                {post.excerpt}
              </p>
            )}

            {/* Author card */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4
              rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur-sm
              px-4 py-3">
              <div className="flex items-center gap-3">
                <AuthorAvatar name={authorName} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{authorName}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1
                    text-xs text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      <time dateTime={post.createdAt}>{publishedLabel}</time>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon className="h-3.5 w-3.5" />
                      {readingTime} {t('minRead')}
                    </span>
                    {post.views != null && (
                      <span className="inline-flex items-center gap-1">
                        <EyeIcon className="h-3.5 w-3.5" />
                        {post.views.toLocaleString(locale === 'es' ? 'es-ES' : 'en-US')} {t('views')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Compact inline actions (visible only on ≥sm, when the sticky rail is hidden) */}
              <div className="hidden sm:flex lg:hidden items-center gap-2">
                <LikeButton postId={post.id} initialLikes={post.likes ?? 0} size="sm" />
                <SaveButton postId={post.id} slug={post.slug} title={post.title} size="sm" />
              </div>
            </div>
          </header>

          {/* Cover image — stretches across the main column */}
          {coverImage && (
            <figure className="mb-12 max-w-4xl overflow-hidden rounded-2xl
              ring-1 ring-gray-800 bg-gray-900">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src={coverImage}
                  alt={post.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  className="object-cover"
                />
              </div>
            </figure>
          )}

          {/* Main grid: sticky rail + article body */}
          <div className="relative grid grid-cols-1 lg:grid-cols-[64px_minmax(0,1fr)] gap-8">
            {/* Desktop sticky action rail */}
            <aside
              className="hidden lg:block"
              aria-label={tBlog('shareArticle')}
            >
              <div className="sticky top-28 flex flex-col items-center gap-3">
                <LikeButton postId={post.id} initialLikes={post.likes ?? 0} size="sm" />
                <SaveButton postId={post.id} slug={post.slug} title={post.title} size="sm" />
                <div className="w-8 h-px bg-gray-800 my-1" aria-hidden="true" />
                {shareUrl && (
                  <ShareButtons
                    url={shareUrl}
                    title={post.title}
                    description={post.excerpt}
                    variant="rail"
                  />
                )}
              </div>
            </aside>

            {/* Article body */}
            <div className="max-w-3xl">
              <MarkdownContent source={post.content} />

              {/* Tag cloud footer */}
              {post.tags?.length > 0 && (
                <div className="mt-16 pt-8 border-t border-gray-800">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
                    #tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/blog?tag=${encodeURIComponent(tag)}`}
                        className="inline-flex items-center rounded-full bg-gray-900
                          border border-gray-800 px-3 py-1 text-sm text-gray-300
                          hover:text-white hover:border-gray-700 transition"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Share CTA */}
              <div className="mt-12 rounded-2xl border border-gray-800 bg-gray-900/50 p-6
                sm:p-8 shadow-sm">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {t('enjoyedPrompt')}
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                      {post.views != null && (
                        <>
                          {post.views.toLocaleString(locale === 'es' ? 'es-ES' : 'en-US')}{' '}
                          {t('views')} · {post.likes ?? 0} likes
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <LikeButton postId={post.id} initialLikes={post.likes ?? 0} size="md" />
                    <SaveButton postId={post.id} slug={post.slug} title={post.title} size="md" />
                  </div>
                </div>
                {shareUrl && (
                  <div className="mt-5 pt-5 border-t border-gray-800">
                    <ShareButtons
                      url={shareUrl}
                      title={post.title}
                      description={post.excerpt}
                      variant="bar"
                    />
                  </div>
                )}
              </div>

              {/* Back to index */}
              <div className="mt-12 pb-32 lg:pb-16">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 text-sm font-medium
                    text-orange-400 hover:text-orange-300 transition-colors
                    focus:outline-none focus:ring-2 focus:ring-orange-500/40 rounded"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  {t('backToAllArticles')}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile floating action bar */}
        <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 pointer-events-none">
          <div className="mx-auto max-w-md px-4 pb-4">
            <div className="pointer-events-auto flex items-center justify-between gap-2
              rounded-2xl border border-gray-800 bg-gray-900/95 backdrop-blur-md
              px-3 py-2 shadow-lg shadow-black/40">
              <LikeButton postId={post.id} initialLikes={post.likes ?? 0} size="sm" />
              <SaveButton postId={post.id} slug={post.slug} title={post.title} size="sm" />
              {shareUrl && (
                <MobileShareTrigger
                  url={shareUrl}
                  title={post.title}
                  description={post.excerpt}
                />
              )}
            </div>
          </div>
        </div>
      </article>
    </>
  )
}

function MobileShareTrigger({
  url,
  title,
  description,
}: {
  url: string
  title: string
  description?: string
}) {
  const t = useTranslations('Blog')
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  const handleShare = async () => {
    if (canShare) {
      try {
        await navigator.share({ title, text: description, url })
      } catch {
        // user cancelled
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={t('shareArticle')}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900
        px-3 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800 hover:text-white
        focus:outline-none focus:ring-2 focus:ring-orange-500/50"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
      <span>{t('shareArticle')}</span>
    </button>
  )
}
