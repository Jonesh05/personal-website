// frontend/src/lib/rateLimit.ts
// Lightweight, zero-dependency rate limiter for public API routes.
//
// Design notes
// ------------
// • Fixed-window counter keyed by (route + client identifier). Simpler than
//   a token bucket and good enough to bound abuse on a personal-scale site.
// • In-memory Map storage. On Vercel serverless, state is per warm instance,
//   so a determined attacker could rotate across instances — accepted for
//   Phase 1. Swap this module for Upstash/Redis when cross-instance
//   consistency is required; route handlers do not need to change.
// • Server-only. Never import from client code.

import 'server-only'

export interface RateLimitResult {
  /** True when the request is within the configured budget. */
  allowed: boolean
  /** Max requests in the current window. */
  limit: number
  /** Remaining budget after this request (clamped to ≥ 0). */
  remaining: number
  /** Wall-clock ms when the current window resets. */
  resetAt: number
}

export interface RateLimitOptions {
  /** Max allowed requests per window. Must be ≥ 1. */
  limit: number
  /** Window size in milliseconds. Must be > 0. */
  windowMs: number
}

interface Bucket {
  count: number
  resetAt: number
}

// Module-scoped store. Keys are short, values are tiny structs, so the map
// stays compact even under burst traffic.
const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000

/**
 * Lazy GC: we only walk the map once it has crossed the soft cap. Amortized
 * cost is ~O(1) per request while keeping memory bounded.
 */
function pruneExpired(now: number): void {
  if (buckets.size < MAX_BUCKETS) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now()
  pruneExpired(now)

  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    const next: Bucket = { count: 1, resetAt: now + options.windowMs }
    buckets.set(key, next)
    return {
      allowed: true,
      limit: options.limit,
      remaining: Math.max(0, options.limit - 1),
      resetAt: next.resetAt,
    }
  }

  existing.count += 1
  const allowed = existing.count <= options.limit
  return {
    allowed,
    limit: options.limit,
    remaining: Math.max(0, options.limit - existing.count),
    resetAt: existing.resetAt,
  }
}

/**
 * Standard response headers for an allowed or throttled request. Mirrors the
 * `X-RateLimit-*` conventions the Next.js ecosystem expects.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit':     String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset':     String(Math.ceil(result.resetAt / 1000)),
  }
}

/**
 * Build a stable client identifier for rate-limit keys. Visitor cookies are
 * preferred because they're durable and opaque; IP is used as a fallback so
 * anonymous clients that strip the cookie still get bounded.
 */
export function getRateLimitClientKey(params: {
  visitorId?: string | null
  request: Request
}): string {
  if (params.visitorId) return `v:${params.visitorId}`

  const forwarded = params.request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return `ip:${first}`
  }

  const realIp = params.request.headers.get('x-real-ip')
  if (realIp) return `ip:${realIp}`

  return 'ip:unknown'
}

// ---------------------------------------------------------------------------
// Policy presets
// ---------------------------------------------------------------------------

/**
 * Default budget for public write/read endpoints (likes, views, saves, /me).
 * Overridable via env so ops can tighten without a redeploy.
 */
export const DEFAULT_PUBLIC_LIMIT: RateLimitOptions = {
  limit: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 60,
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
}

/**
 * Stricter budget for authentication endpoints. Login is expensive on the
 * Admin SDK and is the highest-value target for brute force, so we throttle
 * hard regardless of the public defaults above.
 */
export const AUTH_LIMIT: RateLimitOptions = {
  limit: 10,
  windowMs: 60_000,
}
