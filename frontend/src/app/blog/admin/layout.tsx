import { getSessionUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SignOutButton } from '@/components/Auth/SignOutButton.client'
import { getServerTranslations } from '@/i18n/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user?.isAdmin) redirect('/blog?login=required')
  const { t } = await getServerTranslations('AdminNav')

  return (
    <div
      className="min-h-screen pt-[118px] text-slate-100"
      style={{ background: 'var(--color-void)' }}
    >
      {/* Secondary Admin Command Bar — properly offset below the floating glass Navbar */}
      <div
        className="sticky top-[118px] z-40 border-b backdrop-blur-xl"
        style={{
          background: 'rgba(8, 14, 24, 0.85)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center justify-between">
            <div className="flex items-center gap-6 text-sm">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest"
                style={{
                  fontFamily: 'var(--font-mono)',
                  background: 'rgba(124, 58, 237, 0.18)',
                  border: '1px solid rgba(191, 94, 255, 0.35)',
                  color: 'var(--color-purple-neon)',
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                {t('admin')}
              </span>
              <Link
                href="/blog/admin"
                className="text-slate-300 transition-colors hover:text-white font-medium"
              >
                {t('dashboard')}
              </Link>
              <Link
                href="/blog/admin/posts"
                className="text-slate-300 transition-colors hover:text-white font-medium"
              >
                {t('posts')}
              </Link>
              <Link
                href="/blog/admin/posts/new"
                className="rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {t('new')}
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="hidden max-w-[220px] truncate text-xs text-slate-400 sm:block"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {user?.email}
              </span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
