import { NextRequest, NextResponse } from 'next/server'
import { getVisitorId } from '@/lib/visitor'
import { listLikedPostIds, listSavedPosts } from '@/lib/firestore/interactions'
import {
  checkRateLimit,
  DEFAULT_PUBLIC_LIMIT,
  getRateLimitClientKey,
  rateLimitHeaders,
} from '@/lib/rateLimit'

export async function GET(request: NextRequest) {
  const visitorId = await getVisitorId()

  const clientKey = getRateLimitClientKey({ visitorId, request })
  const rl = checkRateLimit(`me:${clientKey}`, DEFAULT_PUBLIC_LIMIT)
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

  if (!visitorId) {
    return NextResponse.json(
      {
        visitorId: null,
        likedPostIds: [],
        savedPosts: [],
      },
      { headers: rateLimitHeaders(rl) },
    )
  }

  const [likedPostIds, savedPosts] = await Promise.all([
    listLikedPostIds(visitorId).catch(() => []),
    listSavedPosts(visitorId).catch(() => []),
  ])

  return NextResponse.json(
    {
      visitorId,
      likedPostIds,
      savedPosts,
    },
    { headers: rateLimitHeaders(rl) },
  )
}
