import { getSessionUser } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { getPosts } from '@/lib/firestore/posts'
import { getContacts } from '@/lib/firestore/contacts'
import Link from 'next/link'
import { getServerTranslations } from '@/i18n/server'

export default async function AdminPage() {
  const user = await getSessionUser()
  if (!user?.isAdmin) redirect('/blog?login=required')
  const { t } = await getServerTranslations('AdminDashboard')

  const posts = await getPosts().catch(() => [])
  const contacts = await getContacts().catch(() => [])

  const published = posts.filter(p => p.published).length
  const drafts = posts.length - published
  const unread = contacts.filter(c => !c.read).length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('dashboard')}</h1>
        <Link
          href="/blog/admin/posts/new"
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-500"
        >
          {t('newPost')}
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: t('published'), value: published, color: 'text-green-400' },
          { label: t('drafts'), value: drafts, color: 'text-yellow-400' },
          { label: t('total'), value: posts.length, color: 'text-blue-400' },
          { label: t('unreadMessages'), value: unread, color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
            <p className="text-xs uppercase tracking-wide text-gray-500">{s.label}</p>
            <p className={`mt-2 text-4xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
          <h2 className="font-semibold text-gray-200">{t('recentPosts')}</h2>
          <Link href="/blog/admin/posts" className="text-sm text-orange-400 transition-colors hover:text-orange-300">
            {t('viewAll')} →
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            {t('noPostsYet')}{' '}
            <Link href="/blog/admin/posts/new" className="text-orange-400 hover:underline">
              {t('createFirstPost')} →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3">{t('title')}</th>
                  <th className="px-6 py-3">{t('status')}</th>
                  <th className="px-6 py-3">{t('views')}</th>
                  <th className="px-6 py-3">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {posts.slice(0, 5).map(post => (
                  <tr key={post.id} className="border-b border-gray-800/50 transition-colors hover:bg-gray-800/30">
                    <td className="max-w-xs truncate px-6 py-3 text-gray-200">{post.title}</td>
                    <td className="px-6 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        post.published
                          ? 'bg-green-900/60 text-green-300'
                          : 'bg-yellow-900/60 text-yellow-300'
                      }`}>
                        {post.published ? t('publishedShort') : t('draftShort')}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400">{post.views ?? 0}</td>
                    <td className="px-6 py-3">
                      <Link
                        href={`/blog/admin/posts/${post.id}`}
                        className="text-xs text-blue-400 transition-colors hover:text-blue-300"
                      >
                        {t('edit')}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
