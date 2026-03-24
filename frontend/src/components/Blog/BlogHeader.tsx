"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdminAuthModal } from '@/components/Auth/AdminAuthModal'

const BlogHeaderInner: React.FC = () => {
    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        // Automatically open the login modal if redirected from an admin route
        if (searchParams) {
            const loginRequired = searchParams.get('login') === 'required'
            const unauthorized = searchParams.get('error') === 'unauthorized'
            if (loginRequired || unauthorized) {
                setIsAdminModalOpen(true)
            }
        }
    }, [searchParams])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl + Shift + L para abrir el modal de admin
            if (e.ctrlKey && e.shiftKey && e.key === 'L') {
                e.preventDefault()
                setIsAdminModalOpen(true)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
        <>
            <div className="bg-linear-to-br from-blue-600 via-purple-700 to-pink-600 py-16">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 text-center py-24">
                    <h1 
                        className="text-4xl md:text-6xl font-bold text-white mb-6 cursor-default"
                        onDoubleClick={() => setIsAdminModalOpen(true)}
                        title="Doble clic para acceso admin"
                    >
                        Blog
                    </h1>
                    <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                        Insights técnicos sobre Web3, desarrollo blockchain, arquitectura en la nube
                        y las últimas tendencias en tecnología.
                    </p>
                </div>
            </div>

            <AdminAuthModal 
                isOpen={isAdminModalOpen}
                onCloseAction={() => setIsAdminModalOpen(false)}
                onAuthSuccessAction={() => {
                    setIsAdminModalOpen(false)
                    router.push('/blog/admin')
                    router.refresh()
                }}
            />
        </>
    )
}

export const BlogHeader: React.FC = () => {
    return (
        <Suspense fallback={
            <div className="bg-linear-to-br from-blue-600 via-purple-700 to-pink-600 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 cursor-default">
                        Blog
                    </h1>
                    <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                        Insights técnicos sobre Web3, desarrollo blockchain, arquitectura en la nube
                        y las últimas tendencias en tecnología.
                    </p>
                </div>
            </div>
        }>
            <BlogHeaderInner />
        </Suspense>
    )
}
