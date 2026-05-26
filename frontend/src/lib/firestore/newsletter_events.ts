// frontend/src/lib/firestore/newsletter_events.ts
// Append-only event log for the newsletter funnel. Used for internal
// analytics ("how many subscribe attempts last week", "listmonk failure
// rate", etc.) without storing any extra PII beyond the emailHash we
// already keep on `newsletter_leads`.
//
// Design choices:
//   - One document per event (immutable). No updates, no upserts.
//   - The lead document id (sha256(email)) is denormalised on every event
//     so we can filter by lead without joining.
//   - Raw email is intentionally NOT stored on events; analytics only need
//     the hash.

import 'server-only'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import type { NewsletterSource } from '@personal-website/shared/schemas/newsletter.schema'

const COLLECTION = 'newsletter_events'

export type NewsletterEventType =
  | 'subscribe_requested'   // request hit /api/newsletter/subscribe and passed validation
  | 'listmonk_accepted'     // listmonk acknowledged the subscriber (still not opt-in confirmed)
  | 'listmonk_failed'       // provider call errored after persistence

export interface NewsletterEventInput {
  emailHash: string
  type:      NewsletterEventType
  source:    NewsletterSource
  /** Free-form provider metadata. Keep small; no PII. */
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
