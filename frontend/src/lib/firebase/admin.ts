// frontend/src/lib/firebase/admin.ts
// Server-only Firebase Admin SDK initialization.
//
// Initialization contract (production-safe):
//
//   1. Credentials are sourced ONLY from environment variables:
//        - FIREBASE_PROJECT_ID
//        - FIREBASE_CLIENT_EMAIL
//        - FIREBASE_PRIVATE_KEY   (escaped `\n` sequences are normalized)
//      File-based credentials (GOOGLE_APPLICATION_CREDENTIALS,
//      ADC, service-account.json) are intentionally NOT supported.
//
//   2. Environment separation is strict and non-overlapping:
//        - production: env credentials only. No emulator, ever.
//        - development: env credentials by default; the emulator is enabled
//          ONLY when USE_FIREBASE_EMULATOR=true is explicitly set.
//
//   3. Missing credentials fail loudly. We throw at module-load so misconfigs
//      surface in the very first request instead of degrading silently.
//
// DO NOT import this module from client components.

import 'server-only'
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth, type Auth } from 'firebase-admin/auth'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const EMULATOR_FLAG = process.env.USE_FIREBASE_EMULATOR === 'true'

// Production MUST NOT run against an emulator. We refuse the combination
// rather than silently demoting to production credentials.
if (IS_PRODUCTION && EMULATOR_FLAG) {
  throw new Error(
    '[firebase/admin] USE_FIREBASE_EMULATOR=true is forbidden in production. ' +
      'Remove the flag from production environment variables.',
  )
}

const USE_EMULATOR = !IS_PRODUCTION && EMULATOR_FLAG

function normalizePrivateKey(raw: string): string {
  // Vercel, GitHub Actions, and most CI systems escape real newlines as `\n`
  // when round-tripping env vars through shell expansion. Convert back.
  return raw.replace(/\\n/g, '\n')
}

function buildEnvCredentials(): Parameters<typeof initializeApp>[0] {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  const missing: string[] = []
  if (!projectId) missing.push('FIREBASE_PROJECT_ID')
  if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL')
  if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY')

  if (missing.length > 0) {
    throw new Error(
      `[firebase/admin] Missing required env var(s): ${missing.join(', ')}. ` +
        'Firebase Admin cannot initialize without server-side credentials. ' +
        'File-based credentials are not supported in this project.',
    )
  }

  return {
    projectId,
    credential: cert({
      projectId: projectId!,
      clientEmail: clientEmail!,
      privateKey: normalizePrivateKey(privateKey!),
    }),
  }
}

function buildEmulatorConfig(): Parameters<typeof initializeApp>[0] {
  // The emulator does not validate credentials, but Admin SDK requires a
  // project id to key writes against. Prefer the server-side value; fall
  // back to the public one so local dev "just works" without extra env.
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'demo-project'
  return { projectId }
}

const existingApps = getApps()

let adminApp: App
if (existingApps.length > 0) {
  adminApp = existingApps[0]
} else if (USE_EMULATOR) {
  // eslint-disable-next-line no-console
  console.log('[firebase/admin] running against local emulator suite')
  adminApp = initializeApp(buildEmulatorConfig())
} else {
  adminApp = initializeApp(buildEnvCredentials())
}

const adminDb: Firestore = getFirestore(adminApp)
const adminAuth: Auth = getAuth(adminApp)

if (USE_EMULATOR) {
  const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8081'
  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099'

  try {
    adminDb.settings({ host: firestoreHost, ssl: false })
    // eslint-disable-next-line no-console
    console.log(`[firebase/admin] firestore emulator → ${firestoreHost}`)
    // eslint-disable-next-line no-console
    console.log(`[firebase/admin] auth emulator       → ${authHost}`)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    if (!message.includes('already been initialized')) {
      // eslint-disable-next-line no-console
      console.error('[firebase/admin] firestore emulator settings error:', error)
    }
  }
}

export { adminApp, adminDb, adminAuth }
