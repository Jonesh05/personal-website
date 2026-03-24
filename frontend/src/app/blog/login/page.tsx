import { getSessionUser }   from '@/lib/auth/session'
import { redirect }         from 'next/navigation'
import { AdminLoginClient } from './AdminLoginClient'

export default async function AdminLoginPage() {
  const user = await getSessionUser()
  if (user?.isAdmin) redirect('/blog/admin')
  return <AdminLoginClient />
}
