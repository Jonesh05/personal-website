// frontend/src/lib/mailer/types.ts
// Transport-agnostic mailer contract. The API routes only know this
// surface; swapping SMTP → Resend → SES is a one-file change.

export interface ContactNotification {
  id:      string
  name:    string
  email:   string
  message: string
}

export interface Mailer {
  /** Stable transport tag used for log lines and Firestore breadcrumbs. */
  readonly driver: string
  /**
   * Deliver a contact-form notification to the admin inbox.
   * Implementations must throw `MailerError` on any failure so callers can
   * mark the Firestore record `failed` and return a stable user response.
   */
  sendContactNotification(msg: ContactNotification): Promise<void>
}

export class MailerError extends Error {
  readonly code: 'config' | 'provider' | 'network'
  readonly driver: string
  readonly cause?: unknown

  constructor(
    message: string,
    opts: { code: MailerError['code']; driver: string; cause?: unknown },
  ) {
    super(message)
    this.name = 'MailerError'
    this.code = opts.code
    this.driver = opts.driver
    this.cause = opts.cause
  }
}
