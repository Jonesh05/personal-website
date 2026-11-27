// frontend/src/lib/mailer/smtp.ts
// Plain SMTP driver via nodemailer. Preferred default, works with any
// self-hosted/open-source relay (Postfix, Haraka, etc.) so we don't depend on
// a paid provider for the site's transactional contact channel.
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
//                              (e.g. "jonesh.me <noreply@mail.jonesh.me>")

import 'server-only'
import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import type { ContactNotification, Mailer, TransactionalEmail } from './types'
import { MailerError } from './types'
import { getContactFrom } from '@/lib/siteConfig'
import {
  buildContactAdminHtml,
  buildContactAdminSubject,
  buildContactAdminText,
  sanitizeEmailHeaderValue,
} from './contactFormatter'

const DRIVER = 'smtp'

interface SmtpTransportConfig {
  host:      string
  port:      number
  secure:    boolean
  user?:     string
  password?: string
}

interface SmtpConfig extends SmtpTransportConfig {
  to:   string
  from: string
}

function readTransportConfig(): SmtpTransportConfig {
  const host = process.env.SMTP_HOST?.trim() ?? ''
  const port = Number(process.env.SMTP_PORT ?? '587')

  if (!host || !Number.isFinite(port)) {
    throw new MailerError('smtp transport is not configured', { code: 'config', driver: DRIVER })
  }

  // Heuristic: port 465 implies TLS-on-connect; everything else negotiates STARTTLS.
  // Override via SMTP_SECURE=true|false if the relay doesn't follow that convention.
  const secureEnv = process.env.SMTP_SECURE
  const secure = secureEnv ? secureEnv === 'true' : port === 465

  const user = process.env.SMTP_USER || undefined
  const password = process.env.SMTP_PASSWORD || undefined

  return { host, port, secure, user, password }
}

function readConfig(): SmtpConfig {
  const transportCfg = readTransportConfig()
  const to   = process.env.CONTACT_NOTIFICATION_TO?.trim() ?? ''
  const from = getContactFrom()

  if (!to || !from) {
    throw new MailerError('smtp contact mailer is not configured', { code: 'config', driver: DRIVER })
  }

  return { ...transportCfg, to, from }
}

let cachedTransport: Transporter | null = null
let cachedKey = ''

function getTransport(cfg: SmtpTransportConfig): Transporter {
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

function mapSmtpError(err: unknown): MailerError {
  // nodemailer surfaces ECONN* / EAUTH / EENVELOPE etc.; bucket them
  // into the two outcomes callers care about (network vs provider).
  const code = (err as { code?: string })?.code ?? ''
  const bucket = /^E(CONN|TIMEDOUT|DNS|REFUSED|HOSTUNREACH)/.test(code)
    ? 'network'
    : 'provider'
  return new MailerError(
    `smtp send failed: ${code || (err instanceof Error ? err.message : String(err))}`,
    {
      code: bucket,
      driver: DRIVER,
      cause: err,
    },
  )
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
        replyTo: sanitizeEmailHeaderValue(msg.email),
        subject: buildContactAdminSubject(msg.name),
        text:    buildContactAdminText(msg),
        html:    buildContactAdminHtml(msg),
      })
    } catch (err) {
      throw mapSmtpError(err)
    }
  },
  async sendEmail(msg: TransactionalEmail) {
    const cfg = readTransportConfig()
    const from = msg.from?.trim() || getContactFrom()
    if (!from) {
      throw new MailerError('smtp transactional email missing From address', {
        code: 'config',
        driver: DRIVER,
      })
    }
    const transport = getTransport(cfg)

    try {
      await transport.sendMail({
        from,
        to:      msg.to,
        replyTo: msg.replyTo,
        subject: msg.subject,
        text:    msg.text,
        html:    msg.html,
        ...(msg.headers && Object.keys(msg.headers).length > 0
          ? { headers: msg.headers }
          : {}),
      })
    } catch (err) {
      throw mapSmtpError(err)
    }
  },
}
