'use client'

import { useEffect, useState } from 'react'

/**
 * ReadingProgress — slim scroll-tracked bar anchored at the top of the
 * viewport. Uses `requestAnimationFrame` so it stays silky smooth during
 * fast scrolls.
 *
 * Renders nothing on the server to avoid hydration mismatches — the bar
 * fades in after mount.
 */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    let frame = 0

    const compute = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const max =
        (document.documentElement.scrollHeight || document.body.scrollHeight) -
        window.innerHeight
      const next = max <= 0 ? 0 : Math.min(100, Math.max(0, (scrollTop / max) * 100))
      setProgress(next)
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        compute()
        frame = 0
      })
    }

    compute()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  if (!mounted) return null

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 h-[3px] bg-transparent pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-orange-500 via-orange-400 to-pink-500
          transition-[width] duration-75 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
