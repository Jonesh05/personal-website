// frontend/src/lib/mailer/index.ts
// Single entry point for outbound transactional mail. Route handlers import
// from `@/lib/mailer` only  never from the concrete driver  so we can
// swap transports without touching application code.
//
// Driver selection
// ----------------
// MAILER_DRIVER=smtp     (default)  uses nodemailer against any SMTP relay
// MAILER_DRIVER=resend              uses the Resend HTTP API
//
// Newsletter delivery (campaigns, segmentation, preference center) is owned by
// our Prisma + Resend Execution Layer (`infra/mailer-worker` and `/api/subscribe`).
// This module is for our contact-form notification channel.

import 'server-only'
import type { ContactNotification, Mailer, TransactionalEmail } from './types'
import { MailerError } from './types'
import { smtpMailer } from './smtp'
import { resendMailer } from './resend'

export type { ContactNotification, Mailer, TransactionalEmail } from './types'
export { MailerError } from './types'

type DriverName = 'smtp' | 'resend'

function pickDriver(): DriverName {
  const explicit = process.env.MAILER_DRIVER?.trim().toLowerCase()
  if (explicit === 'resend') return 'resend'
  if (explicit === 'smtp') return 'smtp'
  // Auto-detect when MAILER_DRIVER is unset: prefer explicit SMTP relay, else Resend.
  if (process.env.SMTP_HOST?.trim()) return 'smtp'
  if (process.env.RESEND_API_KEY?.trim()) return 'resend'
  return 'smtp'
}

let cached: { driver: DriverName; mailer: Mailer } | null = null

export function getMailer(): Mailer {
  const driver = pickDriver()
  if (cached && cached.driver === driver) return cached.mailer
  const mailer = driver === 'resend' ? resendMailer : smtpMailer
  cached = { driver, mailer }
  return mailer
}

/**
 * Convenience wrapper preserved for callers that already imported a function
 * from `@/lib/mailer/resend`. New code should call `getMailer()` directly.
 */
export async function sendContactNotification(msg: ContactNotification): Promise<void> {
  await getMailer().sendContactNotification(msg)
}

/**
 * Transport-agnostic transactional email helper (uses SMTP or Resend via `getMailer()`).
 */
export async function sendTransactionalEmail(msg: TransactionalEmail): Promise<void> {
  await getMailer().sendEmail(msg)
}
