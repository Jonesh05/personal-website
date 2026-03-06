'use client'

import { create }          from 'zustand'
import { auth }            from '@/lib/firebase/client'
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from 'firebase/auth'

interface AuthState {
  isAdmin:     boolean
  initialized: boolean   // restored so AdminRoute works
  loading:     boolean
  error:       string | null
  displayName: string | null
}

interface AuthActions {
  signInWithGoogle: () => Promise<void>
  signOut:          () => Promise<void>
  checkSession:     () => Promise<void>
  clearError:       () => void
}

export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
  isAdmin:     false,
  initialized: false,
  loading:     false,
  error:       null,
  displayName: null,

  // Called on mount by AdminRoute — verifies httpOnly cookie server-side
  checkSession: async () => {
    try {
      const res = await fetch('/api/auth/verify', { method: 'GET' })
      if (res.ok) {
        const data = await res.json()
        set({ isAdmin: data.isAdmin, displayName: data.displayName, initialized: true })
      } else {
        set({ isAdmin: false, initialized: true })
      }
    } catch {
      set({ isAdmin: false, initialized: true })
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null })
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      provider.setCustomParameters({ login_hint: 'newrevolutiion@gmail.com' })

      const result  = await signInWithPopup(auth, provider)
      const idToken = await result.user.getIdToken()

      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ idToken }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Login failed')
      }

      set({
        isAdmin:     true,
        initialized: true,
        loading:     false,
        displayName: result.user.displayName,
        error:       null,
      })
    } catch (err) {
      await firebaseSignOut(auth).catch(() => {})
      set({
        error:       err instanceof Error ? err.message : 'Login failed',
        loading:     false,
        isAdmin:     false,
        initialized: true,
      })
      throw err
    }
  },

  signOut: async () => {
    set({ loading: true })
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      await firebaseSignOut(auth)
      set({ isAdmin: false, initialized: true, loading: false, displayName: null, error: null })
    } catch {
      set({ error: 'Sign out failed', loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))