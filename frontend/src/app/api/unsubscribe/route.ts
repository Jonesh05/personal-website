// frontend/src/app/api/unsubscribe/route.ts
// RFC 8058 One-Click Unsubscribe endpoint.
//
// - POST: Invoked automatically by Gmail / Apple Mail / Yahoo when a recipient
//   clicks the native "Unsubscribe" button (`List-Unsubscribe-Post: List-Unsubscribe=One-Click`).
//   Reads `token` from `?token=...` (with fallback to `application/x-www-form-urlencoded` body),
//   marks the subscriber `unsubscribed` in Firestore, and returns `200 { ok: true }`.
// - GET: Safe 302 redirect to `/preferences?token=...&action=unsubscribe` using
//   strict UUID validation and same-origin relative path construction (no open redirects).

import { NextRequest, NextResponse } from 'next/server'
import { MagicTokenSchema } from '@personal-website/shared/schemas/newsletter.schema'
import { updateSubscriberByMagicToken } from '@/lib/firestore/subscribers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function extractTokenFromRequest(req: NextRequest): Promise<string | null> {
  const queryToken = req.nextUrl.searchParams.get('token')
  if (queryToken && queryToken.trim().length > 0) {
    return queryToken.trim()
  }

  const contentType = req.headers.get('content-type')?.toLowerCase() ?? ''
  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('text/plain')
  ) {
    try {
      const bodyText = await req.text()
      if (bodyText) {
        const params = new URLSearchParams(bodyText)
        const bodyToken = params.get('token')
        if (bodyToken && bodyToken.trim().length > 0) {
          return bodyToken.trim()
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[api/unsubscribe] failed reading form body:', err)
    }
  }

  return null
}

export async function POST(req: NextRequest) {
  const rawToken = await extractTokenFromRequest(req)
  const parsed = MagicTokenSchema.safeParse(rawToken ?? '')

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'invalid_token' },
      { status: 400 },
    )
  }

  try {
    await updateSubscriberByMagicToken(parsed.data, {
      status: 'unsubscribed',
    })
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    // eslint-disable-next-line no-console
    console.error(`[api/unsubscribe] firestore update failed: ${message}`)
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  const rawToken = req.nextUrl.searchParams.get('token') ?? ''
  const parsed = MagicTokenSchema.safeParse(rawToken)

  const targetPath = parsed.success
    ? `/preferences?token=${encodeURIComponent(parsed.data)}&action=unsubscribe`
    : '/preferences'

  return NextResponse.redirect(new URL(targetPath, req.nextUrl.origin), 302)
}
