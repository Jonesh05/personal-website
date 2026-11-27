'use client'

import { create } from 'zustand'
// PERF: type-only import — erased at compile time, does NOT pull the Firebase
// SDK into the initial bundle. Runtime Firebase code is loaded via dynamic
// import() inside signInWithGoogle/signOut only.
import type { User } from 'firebase/auth'

// Loads the Firebase Auth SDK + initialized Auth instance on demand.
async function loadFirebaseAuth() {
  const [{ getFirebaseAuth }, firebaseAuth] = await Promise.all([
    import('@/lib/firebase/client'),
    import('firebase/auth'),
  ])
  const auth = await getFirebaseAuth()
  return { auth, firebaseAuth }
}

// 1. Definimos el estado (Variables)
interface AuthState {
  isAdmin: boolean
  initialized: boolean
  loading: boolean
  error: string | null
  displayName: string | null
  user: User | null      // <-- Agregado para resolver el error del Modal
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
      const { auth, firebaseAuth } = await loadFirebaseAuth()
      const { GoogleAuthProvider, signInWithPopup } = firebaseAuth

      // Admin identity is enforced server-side in /api/auth/login against the
      // ADMIN_EMAILS env allow-list. No account hint is set here leaking a
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
        error: null,
      })
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : 'Login failed'
      // Ignore user-cancelled popup closures gently
      const friendlyError = rawMessage.includes('auth/popup-closed-by-user')
        ? 'Sign-in popup was closed before completing.'
        : rawMessage.includes('auth/popup-blocked')
        ? 'Sign-in popup was blocked by the browser. Please allow popups for this site.'
        : rawMessage

      // Best-effort Firebase sign-out so a half-completed popup flow doesn't
      // leave a lingering client-side session.
      try {
        const { auth, firebaseAuth } = await loadFirebaseAuth()
        await firebaseAuth.signOut(auth)
      } catch {
        // ignore — SDK may not even have loaded
      }
      set({
        error: friendlyError,
        loading: false,
        isAdmin: false,
        initialized: true,
        user: null,
      })
      throw err
    }
  },

  signOut: async () => {
    set({ loading: true })
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      const { auth, firebaseAuth } = await loadFirebaseAuth()
      await firebaseAuth.signOut(auth)
      set({ 
        isAdmin: false, 
        initialized: true, 
        loading: false, 
        displayName: null, 
        user: null, 
        error: null 
      })
    } catch {
      set({ error: 'Sign out failed', loading: false })
    }
  },

  clearError: () => set({ error: null }),
}))
