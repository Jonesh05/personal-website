'use client'

import { useCallback, useEffect, useState } from 'react'
import { useUserStore } from '@/store/userStore'

interface UseLikePostOptions {
  postId: string
  initialLikes: number
}

/**
 * useLikePost — one hook for all like interactions.
 *
 * - Reads "is this post liked?" from the centralized store.
 * - Keeps the visible counter in sync with the optimistic toggle.
 * - Guards against double-submits while a request is in flight.
 */
export function useLikePost({ postId, initialLikes }: UseLikePostOptions) {
  const hydrate = useUserStore((s) => s.hydrate)
  const hydrated = useUserStore((s) => s.hydrated)
  const liked = useUserStore((s) => s.likedPostIds.has(postId))
  const toggle = useUserStore((s) => s.toggleLike)

  const [likes, setLikes] = useState(initialLikes)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  const handleToggle = useCallback(async () => {
    if (pending) return
    setPending(true)
    const previousLikes = likes
    // Optimistic counter update
    setLikes((current) => current + (liked ? -1 : 1))

    const result = await toggle(postId)
    if (!result) {
      setLikes(previousLikes)
    } else if (typeof result.likes === 'number') {
      setLikes(result.likes)
    }
    setPending(false)
  }, [pending, liked, likes, toggle, postId])

  return { liked, likes, pending, toggle: handleToggle, hydrated }
}
