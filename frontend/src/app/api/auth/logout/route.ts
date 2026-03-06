// frontend/src/app/api/auth/logout/route.ts
// Clears session cookie and revokes refresh tokens

import { NextResponse } from 'next/server'
import { revokeSession, SESSION_COOKIE_NAME } from '@/lib/auth/session'

export async function POST() {
  try {
    await revokeSession()

    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 })
  }
}
