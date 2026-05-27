// frontend/src/app/api/contact/route.ts
// Public contact-form endpoint.
//
// Contract with the UI
// --------------------
// Once validation passes AND the message has been persisted to Firestore, the
// user-facing response is deterministic: `200 { ok: true, id }`. A failing
// mailer (Resend outage, bad config, etc.) is recorded on the Firestore
// record as `status: 'failed'` for internal follow-up; it is never exposed
// as a hard failure to the visitor. The message is durable, we own the
// signal from that point on.
//
// Lifecycle
// ---------
//   received   row exists. Nothing has been sent yet.
//   delivered  notification email went out successfully.
//   failed     internal-only marker that delivery could not be completed;
//              the admin follows up manually from the Firestore record.
//   handled    set manually by admin once follow-up is done.

import { NextRequest, NextResponse } from 'next/server'
import { ContactFormSchema } from '@personal-website/shared/schemas/contact.schema'
import {
  checkRateLimit,
  getRateLimitClientKey,
  rateLimitHeaders,
} from '@/lib/rateLimit'
import { getVisitorId } from '@/lib/visitor'
import * as contactsDb from '@/lib/firestore/contacts'
import { sendContactNotification } from '@/lib/mailer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const RATE_LIMIT = { limit: 3, windowMs: 10 * 60_000 }

export async function POST(req: NextRequest) {
  const clientKey = getRateLimitClientKey({
    visitorId: await getVisitorId(),
    request:   req,
  })
  const rl = checkRateLimit(`contact:${clientKey}`, RATE_LIMIT)
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

  const parsed = ContactFormSchema.safeParse(raw)
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

  // Honeypot: non-empty `website` means a bot. Mirror the real success shape
  // so crawlers can't learn our failure signal by diffing responses.
  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json(
      { ok: true, id: 'spam-discarded' },
      { headers: rateLimitHeaders(rl) },
    )
  }

  // 1) Persist first. Firestore is the durable record; email is just a
  //    notification channel. If Firestore itself is unreachable we reject
  //    hard  there's nothing to follow up on otherwise.
  let contactId: string
  try {
    const created = await contactsDb.createContact(parsed.data)
    contactId = created.id
  } catch (err) {
    logError('firestore_create_failed', err)
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500, headers: rateLimitHeaders(rl) },
    )
  }

  // 2) Notify. From here on, the user response is fixed at success: the
  //    message is safely stored and the admin can always follow up from
  //    Firestore even if mail delivery never happens.
  try {
    await sendContactNotification({
      id:      contactId,
      name:    parsed.data.name,
      email:   parsed.data.email,
      message: parsed.data.message,
    })
    // Best-effort status update, a failure here is cosmetic (the email did
    // go out). Swallow so the user response stays stable.
    try {
      await contactsDb.updateContactStatus(contactId, 'delivered')
    } catch (updateErr) {
      logError('firestore_mark_delivered_failed', updateErr)
    }
  } catch (err) {
    // Provider outage, track internally, don't leak. The message is already
    // persisted; admin will see `status: failed` and can reach out by hand.
    logError('mailer_send_failed', err)
    try {
      await contactsDb.updateContactStatus(contactId, 'failed')
    } catch (updateErr) {
      logError('firestore_mark_failed_failed', updateErr)
    }
  }

  return NextResponse.json(
    { ok: true, id: contactId },
    { headers: rateLimitHeaders(rl) },
  )
}

function logError(tag: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err)
  // eslint-disable-next-line no-console
  console.error(`[api/contact] ${tag}: ${message}`)
}
