// frontend/src/lib/firestore/newsletter_events.ts
// Append-only event log for the newsletter funnel. Used for internal
// analytics ("how many subscribe attempts last week", "preference changes",
// etc.) without storing any extra PII beyond the emailHash we already keep
// on `newsletter_leads`.

import 'server-only'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import type { NewsletterSource } from '@personal-website/shared/schemas/newsletter.schema'

const COLLECTION = 'newsletter_events'

export type NewsletterEventType =
  | 'subscribe_requested'   // request hit /api/subscribe and passed validation
  | 'subscriber_synced'     // PostgreSQL (Prisma) upserted subscriber & tags
  | 'subscriber_failed'     // PostgreSQL or Resend welcome email errored
  | 'preferences_updated'   // user updated email or tags via magicToken
  | 'subscriber_unsubscribed' // user opted out via Preference Center

export interface NewsletterEventInput {
  emailHash: string
  type:      NewsletterEventType
  source:    NewsletterSource
  /** Free-form metadata. Keep small; no PII. */
  meta?:     Record<string, string | number | boolean | null>
}

/**
 * Record a single newsletter funnel event. Best-effort: the caller is
 * expected to swallow failures so the user-facing response stays stable.
 */
export async function recordEvent(input: NewsletterEventInput): Promise<void> {
  await adminDb.collection(COLLECTION).add({
    emailHash: input.emailHash,
    type:      input.type,
    source:    input.source,
    meta:      input.meta ?? null,
    createdAt: FieldValue.serverTimestamp(),
  })
}
