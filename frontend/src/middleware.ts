import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE_NAME = '__session'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/blog/admin') && !pathname.startsWith('/blog/login')) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)
    if (!sessionCookie?.value) {
      return NextResponse.redirect(new URL('/blog?login=required', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/blog/admin/:path*'],
}

