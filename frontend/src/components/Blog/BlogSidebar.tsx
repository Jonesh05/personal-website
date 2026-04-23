import Link from 'next/link'
import Image from 'next/image'
import { getPopularTags, getFeaturedPosts } from '@/lib/firestore/posts'
import { getServerTranslations } from '@/i18n/server'
import { formatDateByLocale } from '@/utils/formatDate'

/**
 * BlogSidebar — server-rendered sidebar fragments consumed by the blog page.
 *
 * Only `PopularTags` and `FeaturedPosts` are currently mounted on
 * `/blog`, but we keep the full module bilingual so any future additions
 * (Newsletter, AboutAuthor, etc.) don't re-introduce Spanish leaks.
 */

interface BlogPostSidebarProps {
  postId: string
  tags: string[]
}

// ── Table of Contents ────────────────────────────────────────────────────────
async function TableOfContents({ content }: { content: string }) {
  const { t } = await getServerTranslations('Blog')
  const headings = content.match(/#{1,6} .+/g) || []
  if (headings.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('sidebarTableOfContents')}
      </h3>
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

// ── Reading Progress ─────────────────────────────────────────────────────────
async function ReadingProgress() {
  const { t } = await getServerTranslations('Blog')
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('sidebarReadingProgress')}
      </h3>
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

// ── Per-post sidebar (not currently mounted, kept bilingual) ─────────────────
export async function BlogPostSidebar({ tags }: BlogPostSidebarProps) {
  const { t } = await getServerTranslations('Blog')

  return (
    <div className="space-y-6">
      <ReadingProgress />

      {/* Related Tags */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('sidebarRelatedTags')}
        </h3>
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('sidebarQuickActions')}
        </h3>
        {/* Actions are interactive — intentionally defer to client component */}
      </div>
    </div>
  )
}

// ── Popular Tags (mounted) ───────────────────────────────────────────────────
async function PopularTags() {
  const { t } = await getServerTranslations('Blog')
  // Firestore failures must NEVER bring down the whole /blog page. The
  // sidebar is decorative — if the read fails or the Admin SDK is
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

  if (tags.length === 0) return null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('sidebarPopularTags')}
      </h3>
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
  )
}

// ── Featured Posts (mounted) ─────────────────────────────────────────────────
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('sidebarFeaturedPosts')}
      </h3>
      <div className="space-y-4">
        {featuredPosts.slice(0, 3).map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="flex space-x-3 group"
          >
            {post.featuredImage && (
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={post.featuredImage}
                  alt={post.title}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white 
                group-hover:text-blue-600 dark:group-hover:text-blue-400 
                transition-colors line-clamp-2">
                {post.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formatDateByLocale(post.createdAt, locale)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Newsletter (unused, kept bilingual) ──────────────────────────────────────
async function Newsletter() {
  const { t } = await getServerTranslations('Blog')
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 
      dark:to-indigo-900/20 rounded-lg p-6 border border-blue-100 dark:border-blue-800">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {t('newsletterTitle')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('newsletterBody')}
        </p>
        <div className="space-y-3">
          <input
            type="email"
            placeholder={t('newsletterEmailPlaceholder')}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
              rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
              placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none 
              focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            className="w-full flex justify-center py-2 px-4 border border-transparent 
              rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 
              hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
              focus:ring-blue-500 transition-colors"
          >
            {t('newsletterSubscribe')}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {t('newsletterNoSpam')}
        </p>
      </div>
    </div>
  )
}

// ── About Author (unused, kept bilingual) ────────────────────────────────────
async function AboutAuthor() {
  const { t } = await getServerTranslations('Blog')
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {t('authorCardTitle')}
      </h3>
      <div className="flex items-start space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 
          rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-lg">JP</span>
        </div>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">Jhonny Pimiento</h4>
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
