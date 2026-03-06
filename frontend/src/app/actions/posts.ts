// frontend/src/app/actions/posts.ts
// Server Actions for posts CRUD operations
'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/lib/auth/session'
import { CreatePostSchema, UpdatePostSchema } from '@personal-website/shared/schemas/post.schema'
import {
  createPost as createPostDb,
  updatePost as updatePostDb,
  deletePost as deletePostDb,
  generateSlug,
  incrementPostLikes,
} from '@/lib/firestore/posts'

export interface ActionResult {
  success: boolean
  error?: string
  data?: unknown
}

export async function createPostAction(formData: FormData): Promise<ActionResult> {
  const user = await getSessionUser()
  if (!user?.isAdmin) {
    return { success: false, error: 'Unauthorized' }
  }

  const rawData = {
    title: formData.get('title') as string,
    content: formData.get('content') as string,
    excerpt: formData.get('excerpt') as string || '',
    tags: (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean) || [],
    published: formData.get('published') === 'true',
    featured: formData.get('featured') === 'true',
    featuredImage: formData.get('featuredImage') as string || '',
  }

  const parsed = CreatePostSchema.safeParse(rawData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || 'Validation failed' }
  }

  try {
    const slug = generateSlug(parsed.data.title)
    const post = await createPostDb({
      ...parsed.data,
      slug,
      authorId: user.uid,
      authorName: user.name || user.email || 'Admin',
    })

    revalidatePath('/')
    revalidatePath('/blog')
    revalidatePath('/admin/posts')
    return { success: true, data: post }
  } catch (error) {
    console.error('Create post error:', error)
    return { success: false, error: 'Failed to create post' }
  }
}

export async function updatePostAction(id: string, formData: FormData): Promise<ActionResult> {
  const user = await getSessionUser()
  if (!user?.isAdmin) {
    return { success: false, error: 'Unauthorized' }
  }

  const rawData = {
    title: formData.get('title') as string,
    content: formData.get('content') as string,
    excerpt: formData.get('excerpt') as string,
    tags: (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean),
    published: formData.get('published') === 'true',
    featured: formData.get('featured') === 'true',
    featuredImage: formData.get('featuredImage') as string,
  }

  // Remove undefined values
  const cleanData = Object.fromEntries(
    Object.entries(rawData).filter(([, v]) => v !== undefined && v !== null)
  )

  const parsed = UpdatePostSchema.safeParse(cleanData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || 'Validation failed' }
  }

  try {
    // If title changed, regenerate slug
    const updateData = parsed.data.title
      ? { ...parsed.data, slug: generateSlug(parsed.data.title) }
      : parsed.data

    await updatePostDb(id, updateData)

    revalidatePath('/')
    revalidatePath('/blog')
    revalidatePath('/admin/posts')
    revalidatePath(`/blog/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Update post error:', error)
    return { success: false, error: 'Failed to update post' }
  }
}

export async function deletePostAction(id: string): Promise<ActionResult> {
  const user = await getSessionUser()
  if (!user?.isAdmin) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    await deletePostDb(id)

    revalidatePath('/')
    revalidatePath('/blog')
    revalidatePath('/admin/posts')
    return { success: true }
  } catch (error) {
    console.error('Delete post error:', error)
    return { success: false, error: 'Failed to delete post' }
  }
}

export async function likePostAction(id: string): Promise<ActionResult> {
  try {
    await incrementPostLikes(id)
    revalidatePath(`/blog/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Like post error:', error)
    return { success: false, error: 'Failed to like post' }
  }
}
