import type { Post } from '@/lib/firestore/posts'
import { getSiteUrl } from '@/lib/siteConfig'

export interface BreadcrumbInput {
  name: string
  path: string
}

export interface JsonLdNode {
  '@context'?: 'https://schema.org'
  '@type': string
  [key: string]: unknown
}

export interface JsonLdGraph {
  '@context': 'https://schema.org'
  '@graph': JsonLdNode[]
}

const AUTHOR_NAME = 'Jhonny Pimiento'
const AUTHOR_JOB_TITLE = 'Senior Software & Web3 Engineer'
const AUTHOR_SAME_AS = [
  'https://github.com/jonesh05',
  'https://linkedin.com/in/jhonny-pimiento',
] as const

const AUTHOR_KNOWS_ABOUT = [
  'Web3',
  'Blockchain',
  'Distributed Systems',
  'Cloud Architecture',
  'TypeScript',
  'Next.js',
  'Smart Contracts',
] as const

/**
 * Safely serializes JSON-LD for embedding inside `<script type="application/ld+json">`,
 * escaping `<` as `\u003c` to prevent script-tag breakout / XSS injection.
 */
export function serializeJsonLd(data: JsonLdNode | JsonLdGraph): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

function toAbsoluteUrl(siteUrl: string, path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  const normalized = path.startsWith('/') ? path : `/${path}`
  return normalized === '/' ? siteUrl : `${siteUrl}${normalized}`
}

export function buildPersonJsonLd(): JsonLdNode {
  const siteUrl = getSiteUrl()

  return {
    '@type': 'Person',
    '@id': `${siteUrl}/#person`,
    name: AUTHOR_NAME,
    url: siteUrl,
    jobTitle: AUTHOR_JOB_TITLE,
    sameAs: [...AUTHOR_SAME_AS],
    knowsAbout: [...AUTHOR_KNOWS_ABOUT],
  }
}

export function buildWebSiteJsonLd(): JsonLdNode {
  const siteUrl = getSiteUrl()

  return {
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: siteUrl,
    name: `${AUTHOR_NAME} — ${AUTHOR_JOB_TITLE}`,
    description:
      'Portfolio and technical blog of Jhonny Pimiento, Senior Software & Web3 Engineer specializing in blockchain, distributed systems, and cloud architecture.',
    publisher: {
      '@id': `${siteUrl}/#person`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/blog?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildProfilePageJsonLd(): JsonLdNode {
  const siteUrl = getSiteUrl()

  return {
    '@type': 'ProfilePage',
    '@id': `${siteUrl}/#profile`,
    url: siteUrl,
    name: `${AUTHOR_NAME} — ${AUTHOR_JOB_TITLE}`,
    mainEntity: {
      '@id': `${siteUrl}/#person`,
    },
    isPartOf: {
      '@id': `${siteUrl}/#website`,
    },
  }
}

export function buildBlogJsonLd(posts: ReadonlyArray<Post>): JsonLdNode {
  const siteUrl = getSiteUrl()
  const blogUrl = `${siteUrl}/blog`

  return {
    '@type': 'Blog',
    '@id': `${blogUrl}#blog`,
    url: blogUrl,
    name: `Blog — ${AUTHOR_NAME}`,
    description:
      'Technical articles on Web3, blockchain engineering, distributed systems, and cloud architecture.',
    publisher: {
      '@type': 'Person',
      '@id': `${siteUrl}/#person`,
      name: AUTHOR_NAME,
      url: siteUrl,
    },
    blogPost: posts.slice(0, 12).map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${siteUrl}/blog/${post.slug}`,
      datePublished: post.createdAt,
      dateModified: post.updatedAt || post.createdAt,
      description: post.excerpt || undefined,
      author: {
        '@type': 'Person',
        name: post.authorName?.trim() || AUTHOR_NAME,
        url: siteUrl,
      },
    })),
  }
}

export function buildBlogPostingJsonLd(post: Post): JsonLdNode {
  const siteUrl = getSiteUrl()
  const postUrl = `${siteUrl}/blog/${post.slug}`
  const imageUrl = post.featuredImage?.trim()
    ? toAbsoluteUrl(siteUrl, post.featuredImage.trim())
    : `${postUrl}/opengraph-image`
  const authorName = post.authorName?.trim() || AUTHOR_NAME

  return {
    '@type': 'BlogPosting',
    '@id': `${postUrl}#article`,
    headline: post.title,
    description: post.excerpt || undefined,
    url: postUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
    image: imageUrl,
    datePublished: post.createdAt,
    dateModified: post.updatedAt || post.createdAt,
    author: {
      '@type': 'Person',
      '@id': `${siteUrl}/#person`,
      name: authorName,
      url: siteUrl,
    },
    publisher: {
      '@type': 'Person',
      '@id': `${siteUrl}/#person`,
      name: AUTHOR_NAME,
      url: siteUrl,
    },
    keywords: post.tags && post.tags.length > 0 ? post.tags.join(', ') : undefined,
    isPartOf: {
      '@id': `${siteUrl}/blog#blog`,
    },
  }
}

export function buildBreadcrumbListJsonLd(
  items: ReadonlyArray<BreadcrumbInput>
): JsonLdNode {
  const siteUrl = getSiteUrl()

  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(siteUrl, item.path),
    })),
  }
}
