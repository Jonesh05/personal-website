import { getSessionUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SignOutButton } from '@/components/Auth/SignOutButton.client'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user?.isAdmin) redirect('/blog?login=required')

  return (
    <div className="min-h-screen bg-gray-950 pt-106px text-gray-100">
      <div className="sticky top-106px z-40 border-b border-gray-800 bg-gray-900/90 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-11 items-center justify-between">
            <div className="flex items-center gap-5 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-500">
                Admin
              </span>
              <Link href="/blog/admin" className="text-gray-400 transition-colors hover:text-white">
                Dashboard
              </Link>
              <Link href="/blog/admin/posts" className="text-gray-400 transition-colors hover:text-white">
                Posts
              </Link>
              <Link href="/blog/admin/posts/new" className="text-gray-400 transition-colors hover:text-white">
                + New
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden max-w-180px truncate text-xs text-gray-500 sm:block">
                {user?.email}
              </span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}