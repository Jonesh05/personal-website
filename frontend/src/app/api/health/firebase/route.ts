// frontend/src/app/api/health/firebase/route.ts
// Production diagnostic endpoint for the Firebase Admin SDK.
//
// Purpose:
//   In a hosted environment (Vercel) we cannot always trust that
//   FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY have
//   the correct shape. A malformed private key or a wrong project id causes
//   every Firestore-backed route to return 500. This endpoint isolates the
//   admin-init + firestore-reachability signal so an operator can confirm
//   the failure is upstream without having to read page-level errors.
//
// Security contract:
//   - Public endpoint, but returns NO credentials and NO error messages.
//   - Exposes only presence bits for env vars and coarse OK / FAIL labels.
//   - Detailed errors are printed to server logs (`[health/firebase] ...`)
//     so they show up in Vercel's function logs and can be correlated with
//     the request by timestamp.
//
// Not cached. Runs on-demand.

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type CheckStatus = 'ok' | 'fail' | 'skipped'

interface HealthResponse {
  ok: boolean
  env: {
    FIREBASE_PROJECT_ID: boolean
    FIREBASE_CLIENT_EMAIL: boolean
    FIREBASE_PRIVATE_KEY: boolean
    ADMIN_EMAILS: boolean
    NEXT_PUBLIC_SITE_URL: boolean
    USE_FIREBASE_EMULATOR: boolean
  }
  adminInit: CheckStatus
  firestorePing: CheckStatus
  // NOTE: hint codes are intentionally coarse. They describe the *category*
  // of failure so we can fix it without leaking diagnostic detail publicly.
  hint?:
    | 'missing-env'
    | 'admin-init-failed'
    | 'firestore-unreachable'
    | 'unknown'
}

function checkEnvPresence(): HealthResponse['env'] {
  return {
    FIREBASE_PROJECT_ID: Boolean(process.env.FIREBASE_PROJECT_ID),
    FIREBASE_CLIENT_EMAIL: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
    FIREBASE_PRIVATE_KEY: Boolean(process.env.FIREBASE_PRIVATE_KEY),
    ADMIN_EMAILS: Boolean(process.env.ADMIN_EMAILS),
    NEXT_PUBLIC_SITE_URL: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
    USE_FIREBASE_EMULATOR: process.env.USE_FIREBASE_EMULATOR === 'true',
  }
}

export async function GET() {
  const env = checkEnvPresence()

  // Short-circuit: if any required server-side credential is missing, don't
  // even try to import the admin module — we already know it will throw.
  const missingCreds =
    !env.FIREBASE_PROJECT_ID ||
    !env.FIREBASE_CLIENT_EMAIL ||
    !env.FIREBASE_PRIVATE_KEY

  if (missingCreds) {
    // eslint-disable-next-line no-console
    console.error('[health/firebase] missing required env vars', env)
    const body: HealthResponse = {
      ok: false,
      env,
      adminInit: 'skipped',
      firestorePing: 'skipped',
      hint: 'missing-env',
    }
    return NextResponse.json(body, { status: 500 })
  }

  // Dynamically import so a throw during admin module evaluation is catchable
  // here (top-level `throw` in admin.ts would otherwise crash the whole
  // route at module-graph evaluation time).
  let adminInit: CheckStatus = 'ok'
  let firestorePing: CheckStatus = 'skipped'
  let hint: HealthResponse['hint']

  try {
    const { adminDb } = await import('@/lib/firebase/admin')

    try {
      await adminDb.collection('posts').limit(1).get()
      firestorePing = 'ok'
    } catch (error) {
      firestorePing = 'fail'
      hint = 'firestore-unreachable'
      const message = error instanceof Error ? error.message : String(error)
      // eslint-disable-next-line no-console
      console.error(`[health/firebase] firestore ping failed: ${message}`)
    }
  } catch (error) {
    adminInit = 'fail'
    firestorePing = 'skipped'
    hint = 'admin-init-failed'
    const message = error instanceof Error ? error.message : String(error)
    // eslint-disable-next-line no-console
    console.error(`[health/firebase] admin init failed: ${message}`)
  }

  const ok = adminInit === 'ok' && firestorePing === 'ok'
  const body: HealthResponse = {
    ok,
    env,
    adminInit,
    firestorePing,
    ...(hint ? { hint } : {}),
  }
  return NextResponse.json(body, { status: ok ? 200 : 500 })
}
