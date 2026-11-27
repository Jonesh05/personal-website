'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import { resendPostBroadcastAction } from '@/app/actions/posts'

interface BroadcastButtonProps {
  postId: string
  hasPreviousDispatch: boolean
}

export function BroadcastButton({
  postId,
  hasPreviousDispatch,
}: BroadcastButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      try {
        const res = await resendPostBroadcastAction(postId, 'all')
        const b = res.broadcast
        if (res.success && b) {
          if (b.status === 'sent') {
            toast.success(`Newsletter sent to ${b.sentCount} subscribers`)
          } else {
            toast.error(
              `Partial broadcast: ${b.sentCount} sent, ${b.failedCount} failed${
                b.errors[0] ? ` (${b.errors[0]})` : ''
              }`,
            )
          }
          router.refresh()
        } else {
          toast.error(res.error || 'Broadcast failed')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Broadcast failed'
        toast.error(message)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-xs font-semibold text-purple-300 hover:text-purple-200 disabled:opacity-50 transition-colors cursor-pointer"
      style={{ fontFamily: 'var(--font-mono)' }}
    >
      {isPending
        ? 'Sending…'
        : hasPreviousDispatch
          ? 'Retry Broadcast'
          : 'Send Newsletter'}
    </button>
  )
}
