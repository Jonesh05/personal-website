import { cache } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPostBySlug, getRelatedPosts, type Post } from '@/lib/firestore/posts'
import { BlogPostContent } from '@/components/Blog/BlogPostContent'
import { BlogBreadcrumbs } from '@/components/Blog/BlogBreadcrumbs'
import BlogCoverImage from '@/components/Blog/BlogCoverImage.client'
import { getServerLocale } from '@/i18n/server'
import { formatDateByLocale } from '@/utils/formatDate'
import { getSiteUrl } from '@/lib/siteConfig'
import {
  buildBlogPostingJsonLd,
  buildBreadcrumbListJsonLd,
  serializeJsonLd,
  type JsonLdGraph,
} from '@/lib/seo/jsonLd'

interface Props {
  params: Promise<{ slug: string }>
}

const getCachedPost = cache(async (slug: string): Promise<Post | null> => {
  try {
    return await getPostBySlug(slug)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[blog/${slug}] Failed to fetch post: ${message}`)
    return null
  }
})

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getCachedPost(slug)

  if (!post || !post.published) notFound()

  const locale = await getServerLocale()

  let relatedPosts: Post[] = []
  if (post.tags && post.tags.length > 0) {
    try {
      relatedPosts = await getRelatedPosts(post.tags, post.id, 3)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.warn(`[blog/${slug}] Failed to fetch related posts: ${message}`)
    }
  }

  const jsonLd: JsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      buildBlogPostingJsonLd(post),
      buildBreadcrumbListJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Blog', path: '/blog' },
        { name: post.title, path: `/blog/${post.slug}` },
      ]),
    ],
  }

  const relatedHeading = locale === 'es' ? 'Artículos relacionados' : 'Related Articles'

  return (
    <main id="main-content" className="bg-white dark:bg-[#060911]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      {/* Views are tracked client-side via useViewTracker so we can dedup per
          visitor/day and avoid inflating counts on refresh, prefetch, or SSR revalidation. */}
      <BlogPostContent post={post} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-16 space-y-12 border-t border-slate-200/80 dark:border-white/[0.08] pt-8">
        <BlogBreadcrumbs
          items={[
            { label: 'Blog', href: '/blog' },
            { label: post.title, href: `/blog/${post.slug}` },
          ]}
        />

        {relatedPosts.length > 0 && (
          <section aria-labelledby="related-articles-heading" className="space-y-6">
            <h2
              id="related-articles-heading"
              className="text-2xl font-bold text-slate-900 dark:text-white"
            >
              {relatedHeading}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  className="group block bg-white dark:bg-gray-900/70 rounded-xl border border-slate-200/80 dark:border-white/[0.08] hover:border-purple-400/50 dark:hover:border-purple-400/40 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="relative overflow-hidden border-b border-slate-200/70 dark:border-slate-800/80">
                    <BlogCoverImage
                      src={related.featuredImage}
                      alt={related.title}
                      categoryTag={related.tags?.[0]}
                      aspectClassName="aspect-[16/9]"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors line-clamp-2 mb-2">
                      {related.title}
                    </h3>

                    {related.excerpt && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                        {related.excerpt}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{related.authorName || 'Jhonny Pimiento'}</span>
                      <time dateTime={related.createdAt}>
                        {formatDateByLocale(related.createdAt, locale)}
                      </time>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getCachedPost(slug)

  if (!post || !post.published) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const siteUrl = getSiteUrl()
  const canonicalPath = `/blog/${post.slug}`
  const postUrl = `${siteUrl}${canonicalPath}`
  const description =
    post.excerpt?.trim() || 'Technical article by Jhonny Pimiento on jonesh.me.'
  const authorName = post.authorName?.trim() || 'Jhonny Pimiento'
  const featuredImage = post.featuredImage?.trim()

  return {
    title: post.title,
    description,
    keywords: post.tags,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: 'article',
      url: postUrl,
      title: post.title,
      description,
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt || post.createdAt,
      authors: [authorName],
      tags: post.tags,
      ...(featuredImage
        ? {
            images: [{ url: featuredImage, alt: post.title }],
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      ...(featuredImage ? { images: [featuredImage] } : {}),
    },
  }
}
