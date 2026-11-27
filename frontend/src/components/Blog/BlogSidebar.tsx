import Link from 'next/link'
import { getPopularTags, getFeaturedPosts } from '@/lib/firestore/posts'
import { getServerTranslations } from '@/i18n/server'
import { formatDateByLocale } from '@/utils/formatDate'
import NewsletterForm from './NewsletterForm.client'
import BlogCoverImage from './BlogCoverImage.client'
import { PopularTagsClient } from './PopularTags.client'

interface BlogPostSidebarProps {
  postId: string
  tags: string[]
}
async function TableOfContents({ content }: { content: string }) {
  const { t } = await getServerTranslations('Blog')
  const headings = content.match(/#{1,6} .+/g) || []
  if (headings.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('sidebarTableOfContents')}
      </h2>
      <nav className="space-y-2">
        {headings.map((heading, index) => {
          const level = heading.match(/^#+/)?.[0].length || 1
          const text = heading.replace(/^#+\s/, '')
          const id = text.toLowerCase().replace(/[^\w]+/g, '-')

          return (
            <a
              key={index}
              href={`#${id}`}
              className={`block text-sm hover:text-blue-600 dark:hover:text-blue-400 
                transition-colors ${level > 2 ? 'pl-4' : ''}`}
              style={{ paddingLeft: `${(level - 1) * 12}px` }}
            >
              {text}
            </a>
          )
        })}
      </nav>
    </div>
  )
}

async function ReadingProgress() {
  const { t } = await getServerTranslations('Blog')
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('sidebarReadingProgress')}
      </h2>
      <div className="space-y-3">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{t('sidebarCompleted')}</span>
          <span id="reading-percentage">0%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            id="reading-progress-bar"
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: '0%' }}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('sidebarEstimatedTime')} <span id="estimated-time">5 min</span>
        </p>
      </div>
    </div>
  )
}

export async function BlogPostSidebar({ tags }: BlogPostSidebarProps) {
  const { t } = await getServerTranslations('Blog')

  return (
    <div className="space-y-6">
      <ReadingProgress />

      {/* Related Tags */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('sidebarRelatedTags')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/blog?tag=${encodeURIComponent(tag)}`}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium 
                bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 
                dark:text-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('sidebarQuickActions')}
        </h2>
        {/* Actions are interactive, intentionally defer to client component */}
      </div>
    </div>
  )
}

async function PopularTags({ activeTag }: { activeTag?: string } = {}) {
  const { t } = await getServerTranslations('Blog')
  // Firestore failures must NEVER bring down the whole /blog page. The
  // sidebar is decorative if the read fails or the Admin SDK is
  // misconfigured, render nothing and let the page keep serving.
  let tags: string[] = []
  try {
    tags = await getPopularTags()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // eslint-disable-next-line no-console
    console.error(`[BlogSidebar.PopularTags] firestore read failed: ${message}`)
    return null
  }

  // Deduplicate case-insensitively (e.g. "#History" and "#history" collapse into one)
  const seen = new Map<string, string>()
  for (const raw of tags) {
    const cleaned = raw.trim()
    if (!cleaned) continue
    const key = cleaned.toLowerCase()
    const existing = seen.get(key)
    if (!existing || (existing === existing.toLowerCase() && cleaned !== cleaned.toLowerCase())) {
      seen.set(key, cleaned)
    }
  }
  const uniqueTags = Array.from(seen.values())

  if (uniqueTags.length === 0) return null

  return (
    <PopularTagsClient
      title={t('sidebarPopularTags')}
      tags={uniqueTags}
      activeTag={activeTag}
    />
  )
}

async function FeaturedPosts() {
  const { t, locale } = await getServerTranslations('Blog')
  // Degrade gracefully: no featured-posts widget if Firestore is
  // unreachable or the Admin SDK failed to initialize.
  let featuredPosts: Awaited<ReturnType<typeof getFeaturedPosts>> = []
  try {
    featuredPosts = await getFeaturedPosts()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // eslint-disable-next-line no-console
    console.error(`[BlogSidebar.FeaturedPosts] firestore read failed: ${message}`)
    return null
  }

  if (featuredPosts.length === 0) return null

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#0B111E] dark:shadow-[0_18px_48px_-18px_rgba(0,0,0,0.65)]">
      <h2
        className="mb-4 text-base font-bold tracking-tight text-slate-900 dark:text-slate-100"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {t('sidebarFeaturedPosts')}
      </h2>
      <div className="space-y-4">
        {featuredPosts.slice(0, 3).map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="flex space-x-3 group"
          >
            {post.featuredImage && (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-slate-200/70 dark:ring-white/[0.08]">
                <BlogCoverImage
                  src={post.featuredImage}
                  alt={post.title}
                  categoryTag={post.tags?.[0]}
                  aspectClassName="aspect-square h-full"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 
                group-hover:text-purple-700 dark:group-hover:text-emerald-300 
                transition-colors line-clamp-2">
                {post.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                {formatDateByLocale(post.createdAt, locale)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// Newsletter 
async function Newsletter() {
  const { t } = await getServerTranslations('Blog')
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 
      dark:to-indigo-900/20 rounded-lg p-6 border border-blue-100 dark:border-blue-800">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('newsletterTitle')}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('newsletterBody')}
        </p>
        <NewsletterForm source="blog-sidebar" />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {t('newsletterNoSpam')}
        </p>
      </div>
    </div>
  )
}

async function AboutAuthor() {
  const { t } = await getServerTranslations('Blog')
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('authorCardTitle')}
      </h2>
      <div className="flex items-start space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 
          rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-lg">JP</span>
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">Jhonny Pimiento</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('authorBio')}
          </p>
        </div>
      </div>
    </div>
  )
}

const BlogSidebar = {
  PopularTags,
  FeaturedPosts,
  Newsletter,
  AboutAuthor,
}

export default BlogSidebar
export { PopularTags, FeaturedPosts, Newsletter, AboutAuthor, TableOfContents, ReadingProgress }
