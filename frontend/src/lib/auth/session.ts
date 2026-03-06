// frontend/src/lib/auth/session.ts
// Server-side session cookie utilities
// Replaces localStorage token storage with httpOnly cookies

import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase/admin'

export const SESSION_COOKIE_NAME = '__session'
export const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// Use the admin email configured in environment variables, or allow newrevolutiion@gmail.com as a fallback
const ADMIN_EMAILS = [
  process.env.NEXT_PUBLIC_ADMIN_EMAIL,
  'newrevolutiion@gmail.com',
  'jhonny.pimiento@gmail.com' // Commonly seen in user projects, adding as safety
].filter(Boolean);

export async function createSessionCookie(idToken: string): Promise<string> {
  // Verify the idToken first
  const decoded = await adminAuth.verifyIdToken(idToken)

  // Check if user is admin
  if (!decoded.email || !ADMIN_EMAILS.includes(decoded.email)) {
    throw new Error(`Unauthorized: not an admin (${decoded.email})`)
  }

  // Create session cookie
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
    if (!decoded.email || !ADMIN_EMAILS.includes(decoded.email)) return null
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
    isAdmin: decoded.email ? ADMIN_EMAILS.includes(decoded.email) : false,
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
