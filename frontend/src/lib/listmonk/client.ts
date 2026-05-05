// frontend/src/lib/listmonk/client.ts
// Thin HTTP client for a self-hosted listmonk instance. We don't pull in an
// SDK; listmonk's admin API is small enough that a typed fetch wrapper is
// cheaper and keeps the serverless bundle lean.
//
// Env
// ---
// LISTMONK_URL            base URL, no trailing slash (e.g. https://lists.example.com)
// LISTMONK_API_USER       admin API user
// LISTMONK_API_TOKEN      admin API token (Basic auth password)
// LISTMONK_LIST_ID        numeric id of the target list

import 'server-only'

export class ListmonkError extends Error {
  readonly status: number
  readonly code: 'config' | 'http' | 'network' | 'unknown'
  readonly cause?: unknown

  constructor(
    message: string,
    opts: { status?: number; code: ListmonkError['code']; cause?: unknown },
  ) {
    super(message)
    this.name = 'ListmonkError'
    this.status = opts.status ?? 0
    this.code = opts.code
    this.cause = opts.cause
  }
}

export interface ListmonkSubscribeResult {
  id: number
  status: 'enabled' | 'unconfirmed'
  alreadySubscribed: boolean
}

interface ListmonkConfig {
  baseUrl: string
  authHeader: string
  listId: number
}

function readConfig(): ListmonkConfig {
  const baseUrl = process.env.LISTMONK_URL?.replace(/\/$/, '') ?? ''
  const user    = process.env.LISTMONK_API_USER ?? ''
  const token   = process.env.LISTMONK_API_TOKEN ?? ''
  const listId  = Number(process.env.LISTMONK_LIST_ID ?? '')

  if (!baseUrl || !user || !token || !Number.isFinite(listId) || listId <= 0) {
    throw new ListmonkError('listmonk is not configured', { code: 'config' })
  }

  const authHeader = `Basic ${Buffer.from(`${user}:${token}`).toString('base64')}`
  return { baseUrl, authHeader, listId }
}

interface ListmonkApiEnvelope<T> {
  data: T
}

interface ListmonkSubscriber {
  id: number
  email: string
  status: 'enabled' | 'disabled' | 'blocklisted'
}

async function listmonkFetch<T>(
  cfg: ListmonkConfig,
  path: string,
  init: RequestInit,
): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${cfg.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type':  'application/json',
        'Accept':        'application/json',
        'Authorization': cfg.authHeader,
        ...(init.headers ?? {}),
      },
      cache: 'no-store',
    })
  } catch (err) {
    throw new ListmonkError('listmonk request failed', {
      code: 'network',
      cause: err,
    })
  }

  const text = await res.text()
  let body: unknown = undefined
  if (text) {
    try { body = JSON.parse(text) } catch { body = text }
  }

  if (!res.ok) {
    const message = extractErrorMessage(body) ?? `listmonk HTTP ${res.status}`
    throw new ListmonkError(message, {
      status: res.status,
      code: 'http',
      cause: body,
    })
  }

  return (body as ListmonkApiEnvelope<T>).data
}

function extractErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const m = (body as { message?: unknown }).message
  return typeof m === 'string' ? m : null
}

/**
 * Subscribe an email to the configured list. Idempotent: if the subscriber
 * already exists, we look them up and return their record instead of failing.
 *
 * Double opt-in is controlled on the listmonk list itself. When the list is
 * marked double opt-in, listmonk returns status `unconfirmed` and sends the
 * confirmation email automatically; we don't have to orchestrate it.
 */
export async function subscribe(
  email: string,
  source: string,
): Promise<ListmonkSubscribeResult> {
  const cfg = readConfig()

  try {
    const sub = await listmonkFetch<ListmonkSubscriber>(cfg, '/api/subscribers', {
      method: 'POST',
      body: JSON.stringify({
        email,
        name: email,
        lists: [cfg.listId],
        status: 'enabled',
        preconfirm_subscriptions: false,
        attribs: { source },
      }),
    })
    return {
      id: sub.id,
      status: sub.status === 'enabled' ? 'enabled' : 'unconfirmed',
      alreadySubscribed: false,
    }
  } catch (err) {
    if (err instanceof ListmonkError && err.status === 409) {
      const existing = await findSubscriberByEmail(cfg, email)
      if (existing) {
        return {
          id: existing.id,
          status: existing.status === 'enabled' ? 'enabled' : 'unconfirmed',
          alreadySubscribed: true,
        }
      }
    }
    throw err
  }
}

interface ListmonkSubscriberQuery {
  results: ListmonkSubscriber[]
}

async function findSubscriberByEmail(
  cfg: ListmonkConfig,
  email: string,
): Promise<ListmonkSubscriber | null> {
  const query = encodeURIComponent(`subscribers.email = '${email.replace(/'/g, "''")}'`)
  const data = await listmonkFetch<ListmonkSubscriberQuery>(
    cfg,
    `/api/subscribers?query=${query}&per_page=1`,
    { method: 'GET' },
  )
  return data.results[0] ?? null
}
