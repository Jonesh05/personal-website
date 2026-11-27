import { Suspense } from 'react'
import type { Metadata } from 'next'
import nextDynamic from 'next/dynamic'
import { InfinitePostList } from '@/components/Blog/InfinitePostList'
import BlogSidebar from '@/components/Blog/BlogSidebar'
import { BlogHeader } from '@/components/Blog/BlogHeader'
import BlogSectionSkeleton from '@/components/Blog/BlogSectionSkeleton'
import NewsletterForm from '@/components/Blog/NewsletterForm.client'
import { getPosts, type Post } from '@/lib/firestore/posts'
import { matchesPostSearch, scorePostSearch } from '@/utils/postSearch'
import { getServerTranslations } from '@/i18n/server'
import {
  buildBlogJsonLd,
  buildBreadcrumbListJsonLd,
  serializeJsonLd,
  type JsonLdGraph,
} from '@/lib/seo/jsonLd'

export const dynamic = 'force-dynamic'

const PlantSidebar = nextDynamic(() => import('@/components/Blog/PlantSidebar'), {
  loading: () => (
    <div
      className="h-[540px] rounded-2xl bg-slate-200/60 dark:bg-slate-800/40 animate-pulse"
      aria-hidden="true"
    />
  ),
})

interface BlogPageProps {
  searchParams: Promise<{
    tag?: string
    search?: string
  }>
}

export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
  const { tag, search } = await searchParams
  const hasFilter = Boolean(tag?.trim() || search?.trim())

  return {
    title: 'Blog | Jhonny Pimiento — Web3, Blockchain & Cloud Architecture',
    description:
      'Technical articles on Web3, blockchain engineering, distributed systems, and cloud architecture by Jhonny Pimiento.',
    keywords: ['Web3', 'Blockchain', 'Cloud Architecture', 'AWS', 'React', 'Next.js', 'TypeScript'],
    alternates: {
      canonical: '/blog',
    },
    ...(hasFilter
      ? {
          robots: {
            index: false,
            follow: true,
          },
        }
      : {}),
    openGraph: {
      title: 'Blog — Jhonny Pimiento',
      description:
        'Technical articles on Web3, blockchain engineering, distributed systems, and cloud architecture.',
      type: 'website',
      url: '/blog',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Blog — Jhonny Pimiento',
      description:
        'Technical articles on Web3, blockchain engineering, distributed systems, and cloud architecture.',
    },
  }
}

const INITIAL_PAGE_SIZE = 12

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { tag: selectedTag, search: searchQuery } = await searchParams
  const { t } = await getServerTranslations('Blog')

  // Server-side initial hydration so newly published posts appear immediately on SSR
  let allPublishedPosts: Post[] = []
  try {
    allPublishedPosts = await getPosts({
      published: true,
      tag: selectedTag,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    // eslint-disable-next-line no-console
    console.error(`[app/blog] initial SSR read failed: ${message}`)
  }

  const filteredPosts = searchQuery
    ? allPublishedPosts
        .filter((p) => matchesPostSearch(p, searchQuery))
        .sort((a, b) => scorePostSearch(b, searchQuery) - scorePostSearch(a, searchQuery))
    : allPublishedPosts

  const initialPosts = filteredPosts.slice(0, INITIAL_PAGE_SIZE)
  const initialTotal = filteredPosts.length
  const initialHasNext = filteredPosts.length > INITIAL_PAGE_SIZE

  const jsonLd: JsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBlogJsonLd(initialPosts),
      buildBreadcrumbListJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
      ]),
    ],
  }

  return (
    <main id="main-content" className="min-h-screen bg-slate-50 dark:bg-[#070B14]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      {/* Header */}
      <BlogHeader />

      <div className="mx-auto max-w-[90rem] px-4 py-12 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-10 xl:gap-12">
          {/* Plant Sidebar - Left Column */}
          <div className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24">
              <PlantSidebar />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-6">
            {/* Breadcrumbs y filtros activos */}
            {(selectedTag || searchQuery) && (
              <div className="mb-8 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/[0.08] dark:bg-[#0B111E]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span>{t('showingResultsFor')}</span>
                    {selectedTag && (
                      <span
                        className="inline-flex items-center rounded-lg border border-purple-300/60 bg-purple-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-purple-700 dark:border-purple-400/35 dark:bg-purple-500/15 dark:text-purple-300"
                      >
                        #{selectedTag}
                      </span>
                    )}
                    {searchQuery && (
                      <span
                        className="inline-flex items-center rounded-lg border border-emerald-300/60 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-emerald-700 dark:border-emerald-400/35 dark:bg-emerald-500/15 dark:text-emerald-300"
                      >
                        &ldquo;{searchQuery}&rdquo;
                      </span>
                    )}
                  </div>
                  <a
                    href="/blog"
                    className="inline-flex shrink-0 items-center text-xs font-mono text-slate-500 transition-colors hover:text-purple-700 dark:text-slate-400 dark:hover:text-emerald-300"
                  >
                    <svg className="mr-1 h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {t('clearFilters')}
                  </a>
                </div>
              </div>
            )}

            {/* Posts List con hidratación SSR inmediata + carga progresiva */}
            <Suspense fallback={<BlogSectionSkeleton count={6} />}>
              <InfinitePostList
                initialTag={selectedTag}
                initialSearch={searchQuery}
                initialPosts={initialPosts}
                initialTotal={initialTotal}
                initialHasNext={initialHasNext}
                allPosts={allPublishedPosts}
              />
            </Suspense>
          </div>

          {/* Sidebar */}
          <aside className="mt-12 lg:mt-0 lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              {/* Popular Tags */}
              <Suspense
                fallback={
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#0B111E]">
                    <div className="mb-4 h-5 w-32 rounded bg-slate-200 dark:bg-white/[0.06]"></div>
                    <div className="grid grid-cols-2 gap-2">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="h-8 rounded-xl bg-slate-200/80 dark:bg-white/[0.04]"
                        ></div>
                      ))}
                    </div>
                  </div>
                }
              >
                <BlogSidebar.PopularTags activeTag={selectedTag} />
              </Suspense>

              {/* Featured Posts */}
              <Suspense
                fallback={
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#0B111E]">
                    <div className="mb-4 h-5 w-32 rounded bg-slate-200 dark:bg-white/[0.06]"></div>
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex space-x-3">
                          <div className="h-16 w-16 rounded-xl bg-slate-200/80 dark:bg-white/[0.04]"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 rounded bg-slate-200/80 dark:bg-white/[0.04]"></div>
                            <div className="h-3 w-3/4 rounded bg-slate-200/60 dark:bg-white/[0.03]"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                }
              >
                <BlogSidebar.FeaturedPosts />
              </Suspense>

              {/* Newsletter Signup — Harmonized Editorial Card */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#0B111E] dark:shadow-[0_18px_48px_-18px_rgba(0,0,0,0.65)]">
                {/* Subtle plasma top hairline */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(124,58,237,0.85) 35%, rgba(16,185,129,0.85) 65%, transparent)',
                  }}
                />
                {/* Soft ambient corner glow */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-25 blur-2xl dark:opacity-20"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(124,58,237,0.55) 0%, rgba(16,185,129,0.3) 60%, transparent 100%)',
                  }}
                />

                <div className="relative">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-300/50 bg-purple-500/10 text-purple-700 dark:border-emerald-400/25 dark:bg-white/[0.04] dark:text-emerald-300">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.75}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h2
                      className="text-xl font-bold tracking-tight text-slate-900 dark:text-white"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {t('newsletterTitle')}
                    </h2>
                  </div>

                  <p className="mb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {t('newsletterBody')}
                  </p>

                  <NewsletterForm source="blog-sidebar" />

                  <p className="mt-3 text-center font-mono text-[11px] text-slate-400 dark:text-slate-500">
                    {t('newsletterNoSpam')}
                  </p>
                </div>
              </div>

              {/* About Widget */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#0B111E] dark:shadow-[0_18px_48px_-18px_rgba(0,0,0,0.65)]">
                <h2
                  className="mb-4 text-base font-bold tracking-tight text-slate-900 dark:text-slate-100"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {t('authorCardTitle')}
                </h2>
                <div className="flex items-start space-x-3.5">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm"
                    style={{
                      background:
                        'linear-gradient(135deg, #0284C7 0%, #06B6D4 52%, #10B981 100%)',
                    }}
                  >
                    <span className="font-bold text-base tracking-tight text-white">JP</span>
                  </div>
                  <div>
                    <h3
                      className="font-semibold text-slate-900 dark:text-white"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Jhonny Pimiento
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {t('authorBio')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
