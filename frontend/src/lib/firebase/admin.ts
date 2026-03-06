// frontend/src/lib/firebase/admin.ts
// Server-only Firebase Admin SDK initialization
// NEVER import this file in client components

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth, type Auth } from 'firebase-admin/auth'
import path from 'path'

const isEmulator = process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.USE_FIREBASE_EMULATOR === 'true'

let adminApp: App
let adminDb: Firestore
let adminAuth: Auth

const existingApps = getApps()

if (existingApps.length > 0) {
  adminApp = existingApps[0]
} else {
  const projectId = process.env.FIREBASE_PROJECT_ID

  if (isEmulator) {
    console.log('🔥 Firebase Admin SDK running in EMULATOR mode')
    adminApp = initializeApp({ projectId })
  } else {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.resolve(process.cwd(), '../functions/secret/service-account.json')
    
    adminApp = initializeApp({
      credential: cert(serviceAccountPath),
    })
  }
}

adminDb = getFirestore(adminApp)
adminAuth = getAuth(adminApp)

// Connect to emulators if configured
if (isEmulator) {
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8081'
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099'
  
  try {
    adminDb.settings({ host: firestoreHost, ssl: false })
    console.log(`📦 Firestore emulator connected: ${firestoreHost}`)
    console.log(`🔐 Auth emulator connected: ${authHost}`)
  } catch (error: any) {
    // Next.js HMR will often throw "Firestore has already been initialized" 
    // when re-evaluating this file. We can safely ignore it.
    if (!error.message.includes('already been initialized')) {
      console.error('Firestore settings error:', error)
    }
  }
}

export { adminApp, adminDb, adminAuth }
