// frontend/src/app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPosts } from '@/lib/firestore/posts'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limitParam = parseInt(searchParams.get('limit') ?? '10', 10)
    const offsetParam = parseInt(searchParams.get('offset') ?? '0', 10)
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 10
    const offset = Number.isFinite(offsetParam) ? Math.max(offsetParam, 0) : 0
    const tag    = searchParams.get('tag')    ?? undefined
    const search = searchParams.get('search') ?? undefined

    // Fetch the filtered collection, then apply offset pagination in-memory.
    // This keeps a stable API contract while preserving current search behavior.
    const posts = await getPosts({ published: true, tag })

    const filtered = search
      ? posts.filter(p =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.excerpt?.toLowerCase().includes(search.toLowerCase())
        )
      : posts

    const paginatedPosts = filtered.slice(offset, offset + limit)
    const total = filtered.length
    const hasNext = offset + paginatedPosts.length < total

    return NextResponse.json({
      posts: paginatedPosts,
      total,
      pagination: {
        limit,
        offset,
        hasNext,
      },
    })
  } catch (err) {
    console.error('[api/posts]', err)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}
