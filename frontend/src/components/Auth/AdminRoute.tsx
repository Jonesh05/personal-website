"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface AdminRouteProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

export const AdminRoute: React.FC<AdminRouteProps> = ({
    children,
    fallback
}) => {
    const router = useRouter()
    const { isAdmin, loading, initialized, checkSession } = useAuthStore()

    useEffect(() => {
        // Verify session cookie on mount — sets initialized + isAdmin
        checkSession()
    }, [checkSession])

    // Show loading while checking authentication
    if (!initialized || loading) {
        return fallback || (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                        Verificando permisos...
                    </p>
                </div>
            </div>
        )
    }

    // Show unauthorized if not admin
    if (!isAdmin ) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Acceso No Autorizado
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        No tienes permisos para acceder a esta página.
                    </p>
                    <button
                        onClick={() => router.push('/blog/admin/login')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Ir al Login
                    </button>
                </div>
            </div>
        )
    }

    return <>{children}</>
}