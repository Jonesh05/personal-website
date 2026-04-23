// frontend/src/app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPosts } from '@/lib/firestore/posts'

// This route is request-driven (pagination, tag, search all come from
// querystring) and should never be statically evaluated at build time.
export const dynamic = 'force-dynamic'

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
    // Emit a structured, grep-able log so Vercel's function logs surface the
    // actual cause (malformed FIREBASE_PRIVATE_KEY, missing index, etc.)
    // instead of only the opaque digest the client sees.
    const message = err instanceof Error ? err.message : String(err)
    const code = (err as { code?: string | number } | null)?.code
    // eslint-disable-next-line no-console
    console.error(
      `[api/posts] firestore read failed${code ? ` code=${code}` : ''}: ${message}`,
    )
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}
