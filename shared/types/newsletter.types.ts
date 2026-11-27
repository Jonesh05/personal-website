import type { NewsletterSource, SubscriberStatus } from '../schemas/newsletter.schema'

// Lead lifecycle. PostgreSQL (Prisma) owns the true subscriber state
// (pending, active, unsubscribed, tags, magicToken). Our Firestore row is an
// internal funnel audit signal:
//
//   pending  request persisted in Firestore audit log.
//   synced   successfully upserted into PostgreSQL via Prisma.
//   failed   database/provider delivery failed after Firestore persistence.
export type NewsletterLeadStatus = 'pending' | 'synced' | 'failed'

export interface NewsletterLead {
  emailHash: string
  email: string
  source: NewsletterSource
  tags: string[]
  status: NewsletterLeadStatus
  createdAt: string
  updatedAt: string
}

export interface SubscriberPreferencesDTO {
  email: string
  status: SubscriberStatus
  tags: string[]
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
