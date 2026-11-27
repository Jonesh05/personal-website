import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/lib/auth/session'
import { adminDb } from '@/lib/firebase/admin'
import { getPosts } from '@/lib/firestore/posts'
import { deletePostAction } from '@/app/actions/posts'
import { getServerTranslations } from '@/i18n/server'
import { formatDateByLocale } from '@/utils/formatDate'
import { BroadcastButton } from './BroadcastButton.client'

export const dynamic = 'force-dynamic'

interface DispatchBadgeInfo {
  status: string
  sentCount: number
  failedCount: number
}

async function getDispatchMap(): Promise<Record<string, DispatchBadgeInfo>> {
  try {
    const snap = await adminDb.collection('newsletter_dispatches').get()
    const map: Record<string, DispatchBadgeInfo> = {}
    for (const doc of snap.docs) {
      const data = doc.data()
      map[doc.id] = {
        status:      typeof data.status === 'string' ? data.status : 'unknown',
        sentCount:   typeof data.sentCount === 'number' ? data.sentCount : 0,
        failedCount: typeof data.failedCount === 'number' ? data.failedCount : 0,
      }
    }
    return map
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    // eslint-disable-next-line no-console
    console.warn(`[admin/posts] failed reading dispatch statuses: ${message}`)
    return {}
  }
}

export default async function AdminPostsPage() {
  const user = await getSessionUser()
  if (!user?.isAdmin) redirect('/blog/login')

  const [posts, dispatchMap, { t, locale }] = await Promise.all([
    getPosts(),
    getDispatchMap(),
    getServerTranslations('AdminPosts'),
  ])

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p
            className="text-xs uppercase tracking-[0.2em] mb-1"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-green-neon)',
            }}
          >
            CONTENT REPOSITORY • FIRESTORE
          </p>
          <h1
            className="text-3xl font-bold text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {t('managePosts')}
          </h1>
        </div>
        <Link
          href="/blog/admin/posts/new"
          className="rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:-translate-y-0.5 w-fit"
          style={{
            fontFamily: 'var(--font-mono)',
            background: 'var(--gradient-plasma)',
            boxShadow: '0 0 24px rgba(124, 58, 237, 0.35)',
          }}
        >
          + {t('createNewPost')}
        </Link>
      </div>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          background: 'var(--color-surface-2)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr
                className="border-b text-[11px] uppercase tracking-wider text-slate-400"
                style={{
                  borderColor: 'var(--color-border)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <th className="px-6 py-4">{t('title')}</th>
                <th className="px-6 py-4">Segments</th>
                <th className="px-6 py-4">{t('status')}</th>
                <th className="px-6 py-4">Newsletter</th>
                <th className="px-6 py-4">{t('date')}</th>
                <th className="px-6 py-4 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const dispatch = dispatchMap[post.id]
                const badgeClass = !post.published
                  ? 'bg-slate-800 text-slate-400 border border-slate-700'
                  : dispatch?.status === 'sent'
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    : dispatch?.status === 'partial'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : dispatch?.status === 'failed'
                        ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'

                const badgeLabel = !post.published
                  ? '—'
                  : dispatch?.status === 'sent'
                    ? `Sent (${dispatch.sentCount})`
                    : dispatch?.status === 'partial'
                      ? `Partial (${dispatch.sentCount}/${dispatch.sentCount + dispatch.failedCount})`
                      : dispatch?.status === 'failed'
                        ? 'Failed'
                        : dispatch?.status === 'in_progress'
                          ? 'Sending'
                          : 'Not sent'

                return (
                  <tr
                    key={post.id}
                    className="border-b transition-colors hover:bg-white/[0.02]"
                    style={{ borderColor: 'rgba(26, 38, 64, 0.6)' }}
                  >
                    <td className="px-6 py-4 font-medium text-slate-100 max-w-md truncate">
                      {post.title}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(post.tags ?? []).slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30"
                            style={{ fontFamily: 'var(--font-mono)' }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          post.published
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {post.published ? t('published') : t('draft')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${badgeClass}`}
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        {badgeLabel}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 text-slate-400 text-xs"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {formatDateByLocale(post.createdAt, locale)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-4">
                        {post.published && (
                          <BroadcastButton
                            postId={post.id}
                            hasPreviousDispatch={Boolean(dispatch)}
                          />
                        )}
                        <Link
                          href={`/blog/admin/posts/${post.id}`}
                          className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
                          style={{ fontFamily: 'var(--font-mono)' }}
                        >
                          {t('edit')}
                        </Link>
                        <form
                          action={async () => {
                            'use server'
                            await deletePostAction(post.id)
                            revalidatePath('/blog/admin/posts')
                          }}
                        >
                          <button
                            type="submit"
                            className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                            style={{ fontFamily: 'var(--font-mono)' }}
                          >
                            {t('delete')}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-500">
                    {t('empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
