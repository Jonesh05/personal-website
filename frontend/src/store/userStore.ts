'use client'

/**
 * userStore — centralized client state for visitor-scoped interactions.
 *
 * Single source of truth for:
 *   - visitorId    (read from the `visitor-id` cookie set by middleware)
 *   - likedPostIds (posts the visitor has liked)
 *   - savedPosts   (posts the visitor has bookmarked)
 *
 * All mutations are optimistic: the store updates immediately, then calls the
 * server API. On failure we roll back so the UI never drifts from Firestore.
 */

import { create } from 'zustand'

const VISITOR_COOKIE = 'visitor-id'

export interface SavedPost {
  postId: string
  postSlug: string
  postTitle: string
  savedAt: string
}

interface UserState {
  visitorId: string | null
  hydrated: boolean
  hydrating: boolean
  likedPostIds: Set<string>
  savedPosts: SavedPost[]
}

interface UserActions {
  hydrate: () => Promise<void>
  isLiked: (postId: string) => boolean
  isSaved: (postId: string) => boolean
  toggleLike: (postId: string) => Promise<{ liked: boolean; likes?: number } | null>
  toggleSave: (postId: string, meta: { slug: string; title: string }) => Promise<boolean | null>
  recordView: (postId: string) => Promise<{ counted: boolean; views?: number } | null>
}

function readVisitorCookie(): string | null {
  if (typeof document === 'undefined') return null
  const row = document.cookie.split('; ').find((c) => c.startsWith(`${VISITOR_COOKIE}=`))
  if (!row) return null
  return decodeURIComponent(row.split('=')[1] ?? '') || null
}

export const useUserStore = create<UserState & UserActions>()((set, get) => ({
  visitorId: null,
  hydrated: false,
  hydrating: false,
  likedPostIds: new Set(),
  savedPosts: [],

  hydrate: async () => {
    if (get().hydrated || get().hydrating) return
    set({ hydrating: true })

    const cookieId = readVisitorCookie()
    if (cookieId) set({ visitorId: cookieId })

    try {
      const res = await fetch('/api/me', { cache: 'no-store' })
      if (res.ok) {
        const data = (await res.json()) as {
          visitorId: string | null
          likedPostIds: string[]
          savedPosts: SavedPost[]
        }
        set({
          visitorId: data.visitorId ?? cookieId ?? null,
          likedPostIds: new Set(data.likedPostIds ?? []),
          savedPosts: data.savedPosts ?? [],
          hydrated: true,
          hydrating: false,
        })
        return
      }
    } catch {
      // fall through to empty hydration so UI still works
    }

    set({ hydrated: true, hydrating: false })
  },

  isLiked: (postId) => get().likedPostIds.has(postId),
  isSaved: (postId) => get().savedPosts.some((p) => p.postId === postId),

  toggleLike: async (postId) => {
    const prev = get().likedPostIds
    const willLike = !prev.has(postId)
    const optimistic = new Set(prev)
    if (willLike) optimistic.add(postId)
    else optimistic.delete(postId)
    set({ likedPostIds: optimistic })

    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { liked: boolean; likes: number }

      const final = new Set(get().likedPostIds)
      if (data.liked) final.add(postId)
      else final.delete(postId)
      set({ likedPostIds: final })

      return data
    } catch (error) {
      console.error('[userStore.toggleLike]', error)
      set({ likedPostIds: prev })
      return null
    }
  },

  toggleSave: async (postId, meta) => {
    const prev = get().savedPosts
    const wasSaved = prev.some((p) => p.postId === postId)
    const optimistic = wasSaved
      ? prev.filter((p) => p.postId !== postId)
      : [
          {
            postId,
            postSlug: meta.slug,
            postTitle: meta.title,
            savedAt: new Date().toISOString(),
          },
          ...prev,
        ]
    set({ savedPosts: optimistic })

    try {
      const res = await fetch(`/api/posts/${postId}/save`, { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { saved: boolean }
      return data.saved
    } catch (error) {
      console.error('[userStore.toggleSave]', error)
      set({ savedPosts: prev })
      return null
    }
  },

  recordView: async (postId) => {
    try {
      const res = await fetch(`/api/posts/${postId}/view`, { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return (await res.json()) as { counted: boolean; views: number }
    } catch (error) {
      console.error('[userStore.recordView]', error)
      return null
    }
  },
}))
