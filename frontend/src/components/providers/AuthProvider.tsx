"use client"

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const checkSession   = useAuthStore(state => state.checkSession)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      checkSession()          // returns Promise<void> — no cleanup needed
    }
    return () => {
      initializedRef.current = false
    }
  }, [checkSession])

  return <>{children}</>
}