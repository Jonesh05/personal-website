import 'server-only'
import { cookies } from 'next/headers'

export const VISITOR_COOKIE_NAME = 'visitor-id'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Read the visitor identifier issued by middleware. Returns `null` if absent or
 * malformed. API routes should treat `null` as "no visitor" (reject the write
 * or skip dedup, never invent an identifier server-side).
 */
export async function getVisitorId(): Promise<string | null> {
  const store = await cookies()
  const raw = store.get(VISITOR_COOKIE_NAME)?.value
  if (!raw || !UUID_RE.test(raw)) return null
  return raw
}
