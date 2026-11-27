import Link from 'next/link'
import type { Post } from '@/lib/firestore/posts'
import { BlogCoverImage } from './BlogCoverImage.client'
import { estimateReadingTime } from '@/utils/readingTime'
import { normalizePostTitle } from '@/utils/postSearch'

interface PostCardProps {
  post: Post
  headingLevel?: 'h2' | 'h3'
}

function formatShortDate(isoDate?: string): string {
  if (!isoDate) return ''
  const parsed = Date.parse(isoDate)
  if (Number.isNaN(parsed)) return ''
  return new Date(parsed).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function PostCard({ post, headingLevel = 'h2' }: PostCardProps) {
  const { title, slug, excerpt, featuredImage, tags, authorName, createdAt, content } = post
  const displayTitle = normalizePostTitle(title)
  const primaryTag = tags?.[0]
  const readMinutes = estimateReadingTime(content ?? '')
  const dateLabel = formatShortDate(createdAt)
  const HeadingTag = headingLevel

  return (
    <Link
      href={`/blog/${slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 ease-out hover:-translate-y-1 hover:border-purple-300/70 hover:shadow-[0_22px_45px_-16px_rgba(124,58,237,0.16)] dark:border-white/[0.08] dark:bg-[#0B111E] dark:hover:border-purple-400/30 dark:hover:shadow-[0_24px_54px_-16px_rgba(0,0,0,0.75)]"
    >
      {/* Subtle plasma accent hairline on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(191,94,255,0.85) 35%, rgba(0,255,178,0.85) 65%, transparent)',
        }}
      />

      {/* Top 16:10 Cover Canvas */}
      <div className="relative w-full overflow-hidden border-b border-slate-100 dark:border-white/[0.06]">
        <div className="transition-transform duration-500 ease-out group-hover:scale-[1.03]">
          <BlogCoverImage
            src={featuredImage}
            alt={title}
            categoryTag={primaryTag}
            aspectClassName="aspect-[16/10]"
          />
        </div>
      </div>

      {/* Editorial Body */}
      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          {/* Metadata Eyebrow: Tag + Reading Time */}
          <div className="mb-3 flex items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {tags && tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-md border border-slate-200/70 bg-slate-100/90 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-700 transition-colors group-hover:border-purple-300/60 group-hover:text-purple-700 dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-slate-300 dark:group-hover:border-emerald-400/30 dark:group-hover:text-emerald-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
            <span className="shrink-0 font-mono text-[11px] text-slate-400 dark:text-slate-500">
              {readMinutes} min read
            </span>
          </div>

          {/* Headline */}
          <HeadingTag
            className="mb-2.5 line-clamp-2 text-[19px] font-bold leading-snug tracking-[-0.015em] text-slate-900 transition-colors duration-200 group-hover:text-cyan-700 dark:text-slate-100 dark:group-hover:text-emerald-300"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {displayTitle}
          </HeadingTag>

          {/* Excerpt */}
          {excerpt && (
            <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {excerpt}
            </p>
          )}
        </div>

        {/* Footer Hairline: Author, Date & Read Cue */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-white/[0.06] dark:text-slate-400">
          <span className="truncate font-medium text-slate-700 dark:text-slate-300">
            {authorName ?? 'Jhonny Pimiento'}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            {dateLabel && (
              <time
                dateTime={createdAt}
                className="font-mono text-[11px] text-slate-400 dark:text-slate-500"
              >
                {dateLabel}
              </time>
            )}
            <span
              aria-hidden="true"
              className="font-mono text-xs text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-purple-600 dark:text-slate-500 dark:group-hover:text-emerald-400"
            >
              →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
