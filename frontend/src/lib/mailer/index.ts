// frontend/src/lib/mailer/index.ts
// Single entry point for outbound transactional mail. Route handlers import
// from `@/lib/mailer` only — never from the concrete driver — so we can
// swap transports without touching application code.
//
// Driver selection
// ----------------
// MAILER_DRIVER=smtp     (default) — uses nodemailer against any SMTP relay
// MAILER_DRIVER=resend             — uses the Resend HTTP API
//
// Newsletter delivery (campaigns, double opt-in, unsubscribes) is owned by
// listmonk and goes through its own SMTP config — see infra/listmonk.
// This module is only for our small transactional surface (contact-form
// notifications today; admin alerts tomorrow).

import 'server-only'
import type { ContactNotification, Mailer } from './types'
import { MailerError } from './types'
import { smtpMailer } from './smtp'
import { resendMailer } from './resend'

export type { ContactNotification, Mailer } from './types'
export { MailerError } from './types'

type DriverName = 'smtp' | 'resend'

function pickDriver(): DriverName {
  const raw = (process.env.MAILER_DRIVER ?? 'smtp').toLowerCase()
  if (raw === 'resend') return 'resend'
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
