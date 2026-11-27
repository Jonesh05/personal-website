// frontend/src/app/actions/posts.ts
// Server Actions for posts CRUD operations + Execution Layer Newsletter Broadcast
// + Azure OpenAI Editorial Copilot
'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/lib/auth/session'
import { CreatePostSchema, UpdatePostSchema } from '@personal-website/shared/schemas/post.schema'
import {
  createPost as createPostDb,
  updatePost as updatePostDb,
  deletePost as deletePostDb,
  getPostById,
  generateSlug,
} from '@/lib/firestore/posts'
import {
  broadcastPostToSubscribers,
  type BroadcastResult,
} from '@/lib/mailer/dispatch'
import {
  generateEditorialMetadata,
  type EditorialSuggestion,
} from '@/lib/ai/azureOpenai'

export interface ActionResult {
  success: boolean
  error?: string
  data?: unknown
  broadcast?: BroadcastResult | null
}

export async function createPostAction(formData: FormData): Promise<ActionResult> {
  const user = await getSessionUser()
  if (!user?.isAdmin) {
    return { success: false, error: 'Unauthorized' }
  }

  const notifySubscribers = formData.get('notifySubscribers') === 'true'
  const rawData = {
    title: formData.get('title') as string,
    content: formData.get('content') as string,
    excerpt: (formData.get('excerpt') as string) || '',
    tags:
      (formData.get('tags') as string)
        ?.split(',')
        .map(t => t.trim())
        .filter(Boolean) || [],
    published: formData.get('published') === 'true',
    featured: formData.get('featured') === 'true',
    featuredImage: (formData.get('featuredImage') as string) || '',
  }

  const parsed = CreatePostSchema.safeParse(rawData)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || 'Validation failed',
    }
  }

  try {
    const slug = generateSlug(parsed.data.title)
    const post = await createPostDb({
      ...parsed.data,
      slug,
      authorId: user.uid,
      authorName: user.name || user.email || 'Admin',
    })

    let broadcast: BroadcastResult | null = null
    if (parsed.data.published && notifySubscribers) {
      try {
        broadcast = await broadcastPostToSubscribers({
          postId:          post.id,
          title:           post.title,
          slug:            post.slug,
          excerpt:         post.excerpt,
          tags:            post.tags,
          readTimeMinutes: Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200)),
        })
      } catch (broadcastErr) {
        const message =
          broadcastErr instanceof Error ? broadcastErr.message : String(broadcastErr)
        console.error('[actions/posts] Newsletter broadcast failed:', message)
        broadcast = {
          status:             'failed',
          matchedSubscribers: 0,
          sentCount:          0,
          failedCount:        0,
          skippedReason:      message,
          errors:             [message],
        }
      }
    }

    revalidatePath('/')
    revalidatePath('/blog')
    revalidatePath('/blog/admin')
    revalidatePath('/blog/admin/posts')
    revalidatePath(`/blog/${post.slug}`)
    return { success: true, data: post, broadcast }
  } catch (error) {
    console.error('Create post error:', error)
    return { success: false, error: 'Failed to create post' }
  }
}

export async function updatePostAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getSessionUser()
  if (!user?.isAdmin) {
    return { success: false, error: 'Unauthorized' }
  }

  const notifySubscribers = formData.get('notifySubscribers') === 'true'
  const rawData = {
    title: formData.get('title') as string,
    content: formData.get('content') as string,
    excerpt: formData.get('excerpt') as string,
    tags: (formData.get('tags') as string)
      ?.split(',')
      .map(t => t.trim())
      .filter(Boolean),
    published: formData.get('published') === 'true',
    featured: formData.get('featured') === 'true',
    featuredImage: formData.get('featuredImage') as string,
  }

  const cleanData = Object.fromEntries(
    Object.entries(rawData).filter(([, v]) => v !== undefined && v !== null),
  )

  const parsed = UpdatePostSchema.safeParse(cleanData)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || 'Validation failed',
    }
  }

  try {
    const existingPost = await getPostById(id)

    const updateData = parsed.data.title
      ? { ...parsed.data, slug: generateSlug(parsed.data.title) }
      : parsed.data

    await updatePostDb(id, updateData)

    const finalSlug = updateData.slug || existingPost?.slug || ''
    const finalTitle = parsed.data.title || existingPost?.title || ''
    const finalExcerpt = parsed.data.excerpt ?? existingPost?.excerpt ?? ''
    const finalTags = parsed.data.tags ?? existingPost?.tags ?? []
    const finalContent = parsed.data.content ?? existingPost?.content ?? ''

    let broadcast: BroadcastResult | null = null
    if (parsed.data.published && notifySubscribers && finalSlug && finalTitle) {
      try {
        broadcast = await broadcastPostToSubscribers({
          postId:          id,
          title:           finalTitle,
          slug:            finalSlug,
          excerpt:         finalExcerpt,
          tags:            finalTags,
          readTimeMinutes: Math.max(1, Math.ceil(finalContent.split(/\s+/).length / 200)),
        })
      } catch (broadcastErr) {
        const message =
          broadcastErr instanceof Error ? broadcastErr.message : String(broadcastErr)
        console.error('[actions/posts] Newsletter broadcast failed:', message)
        broadcast = {
          status:             'failed',
          matchedSubscribers: 0,
          sentCount:          0,
          failedCount:        0,
          skippedReason:      message,
          errors:             [message],
        }
      }
    }

    revalidatePath('/')
    revalidatePath('/blog')
    revalidatePath('/blog/admin')
    revalidatePath('/blog/admin/posts')
    if (existingPost?.slug) {
      revalidatePath(`/blog/${existingPost.slug}`)
    }
    if (updateData.slug) {
      revalidatePath(`/blog/${updateData.slug}`)
    }
    return { success: true, broadcast }
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
    const existingPost = await getPostById(id)
    await deletePostDb(id)

    revalidatePath('/')
    revalidatePath('/blog')
    revalidatePath('/blog/admin')
    revalidatePath('/blog/admin/posts')
    if (existingPost?.slug) {
      revalidatePath(`/blog/${existingPost.slug}`)
    }
    return { success: true }
  } catch (error) {
    console.error('Delete post error:', error)
    return { success: false, error: 'Failed to delete post' }
  }
}

export async function generatePostAiSuggestionsAction(input: {
  title: string
  content: string
}): Promise<{
  success: boolean
  error?: string
  suggestion?: EditorialSuggestion
}> {
  const user = await getSessionUser()
  if (!user?.isAdmin) {
    return { success: false, error: 'Unauthorized' }
  }

  if (!input.title.trim() && !input.content.trim()) {
    return {
      success: false,
      error: 'Write a title or draft content first to generate AI metadata.',
    }
  }

  try {
    const suggestion = await generateEditorialMetadata(input)
    return { success: true, suggestion }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Azure OpenAI call failed'
    return { success: false, error: message }
  }
}
