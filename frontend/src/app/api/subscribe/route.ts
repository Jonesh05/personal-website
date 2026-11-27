// frontend/src/app/api/subscribe/route.ts
// Public newsletter subscription & reading segmentation endpoint.
//
// Architecture (Spark-safe & vendor-agnostic):
// - Strict Zod validation (email + reading tags + anti-spam honeypot)
// - Rate limiting per visitor / IP before touching Firestore
// - Single Firestore transaction on `newsletter_subscribers/{sha256(email)}`
//   (1 read + 1 write per real subscription — zero fan-out audit writes)
// - Cryptographic UUID v4 `magicToken` for passwordless Preference Center
// - Confirmation / welcome email via transport-agnostic `@/lib/mailer`
//   (SMTP or Resend controlled by env — zero third-party ESP lock-in)

import { NextRequest, NextResponse } from 'next/server'
import { render } from '@react-email/render'
import { NewsletterSubscribeSchema } from '@personal-website/shared/schemas/newsletter.schema'
import {
  checkRateLimit,
  getRateLimitClientKey,
  rateLimitHeaders,
} from '@/lib/rateLimit'
import { getVisitorId } from '@/lib/visitor'
import { upsertSubscriber } from '@/lib/firestore/subscribers'
import { MailerError, getMailer, sendTransactionalEmail } from '@/lib/mailer'
import { getNewsletterFrom, getSiteUrl } from '@/lib/siteConfig'
import NewsletterTemplate from '@/emails/NewsletterTemplate'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const RATE_LIMIT = { limit: 5, windowMs: 10 * 60_000 }

export async function POST(req: NextRequest) {
  // 1) Rate limit check before parsing body or touching Firestore
  const clientKey = getRateLimitClientKey({
    visitorId: await getVisitorId(),
    request:   req,
  })
  const rl = checkRateLimit(`subscribe:${clientKey}`, RATE_LIMIT)
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited' },
      { status: 429, headers: rateLimitHeaders(rl) },
    )
  }

  // 2) Parse and validate JSON payload
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

  // 3) Anti-spam Honeypot: return identical 200 shape so bots cannot diff responses
  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json(
      { ok: true },
      { headers: rateLimitHeaders(rl) },
    )
  }

  const { email, tags, source } = parsed.data

  // 4) Idempotent Firestore upsert (1 read + 1 write)
  let result: Awaited<ReturnType<typeof upsertSubscriber>>
  try {
    result = await upsertSubscriber({ email, tags, source })
  } catch (err) {
    logError('firestore_subscriber_upsert_failed', err)
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500, headers: rateLimitHeaders(rl) },
    )
  }

  const { subscriber, isNew } = result

  // 5) Confirmation / welcome email via decoupled Mailer (SMTP or Resend).
  //    Sent on every valid subscription (protected by rate-limit: 5 req/10 min)
  //    so both new signups and readers updating topics receive confirmation.
  type EmailStatus = 'sent' | 'not_configured' | 'provider_error' | 'network_error'
  let emailStatus: EmailStatus = 'not_configured'

  try {
    const dispatched = await sendWelcomeDispatch({
      email:      subscriber.email,
      magicToken: subscriber.magicToken,
      tags:       subscriber.tags,
      isNew,
    })
    emailStatus = dispatched ? 'sent' : 'not_configured'
  } catch (err) {
    if (err instanceof MailerError) {
      logError(`welcome_email_failed (${err.driver}/${err.code})`, err)
      if (err.code === 'config') emailStatus = 'not_configured'
      else if (err.code === 'network') emailStatus = 'network_error'
      else emailStatus = 'provider_error'
    } else {
      logError('welcome_email_failed', err)
      emailStatus = 'provider_error'
    }
  }

  return NextResponse.json(
    {
      ok: true,
      emailStatus,
      subscriber: {
        email:  subscriber.email,
        status: subscriber.status,
        tags:   subscriber.tags,
      },
    },
    { headers: rateLimitHeaders(rl) },
  )
}

async function sendWelcomeDispatch(params: {
  email: string
  magicToken: string
  tags: string[]
  isNew: boolean
}): Promise<boolean> {
  const from = getNewsletterFrom()
  if (!from) {
    const driver = getMailer().driver
    // eslint-disable-next-line no-console
    console.warn(
      `[api/subscribe] confirmation email skipped: no NEWSLETTER_FROM or CONTACT_NOTIFICATION_FROM configured (driver=${driver})`,
    )
    return false
  }

  const baseUrl = getSiteUrl()
  const html = await render(
    NewsletterTemplate({
      subscriberEmail: params.email,
      magicToken:      params.magicToken,
      editionNumber:   0,
      previewText:     params.isNew
        ? 'Subscription confirmed — jonesh.me'
        : 'Reading preferences updated — jonesh.me',
      headline: params.isNew
        ? 'Welcome to jonesh.me'
        : 'Reading preferences updated',
      introParagraph: params.isNew
        ? 'Your subscription is active. Whenever a new technical article is published on jonesh.me, you will receive a concise summary and direct link right here.'
        : 'Your reading preferences have been saved. You can adjust your topics or unsubscribe anytime from the link below.',
      ctaLabel: 'Read Latest Articles →',
      ctaUrl:   `${baseUrl}/blog`,
      baseUrl,
    }),
  )

  const text = [
    params.isNew
      ? 'Welcome to jonesh.me — Subscription Confirmed'
      : 'Reading preferences updated — jonesh.me',
    '',
    `Read the blog: ${baseUrl}/blog`,
    `Manage preferences: ${baseUrl}/preferences?token=${encodeURIComponent(params.magicToken)}`,
  ].join('\n')

  const driver = getMailer().driver
  await sendTransactionalEmail({
    from,
    to:      params.email,
    subject: params.isNew
      ? 'Welcome to jonesh.me — Subscription Confirmed'
      : 'jonesh.me — Reading Preferences Updated',
    html,
    text,
  })
  // eslint-disable-next-line no-console
  console.info(`[api/subscribe] confirmation email accepted by driver=${driver}`)
  return true
}

function logError(tag: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err)
  // eslint-disable-next-line no-console
  console.error(`[api/subscribe] ${tag}: ${message}`)
}
