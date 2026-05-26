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
import type { ContactNotification, Mailer } from './types'
import { MailerError } from './types'

const DRIVER = 'resend'

interface ResendConfig {
  apiKey: string
  to:     string
  from:   string
}

function readConfig(): ResendConfig {
  const apiKey = process.env.RESEND_API_KEY ?? ''
  const to     = process.env.CONTACT_NOTIFICATION_TO ?? ''
  const from   = process.env.CONTACT_NOTIFICATION_FROM ?? ''
  if (!apiKey || !to || !from) {
    throw new MailerError('resend mailer is not configured', { code: 'config', driver: DRIVER })
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

async function send(msg: ContactNotification): Promise<void> {
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
    throw new MailerError('resend request failed', { code: 'network', driver: DRIVER, cause: err })
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new MailerError(`resend responded ${res.status}`, {
      code: 'provider',
      driver: DRIVER,
      cause: text,
    })
  }
}

export const resendMailer: Mailer = {
  driver: DRIVER,
  sendContactNotification: send,
}

/**
 * Back-compat top-level export. Older callers imported this directly from
 * `@/lib/mailer/resend`. New code should go through `@/lib/mailer`.
 */
export async function sendContactNotification(msg: ContactNotification): Promise<void> {
  await send(msg)
}
