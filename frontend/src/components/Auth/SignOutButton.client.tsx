'use client'

import { useState }  from 'react'
import { useRouter } from 'next/navigation'

export function SignOutButton() {
  const router      = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleSignOut() {
    setBusy(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    // PERF: Firebase SDK is loaded on demand here so it stays out of the
    // initial-render bundle.
    try {
      const [{ getFirebaseAuth }, { signOut }] = await Promise.all([
        import('@/lib/firebase/client'),
        import('firebase/auth'),
      ])
      await signOut(await getFirebaseAuth())
    } catch {
      // ignore — server session is already cleared
    }
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
