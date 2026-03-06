"use client"

import { useState } from 'react'
import { toast } from '@/lib/toast'

interface LikeButtonProps {
    postId: string
    initialLikes: number
    size?: 'sm' | 'md' | 'lg'
}

export const LikeButton: React.FC<LikeButtonProps> = ({
    postId,
    initialLikes,
    size = 'md'
}) => {
    const [likes, setLikes] = useState(initialLikes)
    const [liked, setLiked] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleLike = async () => {
        if (loading) return

        setLoading(true)

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: 'anonymous' }) // For anonymous likes
            })

            if (!response.ok) {
                throw new Error('Failed to toggle like')
            }

            const data = await response.json()
            setLikes(data.likes)
            setLiked(data.liked)

            toast.success(data.liked ? '¡Gracias por tu like!' : 'Like removido')
        } catch (error) {
            console.error('Error toggling like:', error)
            toast.error('Error al procesar tu like')
        } finally {
            setLoading(false)
        }
    }

    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-2 text-base'
    }

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    }

    return (
        <button
            onClick={handleLike}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-lg border border-gray-300 
        dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 
        hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 
        disabled:opacity-50 disabled:cursor-not-allowed
        ${liked ? 'text-red-600 border-red-300 bg-red-50 dark:bg-red-900/20' : ''}
        ${sizeClasses[size]}`}
        >
            <svg
                className={`${iconSizes[size]} ${loading ? 'animate-pulse' : ''}`}
                fill={liked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
            >
                <path strokeLinecap="round" strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            {likes}
        </button>
    )
}