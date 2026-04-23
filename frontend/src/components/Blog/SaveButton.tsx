'use client'

import { toast } from '@/lib/toast'
import { useTranslations } from '@/i18n'
import { useSavePost } from '@/hooks/useSavePost'

interface SaveButtonProps {
  postId: string
  slug: string
  title: string
  size?: 'sm' | 'md' | 'lg'
}

export const SaveButton: React.FC<SaveButtonProps> = ({ postId, slug, title, size = 'md' }) => {
  const t = useTranslations('Blog')
  const { saved, pending, toggle } = useSavePost({ postId, slug, title })

  const handleClick = async () => {
    const wasSaved = saved
    await toggle()
    toast.success(wasSaved ? t('saveRemoved') : t('saveSuccess'))
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base',
  }
  const iconSizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? t('saveRemove') : t('save')}
      className={`inline-flex items-center gap-2 rounded-lg border transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${saved
          ? 'text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-300'
          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}
        ${sizeClasses[size]}`}
    >
      <svg
        className={`${iconSizes[size]} ${pending ? 'animate-pulse' : ''}`}
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
      </svg>
      <span>{saved ? t('saved') : t('save')}</span>
    </button>
  )
}
