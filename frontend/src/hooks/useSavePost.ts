'use client'

import { useCallback, useEffect, useState } from 'react'
import { useUserStore } from '@/store/userStore'

interface UseSavePostOptions {
  postId: string
  slug: string
  title: string
}

export function useSavePost({ postId, slug, title }: UseSavePostOptions) {
  const hydrate = useUserStore((s) => s.hydrate)
  const hydrated = useUserStore((s) => s.hydrated)
  const saved = useUserStore((s) => s.savedPosts.some((p) => p.postId === postId))
  const toggle = useUserStore((s) => s.toggleSave)

  const [pending, setPending] = useState(false)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  const handleToggle = useCallback(async () => {
    if (pending) return
    setPending(true)
    await toggle(postId, { slug, title })
    setPending(false)
  }, [pending, toggle, postId, slug, title])

  return { saved, pending, toggle: handleToggle, hydrated }
}
