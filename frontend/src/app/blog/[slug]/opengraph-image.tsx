import { ImageResponse } from 'next/og'
import { getPostBySlug, type Post } from '@/lib/firestore/posts'

export const runtime = 'nodejs'
export const alt = 'Article — Jhonny Pimiento (jonesh.me)'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

function truncate(text: string, maxLength: number): string {
  const cleaned = text.trim()
  if (cleaned.length <= maxLength) return cleaned
  return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`
}

interface Props {
  params: Promise<{ slug: string }>
}

export default async function BlogPostOpenGraphImage({ params }: Props) {
  const { slug } = await params

  let post: Post | null = null
  try {
    const fetched = await getPostBySlug(slug)
    if (fetched?.published) {
      post = fetched
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn(`[blog/og-image] Failed to load post "${slug}": ${message}`)
  }

  const title = post ? truncate(post.title, 92) : 'Jhonny Pimiento'
  const excerpt = post
    ? truncate(
        post.excerpt || 'Technical notes on Web3, distributed systems, and cloud architecture.',
        155
      )
    : 'Senior Software & Web3 Engineer — Technical Articles & Architecture Notes'
  const tags = post ? (post.tags ?? []).slice(0, 3) : ['Web3', 'Blockchain', 'Cloud Architecture']
  const authorName = post?.authorName?.trim() || 'Jhonny Pimiento'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px 72px',
          background:
            'radial-gradient(circle at 88% 15%, rgba(124, 58, 237, 0.28), transparent 44%), radial-gradient(circle at 10% 90%, rgba(56, 189, 248, 0.16), transparent 44%), linear-gradient(135deg, #04080F 0%, #0A1124 60%, #060B16 100%)',
          color: '#F8FAFC',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {tags.map((tag) => (
              <div
                key={tag}
                style={{
                  display: 'flex',
                  padding: '8px 16px',
                  borderRadius: 999,
                  background: 'rgba(124, 58, 237, 0.18)',
                  border: '1px solid rgba(167, 139, 250, 0.4)',
                  color: '#DDD6FE',
                  fontSize: 18,
                  fontWeight: 600,
                }}
              >
                #{tag}
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 20px',
              borderRadius: 999,
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              color: '#A78BFA',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            jonesh.me
          </div>
        </div>

        {/* Article title & excerpt */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            maxWidth: 1020,
          }}
        >
          <div
            style={{
              fontSize: title.length > 56 ? 50 : 60,
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              color: '#F8FAFC',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 400,
              lineHeight: 1.4,
              color: '#CBD5E1',
            }}
          >
            {excerpt}
          </div>
        </div>

        {/* Footer author bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(148, 163, 184, 0.18)',
            paddingTop: 26,
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #7C3AED 0%, #10B981 100%)',
                color: '#FFFFFF',
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              JP
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#F8FAFC',
                }}
              >
                {authorName}
              </div>
              <div
                style={{
                  fontSize: 17,
                  color: '#94A3B8',
                }}
              >
                Senior Software &amp; Web3 Engineer
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#94A3B8',
            }}
          >
            jonesh.me/blog
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
