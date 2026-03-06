  import { getPosts }    from '@/lib/firestore/posts'
import { getContacts } from '@/lib/firestore/contacts'
import Link            from 'next/link'

export default async function AdminPage() {
  const [posts, contacts] = await Promise.all([
    getPosts().catch(() => []),
    getContacts().catch(() => []),
  ])

  const published = posts.filter(p => p.published).length
  const drafts    = posts.length - published
  const unread    = contacts.filter(c => !c.read).length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <Link href="/blog/admin/posts/new"
          className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          + New Post
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Published',        value: published,    color: 'text-green-400'  },
          { label: 'Drafts',           value: drafts,       color: 'text-yellow-400' },
          { label: 'Total',            value: posts.length, color: 'text-blue-400'   },
          { label: 'Unread Messages',  value: unread,       color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-4xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="font-semibold text-gray-200">Recent Posts</h2>
          <Link href="/blog/admin/posts" className="text-sm text-orange-400 hover:text-orange-300">
            View all →
          </Link>
        </div>
        {posts.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No posts yet.{' '}
            <Link href="/blog/admin/posts/new" className="text-orange-400 hover:underline">
              Create your first post →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-left">
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Views</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.slice(0, 5).map(post => (
                <tr key={post.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                  <td className="px-6 py-3 text-gray-200 max-w-xs truncate">{post.title}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      post.published
                        ? 'bg-green-900/60 text-green-300'
                        : 'bg-yellow-900/60 text-yellow-300'
                    }`}>
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-400">{post.views ?? 0}</td>
                  <td className="px-6 py-3">
                    <Link href={`/blog/admin/posts/${post.id}`}
                      className="text-blue-400 hover:text-blue-300 text-xs">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
