// frontend/src/domain/newsletter/broadcast.ts
// Pure domain types, invariants, and sanitization helpers for newsletter post
// broadcasts. Zero framework, database, or transport imports.

export type BroadcastStatus =
  | 'sent'
  | 'partial'
  | 'already_sent'
  | 'skipped'
  | 'failed'

export interface PostBroadcastInput {
  postId: string
  title: string
  slug: string
  excerpt: string
  tags: string[]
  readTimeMinutes?: number
  /** Bypass the per-post idempotency lock only when explicitly requested. */
  force?: boolean
}

export interface BroadcastResult {
  status: BroadcastStatus
  matchedSubscribers: number
  sentCount: number
  failedCount: number
  skippedReason?: string
  errors: string[]
}

const MAX_SUBJECT_LENGTH = 160
const RESEND_BATCH_MAX = 75
const RESEND_BATCH_MIN = 1

/**
 * Strips CR/LF and ASCII control characters to prevent SMTP/MIME header
 * injection and clamps subject length to a safe RFC 5322 ceiling.
 */
export function sanitizeEmailSubject(raw: string): string {
  const cleaned = raw
    .replace(/[\r\n\t\x00-\x1F\x7F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (cleaned.length <= MAX_SUBJECT_LENGTH) return cleaned
  return `${cleaned.slice(0, MAX_SUBJECT_LENGTH - 1).trimEnd()}…`
}

/**
 * Normalizes and deduplicates tag strings for deterministic matching.
 */
export function normalizeTags(tags: readonly string[]): string[] {
  return Array.from(
    new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean)),
  )
}

/**
 * Builds a canonical article URL with an encoded slug segment.
 */
export function buildPostUrl(baseUrl: string, slug: string): string {
  const cleanOrigin = baseUrl.replace(/\/+$/, '')
  const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, '')
  return `${cleanOrigin}/blog/${encodeURIComponent(cleanSlug)}`
}

/**
 * Builds the subscriber's passwordless preference-center URL.
 */
export function buildPreferencesUrl(baseUrl: string, magicToken: string): string {
  const cleanOrigin = baseUrl.replace(/\/+$/, '')
  return `${cleanOrigin}/preferences?token=${encodeURIComponent(magicToken)}`
}

/**
 * Builds the RFC 8058 one-click unsubscribe URL.
 */
export function buildUnsubscribeUrl(baseUrl: string, magicToken: string): string {
  return `${buildPreferencesUrl(baseUrl, magicToken)}&action=unsubscribe`
}

/**
 * Deterministic Resend Idempotency-Key per post & batch (max 256 chars).
 */
export function buildBatchIdempotencyKey(
  postId: string,
  batchIndex: number,
): string {
  const safeId = postId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128) || 'post'
  return `post-broadcast:${safeId}:b${batchIndex}`
}

/**
 * Splits a list into bounded chunks suitable for Resend's batch API.
 */
export function chunkArray<T>(
  items: readonly T[],
  size = RESEND_BATCH_MAX,
): T[][] {
  const safeSize = Math.max(RESEND_BATCH_MIN, Math.min(100, Math.floor(size)))
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += safeSize) {
    chunks.push(items.slice(i, i + safeSize))
  }
  return chunks
}
