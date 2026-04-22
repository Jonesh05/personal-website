"use client"

import { toast } from '@/lib/toast'
import { useTranslations } from '@/i18n'
import { useLikePost } from '@/hooks/useLikePost'

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
    const t = useTranslations('Blog')
    const { liked, likes, pending, toggle } = useLikePost({ postId, initialLikes })

    const handleClick = async () => {
        const wasLiked = liked
        await toggle()
        toast.success(wasLiked ? t('likeRemoved') : t('likeSuccess'))
    }

    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-2 text-base',
    }

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={pending}
            aria-pressed={liked}
            className={`inline-flex items-center gap-2 rounded-lg border transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${liked
          ? 'text-red-600 border-red-300 bg-red-50 dark:bg-red-900/20 dark:text-red-400'
          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}
        ${sizeClasses[size]}`}
        >
            <svg
                className={`${iconSizes[size]} ${pending ? 'animate-pulse' : ''}`}
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
