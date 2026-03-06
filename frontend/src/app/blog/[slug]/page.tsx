import { notFound }      from 'next/navigation'
import { getPostBySlug, incrementPostViews } from '@/lib/firestore/posts'
import { BlogPostContent } from '@/components/Blog/BlogPostContent'
import type { Post }     from '@/lib/firestore/posts'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug).catch(() => null) as Post | null

  if (!post || !post.published) notFound()

  incrementPostViews(post.id).catch(() => {})

  return <BlogPostContent post={post} />
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug).catch(() => null) as Post | null
  if (!post) return {}
  return {
    title:       post.title,
    description: post.excerpt ?? '',
    openGraph: {
      title:       post.title,
      description: post.excerpt ?? '',
      images:      post.featuredImage ? [post.featuredImage] : [],
    },
  }
}
