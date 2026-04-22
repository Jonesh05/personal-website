import Link from 'next/link'
import { getPosts } from '@/lib/firestore/posts'
import { deletePostAction } from '@/app/actions/posts'
import { revalidatePath } from 'next/cache'
import { getServerTranslations } from '@/i18n/server'
import { formatDateByLocale } from '@/utils/formatDate'

export default async function AdminPostsPage() {
  const posts = await getPosts()
  const { t, locale } = await getServerTranslations('AdminPosts')

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('managePosts')}</h1>
        <Link 
          href="/blog/admin/posts/new"
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
        >
          {t('createNewPost')}
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="p-4">{t('title')}</th>
              <th className="p-4">{t('status')}</th>
              <th className="p-4">{t('date')}</th>
              <th className="p-4">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                <td className="p-4">{post.title}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${post.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {post.published ? t('published') : t('draft')}
                  </span>
                </td>
                <td className="p-4">{formatDateByLocale(post.createdAt, locale)}</td>
                <td className="p-4 flex gap-2">
                  <Link 
                    href={`/blog/admin/posts/${post.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {t('edit')}
                  </Link>
                  <form action={async () => {
                    'use server'
                    await deletePostAction(post.id)
                    revalidatePath('/blog/admin/posts')
                  }}>
                    <button type="submit" className="text-red-600 hover:underline">
                      {t('delete')}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  {t('empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
