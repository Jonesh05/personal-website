// frontend/src/lib/mailer/smtp.ts
// Plain SMTP driver via nodemailer. Preferred default — works with any
// self-hosted/open-source relay (Postfix, Haraka, the SMTP that ships with
// listmonk's host, etc.) so we don't depend on a paid provider for the
// site's transactional channel.
//
// Env
// ---
// SMTP_HOST                    e.g. smtp.example.com
// SMTP_PORT                    587 (STARTTLS) or 465 (TLS) or 25
// SMTP_USER                    auth username (optional if relay is open)
// SMTP_PASSWORD                auth password (optional)
// SMTP_SECURE                  "true" forces TLS-on-connect (port 465); else STARTTLS upgrades
// CONTACT_NOTIFICATION_TO      inbox that receives contact notifications
// CONTACT_NOTIFICATION_FROM    From address; must be allowed by the relay
//                              (e.g. "Personal Site <noreply@jpimiento.dev>")

import 'server-only'
import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import type { ContactNotification, Mailer } from './types'
import { MailerError } from './types'

const DRIVER = 'smtp'

interface SmtpConfig {
  host:     string
  port:     number
  secure:   boolean
  user?:    string
  password?: string
  to:       string
  from:     string
}

function readConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST ?? ''
  const port = Number(process.env.SMTP_PORT ?? '587')
  const to   = process.env.CONTACT_NOTIFICATION_TO ?? ''
  const from = process.env.CONTACT_NOTIFICATION_FROM ?? ''

  if (!host || !Number.isFinite(port) || !to || !from) {
    throw new MailerError('smtp mailer is not configured', { code: 'config', driver: DRIVER })
  }

  // Heuristic: port 465 implies TLS-on-connect; everything else negotiates STARTTLS.
  // Override via SMTP_SECURE=true|false if the relay doesn't follow that convention.
  const secureEnv = process.env.SMTP_SECURE
  const secure = secureEnv ? secureEnv === 'true' : port === 465

  const user = process.env.SMTP_USER || undefined
  const password = process.env.SMTP_PASSWORD || undefined

  return { host, port, secure, user, password, to, from }
}

let cachedTransport: Transporter | null = null
let cachedKey = ''

function getTransport(cfg: SmtpConfig): Transporter {
  // Cache per-config so config rotation (env reload) takes effect without
  // leaking sockets across Lambda warm starts.
  const key = `${cfg.host}|${cfg.port}|${cfg.secure}|${cfg.user ?? ''}`
  if (cachedTransport && cachedKey === key) return cachedTransport
  cachedTransport = nodemailer.createTransport({
    host:   cfg.host,
    port:   cfg.port,
    secure: cfg.secure,
    auth: cfg.user && cfg.password
      ? { user: cfg.user, pass: cfg.password }
      : undefined,
  })
  cachedKey = key
  return cachedTransport
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

export const smtpMailer: Mailer = {
  driver: DRIVER,
  async sendContactNotification(msg) {
    const cfg = readConfig()
    const transport = getTransport(cfg)

    try {
      await transport.sendMail({
        from:    cfg.from,
        to:      cfg.to,
        replyTo: msg.email,
        subject: buildSubject(msg.name),
        text:    buildText(msg),
        html:    buildHtml(msg),
      })
    } catch (err) {
      // nodemailer surfaces ECONN* / EAUTH / EENVELOPE etc.; bucket them
      // into the two outcomes the route cares about (network vs provider).
      const code = (err as { code?: string })?.code ?? ''
      const bucket = /^E(CONN|TIMEDOUT|DNS|REFUSED|HOSTUNREACH)/.test(code)
        ? 'network'
        : 'provider'
      throw new MailerError(`smtp send failed: ${code || (err as Error).message}`, {
        code: bucket,
        driver: DRIVER,
        cause: err,
      })
    }
  },
}
