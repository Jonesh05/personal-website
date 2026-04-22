"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { useInView } from '@/hooks/useInView'
import PostCard from '@/components/Blog/PostCard'
import PostCardSkeleton from '@/components/Blog/PostCardSkeleton'
import { toast } from '@/lib/toast'
import type { Post } from '@/lib/firestore/posts'
import { useTranslations } from '@/i18n'

interface InfinitePostListProps {
    initialTag?: string
    initialSearch?: string
    initialPosts?: Post[]
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

export const InfinitePostList: React.FC<InfinitePostListProps> = ({
    initialTag,
    initialSearch,
    initialPosts = []
}: InfinitePostListProps) => {
    const t = useTranslations('Blog')
    const [posts, setPosts] = useState<Post[]>(initialPosts)
    const [loading, setLoading] = useState(false)
    const [hasNextPage, setHasNextPage] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(0)
    const [totalPosts, setTotalPosts] = useState(0)

    const { ref: loadMoreRef, inView } = useInView({
        threshold: 0.1,
        rootMargin: '100px'
    })

    const abortControllerRef = useRef<AbortController | null>(null)
    const lastRequestRef = useRef<string>('')

    // Crear identificador único para la request
    const createRequestId = useCallback((page: number, tag?: string, search?: string) => {
        return `${page}-${tag || ''}-${search || ''}`
    }, [])

    // Función para obtener posts
    const fetchPosts = useCallback(async (
        page: number = 0,
        tag?: string,
        search?: string,
        replace: boolean = false
    ) => {
        const requestId = createRequestId(page, tag, search)

        // Evitar requests duplicadas
        if (lastRequestRef.current === requestId && !replace) {
            return
        }

        // Cancelar request anterior si existe
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        // Crear nuevo AbortController
        abortControllerRef.current = new AbortController()
        const signal = abortControllerRef.current.signal

        setLoading(true)
        setError(null)
        lastRequestRef.current = requestId

        try {
            const params = new URLSearchParams({
                limit: '12',
                offset: (page * 12).toString()
            })

            if (tag) params.append('tag', tag)
            if (search) params.append('search', search)

            const response = await fetch(
                `/api/posts?${params.toString()}`,
                {
                    signal,
                    next: { revalidate: 300 } // Cache por 5 minutos
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
                    // Evitar duplicados
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
                return // Request cancelada, no hacer nada
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
    }, [createRequestId, t])

    // Cargar más posts cuando el elemento esté visible
    useEffect(() => {
        if (inView && hasNextPage && !loading) {
            fetchPosts(currentPage + 1, initialTag, initialSearch)
        }
    }, [inView, hasNextPage, loading, currentPage, initialTag, initialSearch, fetchPosts])

    // Recargar cuando cambien los filtros
    useEffect(() => {
        fetchPosts(0, initialTag, initialSearch, true)
    }, [initialTag, initialSearch, fetchPosts])

    // Cleanup al desmontar
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    // Función para retry en caso de error
    const handleRetry = () => {
        fetchPosts(currentPage, initialTag, initialSearch)
    }

    // Empty state
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
                {posts.map((post: Post, index: number) => (
                    <PostCard
                        key={`${post.id}-${index}`}
                        post={post}
                    />
                ))}

                {/* Loading Skeletons */}
                {loading && (
                    <>
                        {[...Array(6)].map((_, i) => (
                            <PostCardSkeleton key={`skeleton-${i}`} />
                        ))}
                    </>
                )}
            </div>

            {/* Error State */}
            {error && (
                <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full 
            flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {t('loadingArticlesError')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {error}
                    </p>
                    <button
                        onClick={handleRetry}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm 
                            font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 
                            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {t('retry')}
                    </button>
                </div>
            )}

            {/* Load More Trigger */}
            {hasNextPage && !error && (
                <div
                    ref={loadMoreRef}
                    className="flex justify-center py-8"
                >
                    {loading ? (
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('loadMoreArticles')}
                        </div>
                    ) : (
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                    )}
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