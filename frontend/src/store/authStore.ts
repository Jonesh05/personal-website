'use client'

import { create } from 'zustand'
import { auth } from '@/lib/firebase/client'
import { User, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth'

// 1. Definimos el estado (Variables)
interface AuthState {
  isAdmin: boolean
  initialized: boolean
  loading: boolean
  error: string | null
  displayName: string | null
  user: User | null      // <-- Agregado para resolver el error del Modal
  token: string | null    // <-- Agregado para resolver el error del Modal
}

// 2. Definimos las acciones (Funciones)
// ¡Asegúrate de que este nombre sea EXACTAMENTE 'AuthActions'!
interface AuthActions {
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  checkSession: () => Promise<void>
  clearError: () => void
}

// 3. Creamos el Store uniendo ambas interfaces
export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
  isAdmin: false,
  initialized: false,
  loading: false,
  error: null,
  displayName: null,
  user: null,
  token: null,

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
      // Admin identity is enforced server-side in /api/auth/login against the
      // ADMIN_EMAILS env allow-list. No account hint is set here — leaking a
      // specific email into the client bundle is avoided on purpose.
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      // Force account picker every time so the user always confirms which
      // Google account they're using for admin sign-in.
      provider.setCustomParameters({ prompt: 'select_account' })

      const result = await signInWithPopup(auth, provider)
      const idToken = await result.user.getIdToken()

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Login failed')
      }

      set({
        isAdmin: true,
        initialized: true,
        loading: false,
        displayName: result.user.displayName,
        user: result.user, // <-- Guardamos el usuario
        token: idToken,    // <-- Guardamos el token
        error: null,
      })
    } catch (err) {
      await firebaseSignOut(auth).catch(() => {})
      set({
        error: err instanceof Error ? err.message : 'Login failed',
        loading: false,
        isAdmin: false,
        initialized: true,
        user: null,
        token: null,
      })
      throw err
    }
  },

  signOut: async () => {
    set({ loading: true })
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      await firebaseSignOut(auth)
      set({ 
        isAdmin: false, 
        initialized: true, 
        loading: false, 
        displayName: null, 
        user: null, 
        token: null, 
        error: null 
      })
    } catch {
      set({ error: 'Sign out failed', loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))