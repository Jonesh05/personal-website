import { NextRequest, NextResponse } from 'next/server'
import { getPostById } from '@/lib/firestore/posts'
import { toggleLike, mirrorLike } from '@/lib/firestore/interactions'
import { getVisitorId } from '@/lib/visitor'
import {
  checkRateLimit,
  DEFAULT_PUBLIC_LIMIT,
  getRateLimitClientKey,
  rateLimitHeaders,
} from '@/lib/rateLimit'

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const visitorId = await getVisitorId()
    if (!visitorId) {
      return NextResponse.json({ error: 'Visitor identity missing' }, { status: 400 })
    }

    const clientKey = getRateLimitClientKey({ visitorId, request })
    const rl = checkRateLimit(`posts:like:${clientKey}`, DEFAULT_PUBLIC_LIMIT)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            ...rateLimitHeaders(rl),
            'Retry-After': String(Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))),
          },
        },
      )
    }

    const existing = await getPostById(id)
    if (!existing) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    const result = await toggleLike(id, visitorId)
    // Fire-and-forget mirror so visitors/{id}/likes stays in sync for hydration
    mirrorLike(id, visitorId, result.liked).catch(() => {})

    return NextResponse.json(
      { success: true, ...result },
      { headers: rateLimitHeaders(rl) },
    )
  } catch (error) {
    console.error('[api/posts/[id]/like]', error)
    return NextResponse.json({ error: 'Failed to process like' }, { status: 500 })
  }
}
