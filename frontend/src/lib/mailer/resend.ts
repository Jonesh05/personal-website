// frontend/src/lib/mailer/resend.ts
// Outbound transactional email via Resend. The `mailer` module is the single
// abstraction the route handlers talk to — swapping to nodemailer/Mailgun is
// a one-file change and the public signature stays identical.
//
// Env
// ---
// RESEND_API_KEY              server-side Resend API key
// CONTACT_NOTIFICATION_TO     inbox that receives contact notifications
// CONTACT_NOTIFICATION_FROM   verified "From" address in Resend

import 'server-only'

export class MailerError extends Error {
  readonly code: 'config' | 'provider' | 'network'
  readonly cause?: unknown

  constructor(message: string, opts: { code: MailerError['code']; cause?: unknown }) {
    super(message)
    this.name = 'MailerError'
    this.code = opts.code
    this.cause = opts.cause
  }
}

export interface ContactNotification {
  id:      string
  name:    string
  email:   string
  message: string
}

interface MailerConfig {
  apiKey: string
  to:     string
  from:   string
}

function readConfig(): MailerConfig {
  const apiKey = process.env.RESEND_API_KEY ?? ''
  const to     = process.env.CONTACT_NOTIFICATION_TO ?? ''
  const from   = process.env.CONTACT_NOTIFICATION_FROM ?? ''
  if (!apiKey || !to || !from) {
    throw new MailerError('mailer is not configured', { code: 'config' })
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

/**
 * Deliver a contact-form notification to the admin inbox. Throws `MailerError`
 * on any failure so callers can mark the Firestore record `failed` and surface
 * a deterministic response to the client.
 */
export async function sendContactNotification(msg: ContactNotification): Promise<void> {
  const cfg = readConfig()

  let res: Response
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfg.apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:     cfg.from,
        to:       [cfg.to],
        reply_to: msg.email,
        subject:  buildSubject(msg.name),
        html:     buildHtml(msg),
        text:     buildText(msg),
      }),
      cache: 'no-store',
    })
  } catch (err) {
    throw new MailerError('resend request failed', { code: 'network', cause: err })
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new MailerError(`resend responded ${res.status}`, {
      code: 'provider',
      cause: text,
    })
  }
}
