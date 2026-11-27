import type { MetadataRoute } from 'next'
import { getPosts, type Post } from '@/lib/firestore/posts'
import { getSiteUrl } from '@/lib/siteConfig'

export const dynamic = 'force-dynamic'

function toSafeDate(value?: string): Date {
  if (!value) return new Date()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/work`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/disclaimer`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  let posts: Post[] = []
  try {
    posts = await getPosts({ published: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[sitemap] Skipping dynamic blog posts because Firestore read failed: ${message}`)
  }

  const postRoutes: MetadataRoute.Sitemap = posts
    .filter((post) => Boolean(post.slug))
    .map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: toSafeDate(post.updatedAt || post.createdAt),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

  return [...staticRoutes, ...postRoutes]
}
