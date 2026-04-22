import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE_NAME = '__session'
const VISITOR_COOKIE_NAME = 'visitor-id'
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 2 // 2 years

function isValidVisitorId(value: string | undefined): value is string {
  if (!value) return false
  // UUID v4 format check — opaque to prevent spoofed short ids
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/blog/admin') && !pathname.startsWith('/blog/login')) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)
    if (!sessionCookie?.value) {
      return NextResponse.redirect(new URL('/blog?login=required', request.url))
    }
  }

  const existingVisitor = request.cookies.get(VISITOR_COOKIE_NAME)?.value
  if (isValidVisitorId(existingVisitor)) {
    return NextResponse.next()
  }

  const newVisitorId = crypto.randomUUID()

  // Stamp the cookie on the forwarded request so downstream server components
  // can read it immediately on this same request.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('cookie', [
    request.headers.get('cookie') ?? '',
    `${VISITOR_COOKIE_NAME}=${newVisitorId}`,
  ].filter(Boolean).join('; '))

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.cookies.set(VISITOR_COOKIE_NAME, newVisitorId, {
    path: '/',
    maxAge: VISITOR_COOKIE_MAX_AGE,
    sameSite: 'lax',
    httpOnly: false, // readable by client for optimistic UX
    secure: process.env.NODE_ENV === 'production',
  })
  return response
}

export const config = {
  matcher: [
    // Apply to everything except static assets and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|css|js|map)).*)',
  ],
}
