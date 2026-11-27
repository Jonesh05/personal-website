import { NextRequest } from 'next/server'
import { getPosts, type Post } from '@/lib/firestore/posts'
import { getSiteUrl } from '@/lib/siteConfig'

/**
 * /feed.xml — Enriched RSS 2.0 feed of the 20 most recent published posts.
 *
 * Supports optional tag filtering via `/feed.xml?tag=<slug>` (strictly
 * validated against `^[a-z0-9-]{1,40}$` to prevent cache-busting abuse or
 * injection). Cached at the edge for 1 hour to protect Firebase Spark quotas.
 */

export const revalidate = 3600

const FEED_TITLE = 'Jhonny Pimiento'
const FEED_DESCRIPTION =
  'Technical articles on Web3, cybersecurity, AI engineering, and cloud architecture.'
const FEED_LANGUAGE = 'en'
const TAG_RE = /^[a-z0-9-]{1,40}$/

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function escapeCdata(html: string): string {
  // Closing sequence `]]>` must be split so it cannot terminate the CDATA block.
  return html.replace(/]]>/g, ']]]]><![CDATA[>')
}

function toRfc822(value: string | undefined): string {
  if (!value) return new Date().toUTCString()
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return new Date().toUTCString()
  return parsed.toUTCString()
}

function resolveSafeImageUrl(raw: string | undefined, siteUrl: string): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null

  if (trimmed.startsWith('/')) {
    return `${siteUrl}${trimmed}`
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'https:') {
      return parsed.toString()
    }
  } catch {
    return null
  }
  return null
}

function inferImageMime(url: string): string {
  const lower = url.toLowerCase().split('?')[0]
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.svg')) return 'image/svg+xml'
  return 'image/jpeg'
}

/**
 * Lightweight, XSS-safe Markdown → HTML serializer for `<content:encoded>`.
 * Escapes raw HTML first so no untrusted markup can leak into RSS readers.
 */
function markdownToSafeHtml(markdown: string): string {
  const escaped = escapeXml(markdown.trim())
  if (!escaped) return ''

  // Extract fenced code blocks first so their internals aren't mangled.
  const codeBlocks: string[] = []
  const withPlaceholders = escaped.replace(
    /```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g,
    (_, code: string) => {
      const idx = codeBlocks.length
      codeBlocks.push(`<pre><code>${code.trimEnd()}</code></pre>`)
      return `\u0000CODEBLOCK_${idx}\u0000`
    },
  )

  const blocks = withPlaceholders
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const codeMatch = block.match(/^\u0000CODEBLOCK_(\d+)\u0000$/)
      if (codeMatch) return codeBlocks[Number(codeMatch[1])]

      const headingMatch = block.match(/^(#{1,4})\s+(.+)$/)
      if (headingMatch) {
        const level = Math.min(headingMatch[1].length + 1, 5)
        return `<h${level}>${formatInline(headingMatch[2])}</h${level}>`
      }

      if (block.startsWith('&gt; ')) {
        const quote = block.replace(/^&gt;\s?/gm, '')
        return `<blockquote><p>${formatInline(quote).replace(/\n/g, '<br/>')}</p></blockquote>`
      }

      return `<p>${formatInline(block).replace(/\n/g, '<br/>')}</p>`
    })

  return blocks.join('\n')
}

function formatInline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')
}

function renderItem(post: Post, siteUrl: string): string {
  const url = `${siteUrl}/blog/${post.slug}`
  const pubDate = toRfc822(post.createdAt)
  const description = post.excerpt || post.content?.slice(0, 240) || ''
  const author = post.authorName?.trim() || FEED_TITLE
  const imageUrl = resolveSafeImageUrl(post.featuredImage, siteUrl)
  const categories = (post.tags ?? [])
    .map((tag) => `    <category>${escapeXml(tag)}</category>`)
    .join('\n')

  const bodyHtml = markdownToSafeHtml(post.content || post.excerpt || '')
  const coverHtml = imageUrl
    ? `<p><img src="${escapeXml(imageUrl)}" alt="${escapeXml(post.title)}" /></p>\n`
    : ''
  const encodedContent = coverHtml + bodyHtml

  return [
    '  <item>',
    `    <title>${escapeXml(post.title)}</title>`,
    `    <link>${escapeXml(url)}</link>`,
    `    <guid isPermaLink="true">${escapeXml(url)}</guid>`,
    `    <pubDate>${pubDate}</pubDate>`,
    `    <dc:creator>${escapeXml(author)}</dc:creator>`,
    `    <description>${escapeXml(description)}</description>`,
    encodedContent
      ? `    <content:encoded><![CDATA[${escapeCdata(encodedContent)}]]></content:encoded>`
      : '',
    imageUrl
      ? `    <enclosure url="${escapeXml(imageUrl)}" length="0" type="${inferImageMime(imageUrl)}" />`
      : '',
    categories,
    '  </item>',
  ]
    .filter(Boolean)
    .join('\n')
}

export async function GET(req: NextRequest): Promise<Response> {
  const rawTag = req.nextUrl.searchParams.get('tag')?.trim().toLowerCase() ?? ''
  if (rawTag && !TAG_RE.test(rawTag)) {
    return new Response('Invalid tag parameter', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  const siteUrl = getSiteUrl()
  const selfUrl = rawTag
    ? `${siteUrl}/feed.xml?tag=${encodeURIComponent(rawTag)}`
    : `${siteUrl}/feed.xml`
  const channelTitle = rawTag ? `${FEED_TITLE} — #${rawTag}` : FEED_TITLE

  let posts: Post[] = []
  try {
    posts = await getPosts({
      published: true,
      ...(rawTag ? { tag: rawTag } : {}),
      limit: 20,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[feed.xml] Failed to read posts from Firestore:', error)
    // Serve an empty (but valid) feed rather than a 500 — RSS readers
    // should never break on downstream outages.
  }

  const lastBuildDate = posts[0]?.createdAt
    ? toRfc822(posts[0].createdAt)
    : new Date().toUTCString()

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(`${siteUrl}/blog`)}</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>${FEED_LANGUAGE}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" />
${posts.map((post) => renderItem(post, siteUrl)).join('\n')}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      // Edge/browser caching: short browser max-age, 1h CDN s-maxage to protect
      // Firebase Spark daily read quotas.
      'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
