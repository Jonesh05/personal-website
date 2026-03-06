// frontend/src/app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPosts } from '@/lib/firestore/posts'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit  = parseInt(searchParams.get('limit')  ?? '10')
    const tag    = searchParams.get('tag')    ?? undefined
    const search = searchParams.get('search') ?? undefined

    const posts = await getPosts({ published: true, limit, tag })

    const filtered = search
      ? posts.filter(p =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.excerpt?.toLowerCase().includes(search.toLowerCase())
        )
      : posts

    return NextResponse.json({
      posts: filtered,
      total: filtered.length,
      pagination: {
        limit,
        offset: parseInt(searchParams.get('offset') ?? '0'),
        hasNext: false, // Simple implementation — all returned in one page for now
      },
    })
  } catch (err) {
    console.error('[api/posts]', err)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}
