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
import {
  upsertSubscriber,
  type SubscriberLocale,
} from '@/lib/firestore/subscribers'
import { MailerError, getMailer, sendTransactionalEmail } from '@/lib/mailer'
import {
  getNewsletterFrom,
  getPublicContactEmail,
  getSiteUrl,
} from '@/lib/siteConfig'
import {
  buildOneClickUnsubscribeUrl,
  buildPreferencesUrl,
  buildUnsubscribeUrl,
} from '@/domain/newsletter/broadcast'
import { LOCALE_KEY } from '@/i18n/constants'
import NewsletterTemplate from '@/emails/NewsletterTemplate'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const RATE_LIMIT = { limit: 5, windowMs: 10 * 60_000 }

function resolveRequestLocale(req: NextRequest): SubscriberLocale {
  const cookieVal = req.cookies.get(LOCALE_KEY)?.value?.toLowerCase()
  if (cookieVal === 'es' || cookieVal?.startsWith('es-')) return 'es'
  if (cookieVal === 'en' || cookieVal?.startsWith('en-')) return 'en'

  const accept = req.headers.get('accept-language')?.toLowerCase() ?? ''
  if (accept.startsWith('es')) return 'es'
  return 'en'
}

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
  const locale = resolveRequestLocale(req)

  // 4) Idempotent Firestore upsert (1 read + 1 write)
  let result: Awaited<ReturnType<typeof upsertSubscriber>>
  try {
    result = await upsertSubscriber({ email, tags, source, locale })
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
      subscriberId: subscriber.id,
      email:        subscriber.email,
      magicToken:   subscriber.magicToken,
      locale:       subscriber.locale,
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
  subscriberId: string
  email: string
  magicToken: string
  locale: SubscriberLocale
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
  const blogUrl = `${baseUrl}/blog`
  const preferencesUrl = buildPreferencesUrl(baseUrl, params.magicToken)
  const footerUnsubscribeUrl = buildUnsubscribeUrl(baseUrl, params.magicToken)
  const oneClickUnsubscribeUrl = buildOneClickUnsubscribeUrl(
    baseUrl,
    params.magicToken,
  )
  const isEs = params.locale === 'es'

  const subject = params.isNew
    ? isEs
      ? 'Bienvenido a mis notas en jonesh.me'
      : 'Welcome to my notes on jonesh.me'
    : isEs
      ? 'Preferencias actualizadas — jonesh.me'
      : 'Reading preferences updated — jonesh.me'

  const headline = params.isNew
    ? isEs
      ? 'Qué gusto tenerte por aquí'
      : 'Glad to have you here'
    : isEs
      ? 'Tus preferencias están actualizadas'
      : 'Your reading preferences are updated'

  const previewText = params.isNew
    ? isEs
      ? 'Suscripción confirmada — notas de ingeniería directo de Jhonny Pimiento.'
      : 'Subscription confirmed — engineering notes directly from Jhonny Pimiento.'
    : isEs
      ? 'Guardé tus temas de lectura en jonesh.me.'
      : 'Saved your reading topics on jonesh.me.'

  const introParagraph = params.isNew
    ? isEs
      ? 'Hola, soy Jhonny. Gracias por suscribirte a mis notas en jonesh.me — tu suscripción ya está activa.'
      : "Hi, I'm Jhonny. Thanks for subscribing to my notes on jonesh.me — you're all set."
    : isEs
      ? 'Hola, soy Jhonny. Quería confirmarte que tus preferencias de lectura en jonesh.me ya quedaron guardadas.'
      : "Hi, I'm Jhonny. Just confirming that your reading preferences on jonesh.me have been updated."

  const extraParagraphs = params.isNew
    ? isEs
      ? [
          'Escribo sobre Web3, IA, ciberseguridad y arquitectura de sistemas — solo cuando tengo algo práctico que compartir, sin ruido ni correos semanales de relleno.',
          'Si quieres saludar o contarme en qué estás trabajando, responde directamente a este correo. Leo y respondo cada mensaje personalmente.',
        ]
      : [
          'I write about Web3, AI, cybersecurity, and systems architecture — only when I have something practical worth sharing, with zero filler or spam.',
          "If you'd like to say hello or share what you're building, just hit reply to this email. I read and answer every note personally.",
        ]
    : isEs
      ? [
          'Puedes ajustar tus temas o darte de baja en cualquier momento desde los enlaces de abajo, o responderme directamente si hay algún tema que te gustaría ver.',
        ]
      : [
          'You can adjust your topics or unsubscribe anytime using the links below, or just reply to this email if there is a topic you want me to cover.',
        ]

  const ctaLabel = isEs ? 'Explorar el blog →' : 'Browse the blog →'
  const signOffGreeting = isEs ? 'Un saludo,' : 'Best,'

  const html = await render(
    NewsletterTemplate({
      subscriberEmail: params.email,
      magicToken:      params.magicToken,
      locale:          params.locale,
      editionNumber:   0,
      previewText,
      headline,
      introParagraph,
      paragraphs:      extraParagraphs,
      ctaLabel,
      ctaUrl:          blogUrl,
      signOffGreeting,
      baseUrl,
    }),
  )

  const text = [
    headline,
    '',
    introParagraph,
    '',
    ...extraParagraphs.flatMap((p) => [p, '']),
    `${ctaLabel} ${blogUrl}`,
    '',
    signOffGreeting,
    'Jhonny Pimiento',
    baseUrl,
    '',
    '---',
    `${isEs ? 'Gestionar preferencias' : 'Manage preferences'}: ${preferencesUrl}`,
    `${isEs ? 'Cancelar suscripción' : 'Unsubscribe'}: ${footerUnsubscribeUrl}`,
  ].join('\n')

  const driver = getMailer().driver
  await sendTransactionalEmail({
    from,
    to:      params.email,
    replyTo: getPublicContactEmail(),
    subject,
    html,
    text,
    headers: {
      'List-Unsubscribe':      `<${oneClickUnsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      'X-Entity-Ref-ID':       `welcome:${params.subscriberId.slice(0, 12)}`,
    },
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
