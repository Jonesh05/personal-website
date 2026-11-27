// frontend/src/lib/mailer/resend.ts
// Resend driver. Kept as an opt-in fallback for the pluggable mailer (set
// MAILER_DRIVER=resend). The default is `smtp`; we keep this around because
// it is the fastest path to a working pipeline when no relay is available.
//
// Env
// ---
// RESEND_API_KEY              server-side Resend API key
// CONTACT_NOTIFICATION_TO     inbox that receives contact notifications
// CONTACT_NOTIFICATION_FROM   verified "From" address in Resend

import 'server-only'
import type { ContactNotification, Mailer, TransactionalEmail } from './types'
import { MailerError } from './types'
import { getContactFrom } from '@/lib/siteConfig'

const DRIVER = 'resend'

interface ResendConfig {
  apiKey: string
  to:     string
  from:   string
}

function readApiKey(): string {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? ''
  if (!apiKey) {
    throw new MailerError('resend mailer is not configured (missing RESEND_API_KEY)', {
      code: 'config',
      driver: DRIVER,
    })
  }
  return apiKey
}

function readConfig(): ResendConfig {
  const apiKey = readApiKey()
  const to     = process.env.CONTACT_NOTIFICATION_TO?.trim() ?? ''
  const from   = getContactFrom()
  if (!to || !from) {
    throw new MailerError('resend contact mailer is not configured', { code: 'config', driver: DRIVER })
  }
  return { apiKey, to, from }
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildSubject(name: string): string {
  const clean = name.trim().slice(0, 60) || 'a visitor'
  return `[contact] new message from ${clean}`
}

function buildHtml(msg: ContactNotification): string {
  const body = escapeHtml(msg.message).replace(/\n/g, '<br/>')
  return [
    '<div style="font-family:system-ui,Segoe UI,Roboto,sans-serif;line-height:1.5">',
    `<p><strong>From:</strong> ${escapeHtml(msg.name)} &lt;${escapeHtml(msg.email)}&gt;</p>`,
    `<p><strong>Message ID:</strong> <code>${escapeHtml(msg.id)}</code></p>`,
    '<hr/>',
    `<p>${body}</p>`,
    '</div>',
  ].join('')
}

function buildText(msg: ContactNotification): string {
  return [
    `From: ${msg.name} <${msg.email}>`,
    `Message ID: ${msg.id}`,
    '---',
    msg.message,
  ].join('\n')
}

async function postToResend(payload: {
  apiKey:   string
  from:     string
  to:       string
  replyTo?: string
  subject:  string
  html:     string
  text?:    string
}): Promise<void> {
  let res: Response
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${payload.apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:     payload.from,
        to:       [payload.to],
        ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
        subject:  payload.subject,
        html:     payload.html,
        ...(payload.text ? { text: payload.text } : {}),
      }),
      cache: 'no-store',
    })
  } catch (err) {
    throw new MailerError('resend request failed', { code: 'network', driver: DRIVER, cause: err })
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let detail = ''
    try {
      const parsed = JSON.parse(text) as { message?: string; name?: string }
      if (parsed.message) detail = ` — ${parsed.message}`
    } catch {
      if (text) detail = ` — ${text.slice(0, 160)}`
    }
    throw new MailerError(`resend responded ${res.status}${detail}`, {
      code: 'provider',
      driver: DRIVER,
      cause: text,
    })
  }
}

async function send(msg: ContactNotification): Promise<void> {
  const cfg = readConfig()
  await postToResend({
    apiKey:  cfg.apiKey,
    from:    cfg.from,
    to:      cfg.to,
    replyTo: msg.email,
    subject: buildSubject(msg.name),
    html:    buildHtml(msg),
    text:    buildText(msg),
  })
}

async function sendEmail(msg: TransactionalEmail): Promise<void> {
  const apiKey = readApiKey()
  const from = msg.from?.trim() || getContactFrom()
  if (!from) {
    throw new MailerError('resend transactional email missing From address', {
      code: 'config',
      driver: DRIVER,
    })
  }
  await postToResend({
    apiKey,
    from,
    to:      msg.to,
    replyTo: msg.replyTo,
    subject: msg.subject,
    html:    msg.html,
    text:    msg.text,
  })
}

export const resendMailer: Mailer = {
  driver: DRIVER,
  sendContactNotification: send,
  sendEmail,
}

/**
 * Back-compat top-level export. Older callers imported this directly from
 * `@/lib/mailer/resend`. New code should go through `@/lib/mailer`.
 */
export async function sendContactNotification(msg: ContactNotification): Promise<void> {
  await send(msg)
}
