// frontend/src/app/api/newsletter/subscribe/route.ts
// Public newsletter subscription endpoint.
//
// Contract with the UI
// --------------------
// Once validation passes AND the lead has been persisted, the user-facing
// response is deterministic: `200 { ok: true }`. Any downstream provider
// failure (listmonk unreachable, misconfigured, etc.) is recorded internally
// on the Firestore lead as `status: 'failed'` and logged, but never leaked
// to the client. This follows "fail closed" only at the validation boundary
// — after that, we own the signal and don't expose outages.
//
// Lifecycle
// ---------
//   pending   — row exists in Firestore. Submission is captured even if
//               listmonk is down.
//   failed    — internal-only marker that provider delivery never happened,
//               used for alerting and manual replay. Never returned to user.
// listmonk itself owns the real subscriber lifecycle (double opt-in,
// confirmation, unsubscribe, bounces). We do NOT mirror `confirmed` here
// because the synchronous listmonk ACK is not a user confirmation.

import { NextRequest, NextResponse } from 'next/server'
import { NewsletterSubscribeSchema } from '@personal-website/shared/schemas/newsletter.schema'
import {
  checkRateLimit,
  getRateLimitClientKey,
  rateLimitHeaders,
} from '@/lib/rateLimit'
import { getVisitorId } from '@/lib/visitor'
import * as leads from '@/lib/firestore/newsletter'
import { subscribe as listmonkSubscribe } from '@/lib/listmonk/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const RATE_LIMIT = { limit: 5, windowMs: 10 * 60_000 }

export async function POST(req: NextRequest) {
  // 1) Rate limit — cheap check, run before body parse.
  const clientKey = getRateLimitClientKey({
    visitorId: await getVisitorId(),
    request:   req,
  })
  const rl = checkRateLimit(`newsletter:${clientKey}`, RATE_LIMIT)
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: rateLimitHeaders(rl) },
    )
  }

  // 2) Validate payload BEFORE anything else. Malformed or invalid email
  //    addresses are rejected hard — we never want junk in the lead log.
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid_json' },
      { status: 400, headers: rateLimitHeaders(rl) },
    )
  }

  const parsed = NewsletterSubscribeSchema.safeParse(raw)
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

  // 3) Honeypot. Bots fill every field; real users never see `website`.
  //    Mirror the real success shape so crawlers can't learn our failure
  //    signal by diffing responses.
  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json(
      { ok: true },
      { headers: rateLimitHeaders(rl) },
    )
  }

  const { email, source } = parsed.data

  // 4) Persist the lead first. If Firestore itself is unreachable we reject
  //    hard — we have nothing durable to return a stable response against.
  let leadId: string
  try {
    const created = await leads.createLead({ email, source })
    leadId = created.id
  } catch (err) {
    logError('firestore_lead_create_failed', err)
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500, headers: rateLimitHeaders(rl) },
    )
  }

  // 5) Forward to listmonk. Fire-and-respond: from here on the user always
  //    sees success. A listmonk outage is recorded on the lead as `failed`
  //    so ops can replay later, but it is never exposed on the response.
  try {
    await listmonkSubscribe(email, source)
  } catch (err) {
    logError('listmonk_subscribe_failed', err)
    try {
      await leads.updateLeadStatus(leadId, 'failed')
    } catch (updateErr) {
      logError('firestore_lead_mark_failed_failed', updateErr)
    }
  }

  return NextResponse.json(
    { ok: true },
    { headers: rateLimitHeaders(rl) },
  )
}

function logError(tag: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err)
  // eslint-disable-next-line no-console
  console.error(`[api/newsletter/subscribe] ${tag}: ${message}`)
}
