"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import PostCard from '@/components/Blog/PostCard'
import PostCardSkeleton from '@/components/Blog/PostCardSkeleton'
import { toast } from '@/lib/toast'
import type { Post } from '@/lib/firestore/posts'
import { useTranslations } from '@/i18n'
import {
    highlightSearchTerms,
    matchesPostSearch,
    normalizePostTitle,
    scorePostSearch,
} from '@/utils/postSearch'

interface InfinitePostListProps {
    initialTag?: string
    initialSearch?: string
    initialPosts?: Post[]
    initialTotal?: number
    initialHasNext?: boolean
    allPosts?: Post[]
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
const MIN_SEARCH_CHARS = 3

const CURTAIN_RETRACT_CLIP_PATH = [
    'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
    'polygon(0% 0%, 100% 0%, 72% 70%, 0% 82%)',
    'polygon(0% 0%, 78% 0%, 44% 42%, 0% 52%)',
    'polygon(0% 0%, 38% 0%, 16% 16%, 0% 22%)',
    'polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)',
]
const CURTAIN_RETRACT_TIMES = [0, 0.25, 0.52, 0.78, 1]
const CURTAIN_RETRACT_EASE: [number, number, number, number] = [0.82, 0, 0.18, 1]

export const InfinitePostList: React.FC<InfinitePostListProps> = ({
    initialTag,
    initialSearch,
    initialPosts = [],
    initialTotal = 0,
    initialHasNext = false,
    allPosts,
}: InfinitePostListProps) => {
    const t = useTranslations('Blog')
    const shouldReduceMotion = useReducedMotion()
    const [posts, setPosts] = useState<Post[]>(initialPosts)
    const [loading, setLoading] = useState(false)
    const [hasNextPage, setHasNextPage] = useState(initialHasNext)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(0)
    const [totalPosts, setTotalPosts] = useState(initialTotal)
    const [liveQuery, setLiveQuery] = useState(initialSearch ?? '')
    const [searchFocused, setSearchFocused] = useState(false)
    const [activeSuggestionIdx, setActiveSuggestionIdx] = useState(-1)

    const abortControllerRef = useRef<AbortController | null>(null)
    const searchBoxRef = useRef<HTMLDivElement | null>(null)
    const searchInputRef = useRef<HTMLInputElement | null>(null)

    // Sync SSR hydrated props whenever filters or server-rendered posts update
    useEffect(() => {
        setPosts(initialPosts)
        setTotalPosts(initialTotal)
        setHasNextPage(initialHasNext)
        setCurrentPage(0)
        setError(null)
        setLiveQuery(initialSearch ?? '')
    }, [initialPosts, initialTotal, initialHasNext, initialTag, initialSearch])

    useEffect(() => {
        const handleOutside = (e: MouseEvent) => {
            if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
                setSearchFocused(false)
            }
        }
        document.addEventListener('mousedown', handleOutside)
        return () => document.removeEventListener('mousedown', handleOutside)
    }, [])

    const trimmedQuery = liveQuery.trim()
    const isSearchThresholdMet = trimmedQuery.replace(/\s+/g, '').length >= MIN_SEARCH_CHARS

    const searchCatalog = useMemo(() => {
        if (allPosts && allPosts.length > 0) return allPosts
        return posts
    }, [allPosts, posts])

    const visiblePosts = useMemo(() => {
        if (!isSearchThresholdMet) return posts
        return searchCatalog
            .filter((p) => matchesPostSearch(p, trimmedQuery))
            .sort((a, b) => scorePostSearch(b, trimmedQuery) - scorePostSearch(a, trimmedQuery))
    }, [posts, searchCatalog, isSearchThresholdMet, trimmedQuery])

    const isCurtainOpen = searchFocused && isSearchThresholdMet

    const suggestions = useMemo(() => {
        if (!isCurtainOpen) return []
        return visiblePosts.slice(0, 12)
    }, [visiblePosts, isCurtainOpen])

    const displayTotal = isSearchThresholdMet ? visiblePosts.length : totalPosts

    const handleSelectSuggestion = (title: string) => {
        setLiveQuery(normalizePostTitle(title))
        setSearchFocused(false)
        setActiveSuggestionIdx(-1)
        searchInputRef.current?.blur()
    }

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isCurtainOpen || suggestions.length === 0) {
            if (e.key === 'Escape') {
                setSearchFocused(false)
            }
            return
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActiveSuggestionIdx((prev) => (prev + 1) % suggestions.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveSuggestionIdx((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
        } else if (e.key === 'Enter' && activeSuggestionIdx >= 0) {
            e.preventDefault()
            const chosen = suggestions[activeSuggestionIdx]
            if (chosen) {
                handleSelectSuggestion(chosen.title)
            }
        } else if (e.key === 'Escape') {
            setSearchFocused(false)
            setActiveSuggestionIdx(-1)
        }
    }

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

    const showEmptyState = !loading && visiblePosts.length === 0 && !error

    return (
        <div className="space-y-6">
            {/* Centered Google-style Live Search Bar */}
            <div ref={searchBoxRef} className="relative mx-auto w-full">
                <div
                    className={`relative flex items-center rounded-2xl border bg-white transition-all duration-200 dark:bg-[#0B111E] ${
                        searchFocused
                            ? 'border-cyan-500/60 shadow-[0_0_0_3px_rgba(6,182,212,0.14)] dark:border-emerald-400/50 dark:shadow-[0_12px_36px_-12px_rgba(6,182,212,0.28)]'
                            : 'border-slate-200/90 shadow-sm hover:border-slate-300 dark:border-white/[0.10] dark:hover:border-white/[0.18]'
                    }`}
                >
                    <div className="pointer-events-none flex items-center pl-4 text-slate-400 dark:text-slate-500">
                        <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                    <label htmlFor="blog-google-search" className="sr-only">
                        {t('searchArticles')}
                    </label>
                    <input
                        ref={searchInputRef}
                        id="blog-google-search"
                        type="text"
                        value={liveQuery}
                        onChange={(e) => {
                            setLiveQuery(e.target.value)
                            setSearchFocused(true)
                            setActiveSuggestionIdx(-1)
                        }}
                        onFocus={() => setSearchFocused(true)}
                        onClick={() => setSearchFocused(true)}
                        onKeyDown={handleSearchKeyDown}
                        autoComplete="off"
                        role="combobox"
                        aria-expanded={isCurtainOpen}
                        aria-controls="blog-search-suggestions"
                        placeholder={t('searchPlaceholder')}
                        className="w-full bg-transparent py-3.5 pl-3 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder-slate-500"
                    />
                    {liveQuery && (
                        <button
                            type="button"
                            onClick={() => {
                                setLiveQuery('')
                                setActiveSuggestionIdx(-1)
                                if (initialSearch) {
                                    window.location.href = initialTag
                                        ? `/blog?tag=${encodeURIComponent(initialTag)}`
                                        : '/blog'
                                }
                            }}
                            aria-label="Clear search"
                            className="mr-2 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/[0.08] dark:hover:text-slate-200 cursor-pointer"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Frosted-Glass Curtain Overlay — unfurls at >= 3 chars & retracts in stepped diagonal frames (bottom-right -> top-left) */}
                <AnimatePresence>
                    {isCurtainOpen && (
                        <motion.div
                            key="search-glass-curtain"
                            id="blog-search-suggestions"
                            role="listbox"
                            aria-label="Search suggestions"
                            style={{ transformOrigin: '0% 0%' }}
                            initial={
                                shouldReduceMotion
                                    ? { opacity: 0 }
                                    : {
                                          opacity: 0,
                                          clipPath: 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)',
                                          y: -4,
                                          scale: 0.99,
                                      }
                            }
                            animate={
                                shouldReduceMotion
                                    ? { opacity: 1, transition: { duration: 0.12 } }
                                    : {
                                          opacity: 1,
                                          clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                                          y: 0,
                                          scale: 1,
                                          transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
                                      }
                            }
                            exit={
                                shouldReduceMotion
                                    ? { opacity: 0, transition: { duration: 0.12 } }
                                    : {
                                          clipPath: CURTAIN_RETRACT_CLIP_PATH,
                                          scale: [1, 0.96, 0.89, 0.8, 0.72],
                                          opacity: [1, 0.98, 0.92, 0.78, 0],
                                          transition: {
                                              duration: 0.44,
                                              times: CURTAIN_RETRACT_TIMES,
                                              ease: CURTAIN_RETRACT_EASE,
                                          },
                                      }
                            }
                            className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-white/25 bg-white/70 ring-1 ring-slate-900/[0.06] shadow-[0_20px_50px_-16px_rgba(15,23,42,0.18)] backdrop-blur-2xl dark:border-white/[0.14] dark:bg-[#0B111E]/72 dark:ring-white/[0.06] dark:shadow-[0_28px_64px_-16px_rgba(0,0,0,0.85)]"
                        >
                            {/* Diagonal frosted-glass flash sheen during stepped retraction */}
                            {!shouldReduceMotion && (
                                <motion.div
                                    aria-hidden="true"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 0 }}
                                    exit={{
                                        opacity: [0, 0.85, 0.65, 0.42, 0],
                                        transition: {
                                            duration: 0.44,
                                            times: CURTAIN_RETRACT_TIMES,
                                            ease: 'linear',
                                        },
                                    }}
                                    className="pointer-events-none absolute inset-0 z-10 rounded-2xl"
                                    style={{
                                        background:
                                            'linear-gradient(135deg, rgba(255,255,255,0.42) 0%, rgba(6,182,212,0.22) 38%, rgba(16,185,129,0.16) 62%, transparent 100%)',
                                        boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.45)',
                                    }}
                                />
                            )}
                            {/* Subtle top glass sheen */}
                            <div
                                aria-hidden="true"
                                className="h-[1.5px] w-full"
                                style={{
                                    background:
                                        'linear-gradient(90deg, rgba(6,182,212,0.85) 0%, rgba(16,185,129,0.7) 50%, transparent 100%)',
                                }}
                            />
                            {suggestions.length > 0 ? (
                                <ul className="max-h-72 divide-y divide-slate-200/50 overflow-y-auto dark:divide-white/[0.06]">
                                    {suggestions.map((item, idx) => {
                                        const isActive = idx === activeSuggestionIdx
                                        const cleanTitle = normalizePostTitle(item.title)
                                        const segments = highlightSearchTerms(cleanTitle, trimmedQuery)
                                        return (
                                            <motion.li
                                                key={item.id}
                                                role="option"
                                                aria-selected={isActive}
                                                initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={
                                                    shouldReduceMotion
                                                        ? { duration: 0 }
                                                        : {
                                                              duration: 0.16,
                                                              delay: Math.min(idx * 0.028, 0.16),
                                                              ease: 'easeOut',
                                                          }
                                                }
                                                className={`flex items-center justify-between gap-3 px-4 py-3 transition-colors ${
                                                    isActive
                                                        ? 'bg-cyan-500/10 dark:bg-white/[0.08]'
                                                        : 'hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.05]'
                                                }`}
                                            >
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault()
                                                        handleSelectSuggestion(item.title)
                                                    }}
                                                    className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer"
                                                >
                                                    <svg
                                                        className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                        aria-hidden="true"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                                        />
                                                    </svg>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm text-slate-700 dark:text-slate-200">
                                                            {segments.map((seg, sIdx) =>
                                                                seg.matched ? (
                                                                    <span
                                                                        key={sIdx}
                                                                        className="font-semibold text-cyan-700 dark:text-emerald-300"
                                                                    >
                                                                        {seg.text}
                                                                    </span>
                                                                ) : (
                                                                    <span key={sIdx}>{seg.text}</span>
                                                                ),
                                                            )}
                                                        </p>
                                                    </div>
                                                </button>
                                                <Link
                                                    href={`/blog/${item.slug}`}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    className="shrink-0 rounded-lg border border-slate-200/70 bg-white/50 px-2.5 py-1 font-mono text-[10px] text-slate-500 transition-colors hover:border-cyan-400/60 hover:text-cyan-700 dark:border-white/[0.09] dark:bg-white/[0.03] dark:text-slate-400 dark:hover:border-emerald-400/45 dark:hover:text-emerald-300"
                                                    title="Open article"
                                                >
                                                    →
                                                </Link>
                                            </motion.li>
                                        )
                                    })}
                                </ul>
                            ) : (
                                <p className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                                    {t('noArticlesFound')}
                                </p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {showEmptyState ? (
                <div className="text-center py-14">
                    <div className="w-20 h-20 mx-auto mb-5 bg-slate-100 dark:bg-white/[0.04] rounded-full 
                        flex items-center justify-center border border-slate-200/80 dark:border-white/[0.08]">
                        <svg className="w-9 h-9 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        {t('noArticlesFound')}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
                        {initialTag || trimmedQuery
                            ? t('noArticlesWithFilter')
                            : t('noArticlesYet')
                        }
                    </p>
                    {(initialTag || trimmedQuery) && (
                        <button
                            type="button"
                            onClick={() => {
                                setLiveQuery('')
                                if (initialTag || initialSearch) {
                                    window.location.href = '/blog'
                                }
                            }}
                            className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm 
                                font-semibold rounded-xl shadow-sm text-white transition-all hover:brightness-110 cursor-pointer"
                            style={{
                                background: 'linear-gradient(135deg, #0284C7 0%, #06B6D4 52%, #10B981 100%)',
                            }}
                        >
                            {t('viewAllArticles')}
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* Results Header */}
                    {displayTotal > 0 && (
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {displayTotal === 1
                                    ? t('oneArticleFound')
                                    : t('manyArticlesFound').replace('{count}', displayTotal.toLocaleString())
                                }
                            </p>
                            {(initialTag || isSearchThresholdMet) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setLiveQuery('')
                                        if (initialTag || initialSearch) {
                                            window.location.href = '/blog'
                                        }
                                    }}
                                    className="text-xs font-mono text-slate-500 hover:text-cyan-700 dark:text-slate-400 
                        dark:hover:text-emerald-300 flex items-center cursor-pointer transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    {t('clearFilters')}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Posts Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
                        {visiblePosts.map((post: Post) => (
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
                                    font-medium rounded-xl shadow-sm text-white bg-slate-900 hover:bg-slate-800 dark:bg-white/10 dark:hover:bg-white/15 cursor-pointer"
                            >
                                {t('retry')}
                            </button>
                        </div>
                    )}

                    {/* Progressive Load More Button */}
                    {hasNextPage && !error && !isSearchThresholdMet && (
                        <div className="flex justify-center pt-4 pb-8">
                            <button
                                type="button"
                                onClick={handleLoadMore}
                                disabled={loading}
                                className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
                                style={{
                                    fontFamily: 'var(--font-mono)',
                                    background: 'linear-gradient(135deg, #0284C7 0%, #06B6D4 52%, #10B981 100%)',
                                    boxShadow: '0 0 24px rgba(6, 182, 212, 0.3)',
                                }}
                            >
                                {loading ? t('loadMoreArticles') : 'Load More Articles →'}
                            </button>
                        </div>
                    )}

                    {/* End of Posts Message */}
                    {!hasNextPage && !loading && !isSearchThresholdMet && visiblePosts.length > 0 && (
                        <div className="text-center py-8 border-t border-slate-200/80 dark:border-white/[0.08]">
                            <p className="text-slate-600 dark:text-slate-400">
                                {t('reachedEndTitle')}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                                {t('reachedEndSubtitle')}
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
