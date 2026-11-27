import { Suspense } from 'react'
import { Metadata } from 'next'
import { InfinitePostList } from '@/components/Blog/InfinitePostList'
import BlogSidebar from '@/components/Blog/BlogSidebar'
import { BlogHeader } from '@/components/Blog/BlogHeader'
import PlantSidebar from '@/components/Blog/PlantSidebar'
import BlogSectionSkeleton from '@/components/Blog/BlogSectionSkeleton'
import NewsletterForm from '@/components/Blog/NewsletterForm.client'
import { getPosts, type Post } from '@/lib/firestore/posts'
import { getServerTranslations } from '@/i18n/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Blog | Jhonny Pimiento - Web3, Blockchain & Cloud Architecture',
  description:
    'Insights técnicos sobre Web3, desarrollo blockchain, arquitectura en la nube y las últimas tendencias en tecnología.',
  keywords: ['Web3', 'Blockchain', 'Cloud Architecture', 'AWS', 'React', 'Next.js', 'TypeScript'],
  openGraph: {
    title: 'Blog - Jhonny Pimiento',
    description: 'Insights técnicos sobre Web3, desarrollo blockchain y arquitectura en la nube.',
    type: 'website',
    url: '/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog - Jhonny Pimiento',
    description: 'Insights técnicos sobre Web3, desarrollo blockchain y arquitectura en la nube.',
  },
}

interface BlogPageProps {
  searchParams: Promise<{
    tag?: string
    search?: string
  }>
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
    ? allPublishedPosts.filter(
        p =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : allPublishedPosts

  const initialPosts = filteredPosts.slice(0, INITIAL_PAGE_SIZE)
  const initialTotal = filteredPosts.length
  const initialHasNext = filteredPosts.length > INITIAL_PAGE_SIZE

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <BlogHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
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
              <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>{t('showingResultsFor')}</span>
                    {selectedTag && (
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs 
                        font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        #{selectedTag}
                      </span>
                    )}
                    {searchQuery && (
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs 
                        font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      >
                        &ldquo;{searchQuery}&rdquo;
                      </span>
                    )}
                  </div>
                  <a
                    href="/blog"
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 
                      dark:hover:text-blue-300 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              />
            </Suspense>
          </div>

          {/* Sidebar */}
          <div className="mt-12 lg:mt-0 lg:col-span-3">
            <div className="sticky top-24 space-y-8">
              {/* Search Widget */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('searchArticles')}
                </h3>
                <form action="/blog" method="get" className="space-y-3">
                  <div>
                    <label htmlFor="search" className="sr-only">
                      {t('searchButton')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <input
                        id="search"
                        name="search"
                        type="text"
                        defaultValue={searchQuery}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 
                          rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                          placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none 
                          focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder={t('searchPlaceholder')}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md 
                      shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {t('searchButton')}
                  </button>
                </form>
              </div>

              {/* Popular Tags */}
              <Suspense
                fallback={
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="space-y-2">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 inline-block mr-2"
                        ></div>
                      ))}
                    </div>
                  </div>
                }
              >
                <BlogSidebar.PopularTags />
              </Suspense>

              {/* Featured Posts */}
              <Suspense
                fallback={
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex space-x-3">
                          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                }
              >
                <BlogSidebar.FeaturedPosts />
              </Suspense>

              {/* Newsletter Signup — Interactive Execution Layer Widget */}
              <div
                className="bg-linear-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 
                dark:to-indigo-900/20 rounded-lg p-6 border border-blue-100 dark:border-blue-800"
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {t('newsletterTitle')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t('newsletterBody')}
                  </p>
                  <NewsletterForm source="blog-sidebar" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {t('newsletterNoSpam')}
                  </p>
                </div>
              </div>

              {/* About Widget */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t('authorCardTitle')}
                </h3>
                <div className="flex items-start space-x-3">
                  <div
                    className="w-12 h-12 bg-linear-to-br from-purple-500 to-pink-500 
                    rounded-full flex items-center justify-center shrink-0"
                  >
                    <span className="text-white font-bold text-lg">JP</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Jhonny Pimiento</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('authorBio')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
