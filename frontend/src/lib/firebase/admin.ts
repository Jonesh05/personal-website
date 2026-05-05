// frontend/src/lib/firebase/admin.ts
// Server-only Firebase Admin SDK initialization.
//
// Initialization contract (production-safe):
//
//   1. Credentials are sourced ONLY from environment variables. Two forms are
//      accepted, in priority order:
//
//        a) FIREBASE_SERVICE_ACCOUNT
//           A single env var containing the full service-account JSON
//           (or a base64-encoded JSON). This is the preferred form on
//           Vercel because it side-steps the `DECODER routines::unsupported`
//           error caused by shell/CRLF corruption of multi-line PEM keys.
//
//        b) FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
//           Three separate env vars. `FIREBASE_PRIVATE_KEY` is normalized by
//           converting escaped `\n` sequences into real newlines and
//           stripping wrapping quotes that some UIs add on paste.
//
//      File-based credentials (GOOGLE_APPLICATION_CREDENTIALS, ADC,
//      service-account.json) are intentionally NOT supported.
//
//   2. Environment separation is strict and non-overlapping:
//        - production: env credentials only. No emulator, ever.
//        - development: env credentials by default; the emulator is enabled
//          ONLY when USE_FIREBASE_EMULATOR=true is explicitly set.
//
//   3. Initialization is LAZY. Missing credentials do NOT crash module load;
//      they throw on the first actual use of `adminDb` / `adminAuth`. This
//      keeps build-time static analysis, tree-shaking, and prerendering from
//      breaking on a Vercel deploy that legitimately has no Firestore access
//      for a particular route. Once initialized, the Admin SDK app is
//      memoized for the lifetime of the Node process.
//
// DO NOT import this module from client components.

import 'server-only'
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth, type Auth } from 'firebase-admin/auth'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const EMULATOR_FLAG = process.env.USE_FIREBASE_EMULATOR === 'true'

if (IS_PRODUCTION && EMULATOR_FLAG) {
  throw new Error(
    '[firebase/admin] USE_FIREBASE_EMULATOR=true is forbidden in production. ' +
      'Remove the flag from production environment variables.',
  )
}

const USE_EMULATOR = !IS_PRODUCTION && EMULATOR_FLAG

interface ServiceAccountJson {
  project_id?: string
  projectId?: string
  client_email?: string
  clientEmail?: string
  private_key?: string
  privateKey?: string
}

function stripQuotes(value: string): string {
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function normalizePrivateKey(raw: string): string {
  // Strip wrapping quotes first — Vercel's UI sometimes keeps them on paste,
  // which leaves the outer `"…"` inside the value and corrupts the PEM.
  const unquoted = stripQuotes(raw)
  // Vercel, GitHub Actions, and most CI systems escape real newlines as `\n`
  // when round-tripping env vars through shell expansion. Convert back.
  return unquoted.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')
}

function parseServiceAccount(raw: string): ServiceAccountJson {
  const unquoted = stripQuotes(raw)

  // Accept either raw JSON or base64-encoded JSON. Vercel accepts multi-line
  // values now, but some ops workflows still prefer base64 for safety.
  let jsonText = unquoted
  if (!unquoted.trim().startsWith('{')) {
    try {
      jsonText = Buffer.from(unquoted, 'base64').toString('utf8')
    } catch {
      // fall through — let the JSON.parse below surface the real error
    }
  }

  try {
    return JSON.parse(jsonText) as ServiceAccountJson
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      '[firebase/admin] FIREBASE_SERVICE_ACCOUNT is set but is not valid JSON ' +
        '(or base64 of JSON). Parser said: ' +
        message,
    )
  }
}

function buildCredentialsFromServiceAccount(raw: string): Parameters<typeof initializeApp>[0] {
  const parsed = parseServiceAccount(raw)
  const projectId = parsed.project_id ?? parsed.projectId
  const clientEmail = parsed.client_email ?? parsed.clientEmail
  const rawPrivateKey = parsed.private_key ?? parsed.privateKey

  const missing: string[] = []
  if (!projectId) missing.push('project_id')
  if (!clientEmail) missing.push('client_email')
  if (!rawPrivateKey) missing.push('private_key')
  if (missing.length > 0) {
    throw new Error(
      `[firebase/admin] FIREBASE_SERVICE_ACCOUNT is missing field(s): ${missing.join(', ')}.`,
    )
  }

  return {
    projectId,
    credential: cert({
      projectId: projectId!,
      clientEmail: clientEmail!,
      privateKey: normalizePrivateKey(rawPrivateKey!),
    }),
  }
}

function buildCredentialsFromSeparateVars(): Parameters<typeof initializeApp>[0] {
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
        'Set FIREBASE_SERVICE_ACCOUNT (preferred) or the three separate vars. ' +
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

function buildProdCredentials(): Parameters<typeof initializeApp>[0] {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  if (serviceAccount && serviceAccount.trim().length > 0) {
    return buildCredentialsFromServiceAccount(serviceAccount)
  }
  return buildCredentialsFromSeparateVars()
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

interface AdminBundle {
  app: App
  db: Firestore
  auth: Auth
}

let cached: AdminBundle | null = null

function initialize(): AdminBundle {
  if (cached) return cached

  const existing = getApps()
  let app: App
  if (existing.length > 0) {
    app = existing[0]
  } else if (USE_EMULATOR) {
    // eslint-disable-next-line no-console
    console.log('[firebase/admin] running against local emulator suite')
    app = initializeApp(buildEmulatorConfig())
  } else {
    app = initializeApp(buildProdCredentials())
  }

  const db = getFirestore(app)
  const auth = getAuth(app)

  if (USE_EMULATOR) {
    const firestoreHost = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8081'
    const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || 'localhost:9099'
    try {
      db.settings({ host: firestoreHost, ssl: false })
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

  cached = { app, db, auth }
  return cached
}

// Lazy proxies — the underlying SDK is only initialized on first property
// access. Module import is always cheap, which is what keeps the build from
// crashing on routes whose env is not fully populated at build time.
function lazyProxy<T extends object>(getTarget: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop, receiver) {
      const value = Reflect.get(getTarget(), prop, receiver)
      return typeof value === 'function' ? value.bind(getTarget()) : value
    },
    set(_target, prop, value, receiver) {
      return Reflect.set(getTarget(), prop, value, receiver)
    },
    has(_target, prop) {
      return Reflect.has(getTarget(), prop)
    },
    ownKeys() {
      return Reflect.ownKeys(getTarget())
    },
    getOwnPropertyDescriptor(_target, prop) {
      return Reflect.getOwnPropertyDescriptor(getTarget(), prop)
    },
  })
}

const adminApp = lazyProxy<App>(() => initialize().app)
const adminDb = lazyProxy<Firestore>(() => initialize().db)
const adminAuth = lazyProxy<Auth>(() => initialize().auth)

export { adminApp, adminDb, adminAuth }
