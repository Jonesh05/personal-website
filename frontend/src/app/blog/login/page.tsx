import type { Metadata } from 'next'
import { getSessionUser }   from '@/lib/auth/session'
import { redirect }         from 'next/navigation'
import { AdminLoginClient } from './AdminLoginClient'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminLoginPage() {
  const user = await getSessionUser()
  if (user?.isAdmin) redirect('/blog/admin')
  return <AdminLoginClient />
}
