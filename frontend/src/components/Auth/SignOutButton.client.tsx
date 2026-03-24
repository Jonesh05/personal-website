'use client'

import { useState }  from 'react'
import { useRouter } from 'next/navigation'
import { auth }      from '@/lib/firebase/client'
import { signOut }   from 'firebase/auth'

export function SignOutButton() {
  const router      = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleSignOut() {
    setBusy(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    await signOut(auth).catch(() => {})
    router.replace('/blog')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={busy}
      className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  )
}