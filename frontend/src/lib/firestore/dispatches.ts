// frontend/src/lib/firestore/dispatches.ts
// Infrastructure repository for idempotent newsletter broadcast locks in
// Firestore (`newsletter_dispatches/{postId}`).
//
// Firebase Spark (free-tier) guarantees:
// - Uses atomic `create()` so acquiring a lock costs 1 write and 0 extra reads.
// - Prevents duplicate broadcasts on post edits or network retries.

import 'server-only'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import type { BroadcastStatus } from '@/domain/newsletter/broadcast'

const COLLECTION = 'newsletter_dispatches'

export interface BroadcastDispatchSummary {
  status: BroadcastStatus
  matchedSubscribers: number
  sentCount: number
  failedCount: number
  errors: string[]
}

function isAlreadyExistsError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const record = err as { code?: unknown; message?: unknown }
  return (
    record.code === 6 ||
    record.code === 'already-exists' ||
    (typeof record.message === 'string' &&
      record.message.toUpperCase().includes('ALREADY_EXISTS'))
  )
}

/**
 * Atomically claims the dispatch lock for `postId`.
 * Returns `true` if the lock was acquired, or `false` if this post was
 * already dispatched (or is currently being dispatched).
 */
export async function acquireBroadcastLock(
  postId: string,
  meta: { slug: string; title: string },
): Promise<boolean> {
  const docRef = adminDb.collection(COLLECTION).doc(postId)
  try {
    await docRef.create({
      postId,
      slug:               meta.slug,
      title:              meta.title,
      status:             'in_progress',
      matchedSubscribers: 0,
      sentCount:          0,
      failedCount:        0,
      errors:             [],
      startedAt:          FieldValue.serverTimestamp(),
      completedAt:        null,
    })
    return true
  } catch (err) {
    if (isAlreadyExistsError(err)) {
      return false
    }
    throw err
  }
}

/**
 * Records the final outcome of a broadcast for admin observability.
 */
export async function finalizeBroadcastLock(
  postId: string,
  summary: BroadcastDispatchSummary,
): Promise<void> {
  const docRef = adminDb.collection(COLLECTION).doc(postId)
  await docRef.set(
    {
      status:             summary.status,
      matchedSubscribers: summary.matchedSubscribers,
      sentCount:          summary.sentCount,
      failedCount:        summary.failedCount,
      errors:             summary.errors.slice(0, 10),
      completedAt:        FieldValue.serverTimestamp(),
    },
    { merge: true },
  )
}

/**
 * Releases the lock when a dispatch aborted before sending any email,
 * allowing a safe retry once the underlying issue is resolved.
 */
export async function releaseBroadcastLock(postId: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(postId).delete()
}
