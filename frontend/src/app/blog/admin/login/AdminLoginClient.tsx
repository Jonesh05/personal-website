"use client"

import { useState }       from 'react'
import { useRouter }      from 'next/navigation'
import { AdminAuthModal } from '@/components/Auth/AdminAuthModal'

export function AdminLoginClient() {
  const [open, setOpen] = useState(true)
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <AdminAuthModal
        isOpen={open}
        onCloseAction={() => setOpen(false)}
        onAuthSuccessAction={() => router.replace('/blog/admin')}
      />
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Log in as administrator
        </button>
      )}
    </div>
  )
}
