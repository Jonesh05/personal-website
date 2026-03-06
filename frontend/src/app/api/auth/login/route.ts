// frontend/src/app/api/auth/login/route.ts
// Exchanges Firebase idToken for httpOnly session cookie

import { NextRequest, NextResponse } from 'next/server'
import { createSessionCookie, SESSION_COOKIE_NAME, SESSION_EXPIRY_MS } from '@/lib/auth/session'

const SESSION_EXPIRY_SECONDS = SESSION_EXPIRY_MS / 1000

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()

    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })
    }

    const sessionCookie = await createSessionCookie(idToken)

    const response = NextResponse.json({ success: true })
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
    return NextResponse.json({ error: message }, { status: 401 })
  }
}
