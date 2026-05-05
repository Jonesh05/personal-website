import type { NewsletterSource } from '../schemas/newsletter.schema'

// Lead lifecycle. listmonk owns the true subscriber state (confirmation,
// unsubscribe, bounce). Our Firestore row is an internal funnel signal only:
//
//   pending — request persisted. This covers both "not yet sent to listmonk"
//             and "sent to listmonk, awaiting the user's opt-in click" — we
//             intentionally do NOT promote to `confirmed` based on listmonk's
//             synchronous ACK, because that ACK is not a user confirmation.
//   failed  — provider delivery failed after persistence. Internal-only.
export type NewsletterLeadStatus = 'pending' | 'failed'

// Keep this record intentionally lean. listmonk is the source of truth for
// subscriber data; Firestore is the raw submission log. Do not accrete
// profile fields here — if it's not needed for funnel analytics, it belongs
// in listmonk (or nowhere).
export interface NewsletterLead {
  emailHash: string
  email: string
  source: NewsletterSource
  status: NewsletterLeadStatus
  createdAt: string
  updatedAt: string
}

export type ContactStatus = 'received' | 'delivered' | 'failed' | 'handled'

export interface ContactMessage {
  id: string
  name: string
  email: string
  message: string
  status: ContactStatus
  source: string
  read: boolean
  createdAt: string
  updatedAt: string
}
