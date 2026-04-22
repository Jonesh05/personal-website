// frontend/src/app/api/auth/login/route.ts
// Exchanges a Firebase idToken for an httpOnly session cookie.
// Rate-limited tightly because this is the single highest-value endpoint.

import { NextRequest, NextResponse } from 'next/server'
import { createSessionCookie, SESSION_COOKIE_NAME, SESSION_EXPIRY_MS } from '@/lib/auth/session'
import {
  AUTH_LIMIT,
  checkRateLimit,
  getRateLimitClientKey,
  rateLimitHeaders,
} from '@/lib/rateLimit'

const SESSION_EXPIRY_SECONDS = SESSION_EXPIRY_MS / 1000

export async function POST(request: NextRequest) {
  // Throttle first. Cheap, bounds brute-force attempts before we ever touch
  // the Admin SDK (which is the expensive part of this handler).
  const clientKey = getRateLimitClientKey({ visitorId: null, request })
  const rl = checkRateLimit(`auth:login:${clientKey}`, AUTH_LIMIT)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      {
        status: 429,
        headers: {
          ...rateLimitHeaders(rl),
          'Retry-After': String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))),
        },
      },
    )
  }

  try {
    const { idToken } = await request.json()

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json(
        { error: 'Missing idToken' },
        { status: 400, headers: rateLimitHeaders(rl) },
      )
    }

    const sessionCookie = await createSessionCookie(idToken)

    const response = NextResponse.json(
      { success: true },
      { headers: rateLimitHeaders(rl) },
    )
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_EXPIRY_SECONDS,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    const message = error instanceof Error ? error.message : 'Login failed'
    return NextResponse.json(
      { error: message },
      { status: 401, headers: rateLimitHeaders(rl) },
    )
  }
}
