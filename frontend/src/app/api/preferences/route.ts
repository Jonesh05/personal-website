// frontend/src/app/api/preferences/route.ts
// Passwordless Preference Center API authenticated exclusively via `magicToken` (UUID v4).
//
// Security & Spark Guarantees:
// - Strict UUID v4 validation before touching Firestore
// - Rate limited per visitor / IP to prevent token brute-forcing
// - Single-field indexed lookup (max 1 read on GET; 1 read + 1 write on PATCH)
// - Atomic email-change migration with 409 conflict detection
// - Never exposes internal database IDs or other subscribers' records

import { NextRequest, NextResponse } from 'next/server'
import {
  MagicTokenSchema,
  PreferencesUpdateSchema,
} from '@personal-website/shared/schemas/newsletter.schema'
import {
  checkRateLimit,
  getRateLimitClientKey,
  rateLimitHeaders,
} from '@/lib/rateLimit'
import { getVisitorId } from '@/lib/visitor'
import {
  getSubscriberByMagicToken,
  updateSubscriberByMagicToken,
  SubscriberConflictError,
} from '@/lib/firestore/subscribers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const RATE_LIMIT = { limit: 15, windowMs: 10 * 60_000 }

export async function GET(req: NextRequest) {
  const clientKey = getRateLimitClientKey({
    visitorId: await getVisitorId(),
    request:   req,
  })
  const rl = checkRateLimit(`preferences:get:${clientKey}`, RATE_LIMIT)
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: rateLimitHeaders(rl) },
    )
  }

  const rawToken = req.nextUrl.searchParams.get('token') ?? ''
  const parsedToken = MagicTokenSchema.safeParse(rawToken)
  if (!parsedToken.success) {
    return NextResponse.json(
      { ok: false, error: 'invalid_token' },
      { status: 400, headers: rateLimitHeaders(rl) },
    )
  }

  try {
    const subscriber = await getSubscriberByMagicToken(parsedToken.data)
    if (!subscriber) {
      return NextResponse.json(
        { ok: false, error: 'not_found' },
        { status: 404, headers: rateLimitHeaders(rl) },
      )
    }

    return NextResponse.json(
      {
        ok: true,
        subscriber: {
          email:     subscriber.email,
          status:    subscriber.status,
          tags:      subscriber.tags,
          updatedAt: subscriber.updatedAt.toISOString(),
        },
      },
      { headers: rateLimitHeaders(rl) },
    )
  } catch (err) {
    logError('get_preferences_failed', err)
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500, headers: rateLimitHeaders(rl) },
    )
  }
}

export async function PATCH(req: NextRequest) {
  const clientKey = getRateLimitClientKey({
    visitorId: await getVisitorId(),
    request:   req,
  })
  const rl = checkRateLimit(`preferences:patch:${clientKey}`, RATE_LIMIT)
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: rateLimitHeaders(rl) },
    )
  }

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_json' },
      { status: 400, headers: rateLimitHeaders(rl) },
    )
  }

  const parsed = PreferencesUpdateSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'invalid_input',
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400, headers: rateLimitHeaders(rl) },
    )
  }

  const { token, email, status, tags } = parsed.data

  try {
    const updated = await updateSubscriberByMagicToken(token, {
      email,
      status,
      tags,
    })

    if (!updated) {
      return NextResponse.json(
        { ok: false, error: 'not_found' },
        { status: 404, headers: rateLimitHeaders(rl) },
      )
    }

    return NextResponse.json(
      {
        ok: true,
        subscriber: {
          email:     updated.email,
          status:    updated.status,
          tags:      updated.tags,
          updatedAt: updated.updatedAt.toISOString(),
        },
      },
      { headers: rateLimitHeaders(rl) },
    )
  } catch (err) {
    if (err instanceof SubscriberConflictError) {
      return NextResponse.json(
        { ok: false, error: 'email_already_in_use' },
        { status: 409, headers: rateLimitHeaders(rl) },
      )
    }

    logError('patch_preferences_failed', err)
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500, headers: rateLimitHeaders(rl) },
    )
  }
}

export async function POST(req: NextRequest) {
  return PATCH(req)
}

function logError(tag: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err)
  // eslint-disable-next-line no-console
  console.error(`[api/preferences] ${tag}: ${message}`)
}
