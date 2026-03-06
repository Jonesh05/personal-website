import { getSessionUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user?.isAdmin) redirect('/blog?login=required')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin sidebar/header */}
      <nav className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <div>{user.email}</div>
      </nav>
      <main className="p-8">{children}</main>
    </div>
  )
}
