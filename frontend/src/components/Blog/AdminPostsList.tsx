"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { toast } from '@/lib/toast'
import type { Post } from '@personal-website/shared/types/post.types'

interface AdminPostsListProps {
    token: string
    searchTerm: string
    filterStatus: 'all' | 'published' | 'draft'
    onEditPost: (post: Post) => void
    onDeletePost: (postId: string) => void
}

// Rate limiter utility
class RateLimiter {
    private requests: number[] = []
    private maxRequests: number
    private timeWindow: number

    constructor(maxRequests = 10, timeWindowMs = 60000) { // 10 requests per minute
        this.maxRequests = maxRequests
        this.timeWindow = timeWindowMs
    }

    canMakeRequest(): boolean {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.timeWindow);
        if (this.requests.length >= this.maxRequests) {
            return false;
        }
        this.requests.push(now);
        return true;
    }
    getWaitTime(): number {
        if (this.requests.length === 0) return 0;
        const oldestRequest = Math.min(...this.requests);
        const timeToWait = this.timeWindow - (Date.now() - oldestRequest);
        return Math.max(0, timeToWait);
    }
    reset() {
        this.requests = [];
    }
}

export const AdminPostsList: React.FC<AdminPostsListProps> = ({
    token,
    searchTerm,
    filterStatus,
    onEditPost,
    onDeletePost
}) => {
    const [posts, setPosts] = useState<Post[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(0)
    const [totalPosts, setTotalPosts] = useState(0)

    const rateLimiter = useRef(new RateLimiter(8, 60000)) // 8 requests per minute
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const fetchPosts = useCallback(async (page = 0, retryCount = 0) => {
        if (!token) {
            setError('Autenticación requerida');
            setLoading(false);
            return;
        }

        // Check rate limit
        if (!rateLimiter.current.canMakeRequest()) {
            const waitTime = rateLimiter.current.getWaitTime();
            toast.error(`Rate limit alcanzado. Espera ${Math.ceil(waitTime / 1000)} segundos antes de volver a intentar.`);
            setError('Demasiadas solicitudes. Intenta de nuevo en unos segundos.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                limit: '20',
                offset: (page * 20).toString()
            });

            if (filterStatus !== 'all') {
                params.append('published', (filterStatus === 'published').toString());
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/posts?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 429) {
                    toast.error('Rate limit alcanzado. Intenta de nuevo en unos minutos.');
                    setError('Demasiadas solicitudes. Intenta de nuevo en unos minutos.');
                    setLoading(false);
                    rateLimiter.current.reset();
                    return;
                }
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setPosts(data.posts || []);
            setTotalPosts(data.total || 0);
            setCurrentPage(page);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            console.error('Error fetching posts:', error);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [token, filterStatus]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current)
            }
        }
    }, [])

    useEffect(() => {
        fetchPosts(0)
    }, [filterStatus, token, fetchPosts])

    // Filter posts by search term
    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const handleTogglePublish = async (post: Post) => {
        if (!rateLimiter.current.canMakeRequest()) {
            const waitTime = rateLimiter.current.getWaitTime()
            toast.error(`Rate limit alcanzado. Espera ${Math.ceil(waitTime / 1000)} segundos`)
            return
        }

        if (!token) {
            toast.error('Autenticación requerida')
            return
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/posts/${post.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    published: !post.published
                })
            })

            if (!response.ok) {
                if (response.status === 429) {
                    toast.error('Rate limit alcanzado. Intenta de nuevo en unos minutos.')
                    return
                }
                throw new Error('Failed to update post')
            }

            // Update local state
            setPosts(prev => prev.map(p =>
                p.id === post.id ? { ...p, published: !p.published } : p
            ))

            toast.success(`Post ${!post.published ? 'publicado' : 'marcado como borrador'}`)
        } catch (error) {
            console.error('Error updating post:', error)
            toast.error('Error al actualizar el post')
        }
    }

    const handleRetry = () => {
        setError(null)
        fetchPosts(currentPage)
    }

    if (loading && posts.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (error && posts.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full 
          flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Error al cargar posts
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {error}
                </p>
                <button
                    onClick={handleRetry}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg 
            hover:bg-blue-700 transition-colors"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reintentar
                </button>
            </div>
        )
    }

    if (filteredPosts.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full 
          flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No se encontraron posts
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                    {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Aún no hay posts creados'}
                </p>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Posts ({filteredPosts.length})
                    </h2>
                    <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Total: {totalPosts} posts
                        </div>
                        {loading && (
                            <div className="flex items-center text-sm text-blue-600">
                                <LoadingSpinner size="sm" />
                                <span className="ml-2">Actualizando...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Posts List */}
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPosts.map((post) => (
                    <div key={post.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0 mr-4">
                                <div className="flex items-center space-x-3 mb-2">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white line-clamp-1">
                                        {post.title}
                                    </h3>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${post.published
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                        }`}>
                                        {post.published ? 'Publicado' : 'Borrador'}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                    {post.excerpt}
                                </p>

                                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        {post.views || 0}
                                    </div>
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                        {post.likes || 0}
                                    </div>
                                    <span>
                                        {new Date(post.createdAt).toLocaleDateString('es-ES')}
                                    </span>
                                    {post.tags.length > 0 && (
                                        <div className="flex items-center space-x-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                            <span className="line-clamp-1">
                                                {post.tags.slice(0, 2).join(', ')}
                                                {post.tags.length > 2 && ` +${post.tags.length - 2}`}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleTogglePublish(post)}
                                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${post.published
                                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200'
                                            : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                                        }`}
                                >
                                    {post.published ? 'Despublicar' : 'Publicar'}
                                </button>

                                <button
                                    onClick={() => onEditPost(post)}
                                    className="px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 
                    dark:bg-blue-900 dark:text-blue-200 rounded text-sm font-medium transition-colors"
                                >
                                    Editar
                                </button>

                                <button
                                    onClick={() => onDeletePost(post.id)}
                                    className="px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 
                    dark:bg-red-900 dark:text-red-200 rounded text-sm font-medium transition-colors"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}