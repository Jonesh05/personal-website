import { getPosts } from '@/lib/firestore/posts'
import { getContacts } from '@/lib/firestore/contacts'

export default async function AdminDashboard() {
  const [posts, contacts] = await Promise.all([
    getPosts(), 
    getContacts(),
  ])

  const publishedCount = posts.filter(p => p.published).length
  const draftCount = posts.length - publishedCount
  const unreadContacts = contacts.filter(c => !c.read).length

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-gray-500 dark:text-gray-400">Published Posts</h3>
          <p className="text-4xl font-bold">{publishedCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-gray-500 dark:text-gray-400">Draft Posts</h3>
          <p className="text-4xl font-bold">{draftCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-gray-500 dark:text-gray-400">Unread Contacts</h3>
          <p className="text-4xl font-bold">{unreadContacts}</p>
        </div>
      </div>
    </div>
  )
}
