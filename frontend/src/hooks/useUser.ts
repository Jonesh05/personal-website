'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/store/userStore'

/**
 * useUser — lazily hydrates the centralized visitor store on first mount.
 * Subsequent calls are cheap (no-op on an already-hydrated store).
 *
 * Returns a subset of the store so consumers don't over-subscribe.
 */
export function useUser() {
  const hydrate = useUserStore((s) => s.hydrate)
  const hydrated = useUserStore((s) => s.hydrated)
  const visitorId = useUserStore((s) => s.visitorId)
  const savedPosts = useUserStore((s) => s.savedPosts)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return { hydrated, visitorId, savedPosts }
}
