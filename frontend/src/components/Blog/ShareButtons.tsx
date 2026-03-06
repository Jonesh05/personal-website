"use client"

import { useState } from 'react'
import { toast } from '@/lib/toast'

interface ShareButtonsProps {
    url: string
    title: string
    description: string
    size?: 'sm' | 'md' | 'lg'
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({
    url,
    title,
    description,
    size = 'md'
}) => {
    const [copied, setCopied] = useState(false)

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            toast.success('Enlace copiado al portapapeles')
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            toast.error('Error al copiar el enlace')
        }
    }

    const handleShare = (platform: 'twitter' | 'linkedin' | 'facebook') => {
        const encodedUrl = encodeURIComponent(url)
        const encodedTitle = encodeURIComponent(title)
        const encodedDescription = encodeURIComponent(description)

        const urls = {
            twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        }

        window.open(urls[platform], '_blank', 'width=600,height=400')
    }

    const buttonSize = size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-3' : 'p-2'
    const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'

    return (
        <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Compartir:</span>

            <button
                onClick={() => handleShare('twitter')}
                className={`${buttonSize} rounded-full bg-blue-500 text-white hover:bg-blue-600 
                    transition-colors`}
                title="Compartir en Twitter"
            >
                <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
            </button>

            <button
                onClick={() => handleShare('linkedin')}
                className={`${buttonSize} rounded-full bg-blue-700 text-white hover:bg-blue-800 
                    transition-colors`}
                title="Compartir en LinkedIn"
            >
                <svg className={iconSize} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
            </button>

            <button
                onClick={handleCopyLink}
                className={`${buttonSize} rounded-full bg-gray-600 text-white hover:bg-gray-700 
                    transition-colors ${copied ? 'bg-green-600 hover:bg-green-700' : ''}`}
                title="Copiar enlace"
            >
                {copied ? (
                    <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                )}
            </button>
        </div>
    )
}