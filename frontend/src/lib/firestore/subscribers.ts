// frontend/src/lib/firestore/subscribers.ts
// Server-only Firestore repository for newsletter subscribers.
//
// Firebase Spark (free-tier) budget guarantees:
// - Deterministic doc ID (`sha256(normalizedEmail)`) => 1 point-read + 1 write
//   per subscription upsert, zero duplicate accounts, zero full-collection scans.
// - Single-field indexed lookup by `magicToken` with `.limit(1)` => max 1 read
//   per Preference Center request.
// - No secondary fan-out audit collections written on every request.

import 'server-only'
import { createHash, randomUUID } from 'crypto'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import type {
  NewsletterSource,
  SubscriberStatus,
} from '@personal-website/shared/schemas/newsletter.schema'

const COLLECTION = 'newsletter_subscribers'

export type SubscriberLocale = 'en' | 'es'

export interface SubscriberRecord {
  id:         string
  email:      string
  status:     SubscriberStatus
  tags:       string[]
  magicToken: string
  source:     NewsletterSource
  locale:     SubscriberLocale
  createdAt:  Date
  updatedAt:  Date
}

export interface UpsertSubscriberInput {
  email:   string
  tags:    string[]
  source:  NewsletterSource
  locale?: SubscriberLocale
}

export interface UpsertSubscriberResult {
  subscriber:     SubscriberRecord
  isNew:          boolean
  wasReactivated: boolean
}

export interface UpdatePreferencesInput {
  email?:  string
  status?: 'active' | 'unsubscribed'
  tags?:   string[]
}

export class SubscriberConflictError extends Error {
  constructor(message = 'Email is already registered to another subscriber') {
    super(message)
    this.name = 'SubscriberConflictError'
  }
}

export function hashSubscriberEmail(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
}

function toDate(value: unknown, fallback: Date): Date {
  if (value instanceof Timestamp) return value.toDate()
  if (value instanceof Date) return value
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return fallback
}

function parseDoc(id: string, data: FirebaseFirestore.DocumentData): SubscriberRecord {
  const now = new Date()
  const rawStatus = data.status
  const status: SubscriberStatus =
    rawStatus === 'pending' || rawStatus === 'active' || rawStatus === 'unsubscribed'
      ? rawStatus
      : 'active'

  const rawSource = data.source
  const source: NewsletterSource =
    rawSource === 'blog-sidebar' || rawSource === 'footer' || rawSource === 'other'
      ? rawSource
      : 'blog-sidebar'

  const tags = Array.isArray(data.tags)
    ? data.tags.filter((t): t is string => typeof t === 'string')
    : ['web3']

  const locale: SubscriberLocale = data.locale === 'es' ? 'es' : 'en'

  return {
    id,
    email:      typeof data.email === 'string' ? data.email : '',
    status,
    tags,
    magicToken: typeof data.magicToken === 'string' ? data.magicToken : '',
    source,
    locale,
    createdAt:  toDate(data.createdAt, now),
    updatedAt:  toDate(data.updatedAt, now),
  }
}

/**
 * Idempotent upsert of a newsletter subscriber in a single Firestore transaction.
 * Spark cost: 1 read + 1 write.
 */
export async function upsertSubscriber(
  input: UpsertSubscriberInput,
): Promise<UpsertSubscriberResult> {
  const normalizedEmail = input.email.trim().toLowerCase()
  const docId = hashSubscriberEmail(normalizedEmail)
  const docRef = adminDb.collection(COLLECTION).doc(docId)
  const incomingTags = Array.from(
    new Set(input.tags.length > 0 ? input.tags : ['web3']),
  )

  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(docRef)
    const nowDate = new Date()
    const serverNow = FieldValue.serverTimestamp()

    if (snap.exists) {
      const existing = parseDoc(snap.id, snap.data() ?? {})
      const mergedTags = Array.from(new Set([...existing.tags, ...incomingTags]))
      const magicToken = existing.magicToken || randomUUID()
      const wasReactivated = existing.status === 'unsubscribed'
      const nextLocale: SubscriberLocale = input.locale ?? existing.locale

      tx.set(
        docRef,
        {
          email:     normalizedEmail,
          status:    'active' satisfies SubscriberStatus,
          tags:      mergedTags,
          magicToken,
          source:    input.source,
          locale:    nextLocale,
          updatedAt: serverNow,
        },
        { merge: true },
      )

      return {
        isNew: false,
        wasReactivated,
        subscriber: {
          id:        docId,
          email:     normalizedEmail,
          status:    'active',
          tags:      mergedTags,
          magicToken,
          source:    input.source,
          locale:    nextLocale,
          createdAt: existing.createdAt,
          updatedAt: nowDate,
        },
      }
    }

    const magicToken = randomUUID()
    const nextLocale: SubscriberLocale = input.locale ?? 'en'
    tx.set(docRef, {
      email:     normalizedEmail,
      status:    'active' satisfies SubscriberStatus,
      tags:      incomingTags,
      magicToken,
      source:    input.source,
      locale:    nextLocale,
      createdAt: serverNow,
      updatedAt: serverNow,
    })

    return {
      isNew: true,
      wasReactivated: false,
      subscriber: {
        id:        docId,
        email:     normalizedEmail,
        status:    'active',
        tags:      incomingTags,
        magicToken,
        source:    input.source,
        locale:    nextLocale,
        createdAt: nowDate,
        updatedAt: nowDate,
      },
    }
  })
}

/**
 * Look up a subscriber by cryptographic UUIDv4 `magicToken`.
 * Spark cost: at most 1 read (single-field auto-indexed query with limit(1)).
 */
export async function getSubscriberByMagicToken(
  token: string,
): Promise<SubscriberRecord | null> {
  const snap = await adminDb
    .collection(COLLECTION)
    .where('magicToken', '==', token)
    .limit(1)
    .get()

  if (snap.empty) return null
  const doc = snap.docs[0]
  return parseDoc(doc.id, doc.data())
}

/**
 * Update a subscriber's preferences authenticated by `magicToken`.
 * If the email address changes, migrates the document atomically to the new
 * deterministic `sha256(email)` doc ID and rejects collisions with
 * `SubscriberConflictError`.
 */
export async function updateSubscriberByMagicToken(
  token: string,
  updates: UpdatePreferencesInput,
): Promise<SubscriberRecord | null> {
  const found = await getSubscriberByMagicToken(token)
  if (!found) return null

  const normalizedNextEmail = updates.email
    ? updates.email.trim().toLowerCase()
    : found.email
  const nextStatus: SubscriberStatus = updates.status ?? found.status
  const nextTags = updates.tags
    ? Array.from(new Set(updates.tags))
    : found.tags
  const nowDate = new Date()

  if (normalizedNextEmail === found.email) {
    const docRef = adminDb.collection(COLLECTION).doc(found.id)
    await docRef.set(
      {
        status:    nextStatus,
        tags:      nextTags,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    return {
      ...found,
      status:    nextStatus,
      tags:      nextTags,
      updatedAt: nowDate,
    }
  }

  const oldRef = adminDb.collection(COLLECTION).doc(found.id)
  const newId = hashSubscriberEmail(normalizedNextEmail)
  const newRef = adminDb.collection(COLLECTION).doc(newId)

  await adminDb.runTransaction(async (tx) => {
    const targetSnap = await tx.get(newRef)
    if (targetSnap.exists) {
      throw new SubscriberConflictError()
    }

    tx.set(newRef, {
      email:      normalizedNextEmail,
      status:     nextStatus,
      tags:       nextTags,
      magicToken: found.magicToken,
      source:     found.source,
      locale:     found.locale,
      createdAt:  Timestamp.fromDate(found.createdAt),
      updatedAt:  FieldValue.serverTimestamp(),
    })
    tx.delete(oldRef)
  })

  return {
    ...found,
    id:        newId,
    email:     normalizedNextEmail,
    status:    nextStatus,
    tags:      nextTags,
    updatedAt: nowDate,
  }
}

/**
 * List active subscribers.
 *
 * - `audienceMode = 'all'` (default): returns all active subscribers so new posts
 *   on emerging topics never silently match 0 readers.
 * - `audienceMode = 'matching-tags'`: filters to subscribers sharing at least one
 *   tag with `tags` (or all active subscribers when `tags` is empty).
 *
 * Uses a single-field equality query on `status == 'active'` (auto-indexed,
 * no composite index required) with a hard upper bound to protect Spark quotas.
 */
export async function listActiveSubscribersByTags(
  tags: readonly string[],
  maxSubscribers = 500,
  audienceMode: 'all' | 'matching-tags' = 'all',
): Promise<SubscriberRecord[]> {
  const snap = await adminDb
    .collection(COLLECTION)
    .where('status', '==', 'active')
    .limit(maxSubscribers)
    .get()

  const normalizedFilter = new Set(
    tags.map(t => t.trim().toLowerCase()).filter(Boolean),
  )

  const results: SubscriberRecord[] = []
  for (const doc of snap.docs) {
    const record = parseDoc(doc.id, doc.data())
    if (!record.email) continue
    if (
      audienceMode === 'all' ||
      normalizedFilter.size === 0 ||
      record.tags.some(t => normalizedFilter.has(t.toLowerCase()))
    ) {
      results.push(record)
    }
  }
  return results
}

export interface SubscriberTelemetrySummary {
  active:       number
  unsubscribed: number
  total:        number
  tagCounts:    Record<string, number>
}

/**
 * Admin-only bounded telemetry read over `newsletter_subscribers` using
 * field projection (`select('status', 'tags')`) to minimize bandwidth & Spark reads.
 */
export async function readSubscriberTelemetry(
  knownTags: readonly string[],
  maxDocs = 500,
): Promise<SubscriberTelemetrySummary> {
  const tagCounts: Record<string, number> = {}
  for (const tag of knownTags) {
    tagCounts[tag] = 0
  }

  const snap = await adminDb
    .collection(COLLECTION)
    .select('status', 'tags')
    .limit(maxDocs)
    .get()

  let active = 0
  let unsubscribed = 0

  for (const doc of snap.docs) {
    const data = doc.data()
    if (data.status === 'active') {
      active += 1
      if (Array.isArray(data.tags)) {
        for (const t of data.tags) {
          if (typeof t === 'string') {
            tagCounts[t] = (tagCounts[t] ?? 0) + 1
          }
        }
      }
    } else if (data.status === 'unsubscribed') {
      unsubscribed += 1
    }
  }

  return {
    active,
    unsubscribed,
    total: snap.size,
    tagCounts,
  }
}
