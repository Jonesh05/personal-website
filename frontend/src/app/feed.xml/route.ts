import { getPosts, type Post } from '@/lib/firestore/posts'

/**
 * /feed.xml — RSS 2.0 feed of the 20 most recent published posts.
 *
 * The feed is built on-demand from Firestore (same source of truth as the
 * blog). We cache the response for one hour at the edge so feed readers
 * do not hammer Firestore. Cache is revalidated automatically when the
 * route is requested again after TTL, or whenever `revalidatePath('/feed.xml')`
 * is called from post CRUD actions.
 */

export const revalidate = 3600

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://jhonnypimiento.com'
const FEED_TITLE = 'Jhonny Pimiento'
const FEED_DESCRIPTION =
  'Technical articles on web systems, blockchain infrastructure, and product engineering.'
const FEED_LANGUAGE = 'en'

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function toRfc822(value: string | undefined): string {
  if (!value) return new Date().toUTCString()
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return new Date().toUTCString()
  return parsed.toUTCString()
}

function renderItem(post: Post): string {
  const url = `${SITE_URL}/blog/${post.slug}`
  const pubDate = toRfc822(post.createdAt)
  const description = post.excerpt ?? ''
  const categories = (post.tags ?? [])
    .map((tag) => `    <category>${escapeXml(tag)}</category>`)
    .join('\n')

  return [
    '  <item>',
    `    <title>${escapeXml(post.title)}</title>`,
    `    <link>${escapeXml(url)}</link>`,
    `    <guid isPermaLink="true">${escapeXml(url)}</guid>`,
    `    <pubDate>${pubDate}</pubDate>`,
    `    <description>${escapeXml(description)}</description>`,
    categories,
    '  </item>',
  ]
    .filter(Boolean)
    .join('\n')
}

export async function GET(): Promise<Response> {
  let posts: Post[] = []
  try {
    posts = await getPosts({ published: true, limit: 20 })
  } catch (error) {
    console.error('[feed.xml] Failed to read posts from Firestore:', error)
    // Serve an empty (but valid) feed rather than a 500 — RSS readers
    // should never break for downstream outages.
  }

  const lastBuildDate = posts[0]?.createdAt
    ? toRfc822(posts[0].createdAt)
    : new Date().toUTCString()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>${FEED_LANGUAGE}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(`${SITE_URL}/feed.xml`)}" rel="self" type="application/rss+xml" />
${posts.map(renderItem).join('\n')}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      // Edge/browser caching — max-age is short, s-maxage longer so CDNs
      // serve the cached response for 1h before hitting Firestore again.
      'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
