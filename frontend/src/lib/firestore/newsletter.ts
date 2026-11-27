// frontend/src/lib/firestore/newsletter.ts
// Server-only repository for newsletter-lead audit tracking. PostgreSQL (Prisma)
// is the primary source of truth for subscribers and segmentation; this
// collection is our internal funnel audit log so we capture raw submissions
// with SHA-256 deduplication.

import 'server-only'
import { createHash } from 'crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import type { NewsletterLeadStatus } from '@personal-website/shared/types/newsletter.types'
import type { NewsletterSource } from '@personal-website/shared/schemas/newsletter.schema'

const COLLECTION = 'newsletter_leads'

export function hashEmail(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
}

export interface CreateLeadInput {
  email:  string
  source: NewsletterSource
  tags?:  string[]
}

/**
 * Upsert a lead in `pending` state. We use the email hash as the id so repeat
 * submissions from the same address update the existing record rather than
 * creating duplicates.
 */
export async function createLead(input: CreateLeadInput): Promise<{ id: string }> {
  const emailHash = hashEmail(input.email)
  const now = FieldValue.serverTimestamp()

  await adminDb
    .collection(COLLECTION)
    .doc(emailHash)
    .set(
      {
        emailHash,
        email:     input.email,
        source:    input.source,
        tags:      input.tags ?? ['web3'],
        status:    'pending' satisfies NewsletterLeadStatus,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true },
    )

  return { id: emailHash }
}

export async function updateLeadStatus(
  id: string,
  status: NewsletterLeadStatus,
): Promise<void> {
  await adminDb
    .collection(COLLECTION)
    .doc(id)
    .set(
      {
        status,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
}
