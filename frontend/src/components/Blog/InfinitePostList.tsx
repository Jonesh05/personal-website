"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import PostCard from '@/components/Blog/PostCard'
import PostCardSkeleton from '@/components/Blog/PostCardSkeleton'
import { toast } from '@/lib/toast'
import type { Post } from '@/lib/firestore/posts'
import { useTranslations } from '@/i18n'

interface InfinitePostListProps {
    initialTag?: string
    initialSearch?: string
    initialPosts?: Post[]
    initialTotal?: number
    initialHasNext?: boolean
}

interface PostsResponse {
    posts: Post[]
    total: number
    pagination: {
        limit: number
        offset: number
        hasNext: boolean
    }
}

const PAGE_SIZE = 12

export const InfinitePostList: React.FC<InfinitePostListProps> = ({
    initialTag,
    initialSearch,
    initialPosts = [],
    initialTotal = 0,
    initialHasNext = false,
}: InfinitePostListProps) => {
    const t = useTranslations('Blog')
    const [posts, setPosts] = useState<Post[]>(initialPosts)
    const [loading, setLoading] = useState(false)
    const [hasNextPage, setHasNextPage] = useState(initialHasNext)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(0)
    const [totalPosts, setTotalPosts] = useState(initialTotal)

    const abortControllerRef = useRef<AbortController | null>(null)

    // Sync SSR hydrated props whenever filters or server-rendered posts update
    useEffect(() => {
        setPosts(initialPosts)
        setTotalPosts(initialTotal)
        setHasNextPage(initialHasNext)
        setCurrentPage(0)
        setError(null)
    }, [initialPosts, initialTotal, initialHasNext, initialTag, initialSearch])

    const fetchPosts = useCallback(async (
        page: number = 0,
        tag?: string,
        search?: string,
        replace: boolean = false
    ) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        abortControllerRef.current = new AbortController()
        const signal = abortControllerRef.current.signal

        setLoading(true)
        setError(null)

        try {
            const params = new URLSearchParams({
                limit: PAGE_SIZE.toString(),
                offset: (page * PAGE_SIZE).toString()
            })

            if (tag) params.append('tag', tag)
            if (search) params.append('search', search)

            const response = await fetch(
                `/api/posts?${params.toString()}`,
                {
                    signal,
                    cache: 'no-store',
                }
            )

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`)
            }

            const data: PostsResponse = await response.json()

            if (signal.aborted) return

            if (replace || page === 0) {
                setPosts(data.posts)
                setCurrentPage(0)
            } else {
                setPosts((prev: Post[]) => {
                    const existingIds = new Set(prev.map(p => p.id))
                    const newPosts = data.posts.filter(p => !existingIds.has(p.id))
                    return [...prev, ...newPosts]
                })
                setCurrentPage(page)
            }

            setTotalPosts(data.total)
            setHasNextPage(data.pagination.hasNext)
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                return
            }

            console.error('Error fetching posts:', err)
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
            setError(errorMessage)
            toast.error(t('loadingArticlesError'))
        } finally {
            if (!signal.aborted) {
                setLoading(false)
            }
        }
    }, [t])

    // If no initial SSR posts were provided (fallback), fetch page 0 on mount
    useEffect(() => {
        if (initialPosts.length === 0 && initialTotal === 0) {
            void fetchPosts(0, initialTag, initialSearch, true)
        }
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [initialPosts.length, initialTotal, initialTag, initialSearch, fetchPosts])

    const handleLoadMore = () => {
        if (!loading && hasNextPage) {
            void fetchPosts(currentPage + 1, initialTag, initialSearch, false)
        }
    }

    const handleRetry = () => {
        void fetchPosts(currentPage, initialTag, initialSearch)
    }

    if (!loading && posts.length === 0 && !error) {
        return (
            <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full 
                    flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {t('noArticlesFound')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    {initialTag || initialSearch
                        ? t('noArticlesWithFilter')
                        : t('noArticlesYet')
                    }
                </p>
                {(initialTag || initialSearch) && (
                    <a
                        href="/blog"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm 
                            font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        {t('viewAllArticles')}
                    </a>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Results Header */}
            {totalPosts > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {totalPosts === 1
                            ? t('oneArticleFound')
                            : t('manyArticlesFound').replace('{count}', totalPosts.toLocaleString())
                        }
                    </p>
                    {(initialTag || initialSearch) && (
                        <button
                            onClick={() => window.location.href = '/blog'}
                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 
                dark:hover:text-blue-300 flex items-center"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {t('clearFilters')}
                        </button>
                    )}
                </div>
            )}

            {/* Posts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
                {posts.map((post: Post) => (
                    <PostCard
                        key={post.id}
                        post={post}
                    />
                ))}

                {/* Loading Skeletons */}
                {loading && (
                    <>
                        {[...Array(4)].map((_, i) => (
                            <PostCardSkeleton key={`skeleton-${i}`} />
                        ))}
                    </>
                )}
            </div>

            {/* Error State */}
            {error && (
                <div className="text-center py-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {t('loadingArticlesError')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {error}
                    </p>
                    <button
                        onClick={handleRetry}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm 
                            font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                    >
                        {t('retry')}
                    </button>
                </div>
            )}

            {/* Progressive Load More Button */}
            {hasNextPage && !error && (
                <div className="flex justify-center pt-4 pb-8">
                    <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
                        style={{
                            fontFamily: 'var(--font-mono)',
                            background: 'var(--gradient-plasma)',
                            boxShadow: '0 0 24px rgba(124, 58, 237, 0.3)',
                        }}
                    >
                        {loading ? t('loadMoreArticles') : 'Load More Articles →'}
                    </button>
                </div>
            )}

            {/* End of Posts Message */}
            {!hasNextPage && !loading && posts.length > 0 && (
                <div className="text-center py-8 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400">
                        {t('reachedEndTitle')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        {t('reachedEndSubtitle')}
                    </p>
                </div>
            )}
        </div>
    )
}
