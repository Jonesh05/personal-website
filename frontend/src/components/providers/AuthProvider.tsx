"use client"

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const pathname       = usePathname()
  const checkSession   = useAuthStore(state => state.checkSession)
  const initializedRef = useRef(false)

  useEffect(() => {
    const requiresAuthCheck = pathname?.startsWith('/blog') ?? false
    if (!requiresAuthCheck || initializedRef.current) return

    initializedRef.current = true
    void checkSession()
  }, [pathname, checkSession])

  return <>{children}</>
}