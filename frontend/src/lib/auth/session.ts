import 'server-only'
import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase/admin'

export const SESSION_COOKIE_NAME = '__session'
export const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

const ADMIN_EMAILS: ReadonlyArray<string> = (() => {
  const raw = process.env.ADMIN_EMAILS ?? ''
  const list = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  if (list.length === 0) {
    console.error(
      '[auth/session] ADMIN_EMAILS is empty, admin login is disabled. ' +
        'Set ADMIN_EMAILS (comma-separated) in the server environment.',
    )
  }
  return Object.freeze(list)
})()

function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false
  if (ADMIN_EMAILS.length === 0) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

export async function createSessionCookie(idToken: string): Promise<string> {
  const decoded = await adminAuth.verifyIdToken(idToken)

  if (!isAdminEmail(decoded.email)) {
    // Log without echoing the attempted email back to the client.
    console.warn('[auth/session] rejected non-admin login attempt')
    throw new Error('Unauthorized')
  }

  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_EXPIRY_MS,
  })

  return sessionCookie
}

export async function verifySessionCookie() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!sessionCookie) return null

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    if (!isAdminEmail(decoded.email)) return null
    return decoded
  } catch {
    return null
  }
}

export async function getSessionUser() {
  const decoded = await verifySessionCookie()
  if (!decoded) return null

  return {
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name || decoded.email?.split('@')[0] || 'Admin',
    picture: decoded.picture || null,
    isAdmin: isAdminEmail(decoded.email),
  }
}

export async function revokeSession() {
  const decoded = await verifySessionCookie()
  if (decoded?.uid) {
    try {
      await adminAuth.revokeRefreshTokens(decoded.uid)
    } catch (error) {
      console.error('Error revoking refresh tokens:', error)
    }
  }
}
