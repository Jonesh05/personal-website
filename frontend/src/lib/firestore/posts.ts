// frontend/src/lib/firestore/posts.ts
// Server-side Firestore data access layer for posts
// NEVER import this file in client components

import { adminDb } from '@/lib/firebase/admin'
import type { CreatePostInput, UpdatePostInput } from '@personal-website/shared/schemas/post.schema'

const COLLECTION = 'posts'

export interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  tags: string[]
  published: boolean
  featured: boolean
  featuredImage: string
  authorId: string
  authorName: string
  likes: number
  views: number
  createdAt: string
  updatedAt: string
}

interface PostFilters {
  published?: boolean
  featured?: boolean
  tag?: string
  limit?: number
  offset?: number
}

export async function getPosts(filters: PostFilters = {}): Promise<Post[]> {
  let query = adminDb.collection(COLLECTION).orderBy('createdAt', 'desc')

  if (filters.published !== undefined) {
    query = query.where('published', '==', filters.published)
  }
  if (filters.featured !== undefined) {
    query = query.where('featured', '==', filters.featured)
  }
  if (filters.tag) {
    query = query.where('tags', 'array-contains', filters.tag)
  }
  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const snapshot = await query.get()
  return snapshot.docs.map(doc => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
    } as Post
  })
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const snapshot = await adminDb
    .collection(COLLECTION)
    .where('slug', '==', slug)
    .limit(1)
    .get()

  if (snapshot.empty) return null
  const doc = snapshot.docs[0]
  const data = doc.data()
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
  } as Post
}

export async function getPostById(id: string): Promise<Post | null> {
  const doc = await adminDb.collection(COLLECTION).doc(id).get()
  if (!doc.exists) return null
  const data = doc.data()!
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
  } as Post
}

export async function createPost(
  data: CreatePostInput & { authorId: string; authorName: string; slug: string }
): Promise<Post> {
  const now = new Date()
  const postData = {
    ...data,
    likes: 0,
    views: 0,
    createdAt: now,
    updatedAt: now,
  }

  const ref = await adminDb.collection(COLLECTION).add(postData)
  return {
    id: ref.id,
    ...postData,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  }
}

export async function updatePost(id: string, data: UpdatePostInput): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).update({
    ...data,
    updatedAt: new Date(),
  })
}

export async function deletePost(id: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).delete()
}

export async function getPopularTags(limit = 10): Promise<string[]> {
  const snapshot = await adminDb
    .collection(COLLECTION)
    .where('published', '==', true)
    .select('tags')
    .get()

  const tagCounts = new Map<string, number>()
  snapshot.docs.forEach(doc => {
    const tags = doc.data().tags || []
    tags.forEach((tag: string) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
  })

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag)
}

export async function getFeaturedPosts(limit = 3): Promise<Post[]> {
  return getPosts({ published: true, featured: true, limit })
}

export async function getRelatedPosts(tags: string[], excludeId: string, limit = 3): Promise<Post[]> {
  if (tags.length === 0) return []

  const snapshot = await adminDb
    .collection(COLLECTION)
    .where('published', '==', true)
    .where('tags', 'array-contains-any', tags.slice(0, 10))
    .limit(limit + 1)
    .get()

  return snapshot.docs
    .filter(doc => doc.id !== excludeId)
    .slice(0, limit)
    .map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      } as Post
    })
}

// Views and likes counters are mutated exclusively by the transactional
// helpers in `lib/firestore/interactions.ts` (per-visitor dedup + atomic
// counters). Do not add "blind" increment helpers here — they would bypass
// the per-user rules and re-inflate the counters.

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}
