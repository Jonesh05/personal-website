'use client'

import { useEffect, useRef } from 'react'
import { useUserStore } from '@/store/userStore'

/**
 * useViewTracker — fires exactly one view-tracking request per mount.
 *
 * Dedup happens on the server (per visitor per UTC day). The client-side guard
 * here just prevents duplicate pings caused by React Strict Mode double-mounts
 * or rapid re-renders during hydration.
 */
export function useViewTracker(postId: string | undefined): void {
  const recordView = useUserStore((s) => s.recordView)
  const hydrate = useUserStore((s) => s.hydrate)
  const sent = useRef<string | null>(null)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    if (!postId) return
    if (sent.current === postId) return
    sent.current = postId
    void recordView(postId)
  }, [postId, recordView])
}
