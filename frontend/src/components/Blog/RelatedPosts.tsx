// frontend/src/components/Blog/RelatedPosts.tsx
import Link from 'next/link'
import Image from 'next/image'
import type { Post } from '@personal-website/shared'
import { getRelatedPosts } from '@/lib/firestore/posts'
import { LOCALE_TO_HREFLANG } from '@/i18n/routing'


interface RelatedPostsProps {
    postId: string
    tags: string[]
    locale?: string
}

interface RelatedPostCardProps {
    post: Post
    dateLocale: string
}

function formatPostDate(createdAt: string, locale: string): string {
    const ms = Date.parse(createdAt) || Date.now()

    return new Date(ms).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
    })
}

function toDateTimeAttr(createdAt: string): string {
  return createdAt ?? ''
}

function resolveLocale(locale: string): string {
    return LOCALE_TO_HREFLANG[locale as keyof typeof LOCALE_TO_HREFLANG] ?? 'es-ES'
}

function RelatedPostCard({ post, dateLocale }: RelatedPostCardProps) {
    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group block bg-white dark:bg-gray-800 rounded-lg shadow-sm
        hover:shadow-md transition-shadow overflow-hidden"
        >
            {post.featuredImage && (
                <div className="relative h-32 overflow-hidden">
                    <Image
                        src={post.featuredImage}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, 33vw"
                    />
                </div>
            )}

            <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white
          group-hover:text-blue-600 dark:group-hover:text-blue-400
          transition-colors line-clamp-2 mb-2">
                    {post.title}
                </h3>

                {post.excerpt && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                        {post.excerpt}
                    </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    {post.authorName && <span>{post.authorName}</span>}
                    <time dateTime={post.createdAt ?? ''}>
                        {formatPostDate(post.createdAt, dateLocale)}
                    </time>
                </div>
            </div>
        </Link>
    )
}

export async function RelatedPosts({ postId, tags, locale = 'es' }: RelatedPostsProps) {
    if (!tags.length) return null

    const posts = await getRelatedPosts(tags, postId).catch(() => [] as Post[])
    if (!posts.length) return null

    const dateLocale = resolveLocale(locale)

    return (
        <section className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Artículos Relacionados
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {posts.slice(0, 3).map(post => (
                    <RelatedPostCard key={post.id} post={post} dateLocale={dateLocale} />
                ))}
            </div>
        </section>
    )
}