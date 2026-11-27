// frontend/src/lib/firebase/client.ts
// Client-side Firebase SDK | AUTH ONLY
// No Firestore client imports allowed, all Firestore access via Admin SDK on server
//
// PERF: firebase/app and firebase/auth are loaded via dynamic import() so the
// ~110-150KB gzipped SDK stays out of the initial-render bundle. It is only
// fetched when an admin actually triggers sign-in/sign-out.
'use client'

import type { Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let authPromise: Promise<Auth> | null = null

/**
 * Lazily loads the Firebase SDK and initializes Auth exactly once.
 * Safe to call concurrently — all callers share the same promise.
 */
export function getFirebaseAuth(): Promise<Auth> {
  if (!authPromise) {
    authPromise = (async () => {
      if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
        authPromise = null
        throw new Error(
          'Missing Firebase client configuration (NEXT_PUBLIC_FIREBASE_API_KEY / AUTH_DOMAIN / PROJECT_ID).',
        )
      }

      const [{ initializeApp, getApps, getApp }, { getAuth, connectAuthEmulator }] =
        await Promise.all([import('firebase/app'), import('firebase/auth')])

      const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
      const auth = getAuth(app)

      // Connect to Auth emulator in development
      if (
        typeof window !== 'undefined' &&
        process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'
      ) {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
        console.log('🔐 Firebase Auth connected to emulator')
      }

      return auth
    })().catch((err) => {
      authPromise = null
      throw err
    })
  }
  return authPromise
}

// NO Firestore exports, all Firestore access is via Admin SDK on server
