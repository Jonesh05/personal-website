import { getSessionUser } from '@/lib/auth/session'
import { redirect }       from 'next/navigation'
import { AdminPostEditor } from '@/components/Blog/AdminPostEditor'

export default async function NewPostPage() {
  const user = await getSessionUser()
  if (!user?.isAdmin) redirect('/blog/login')

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">New Post</h1>
        <p className="text-gray-500 text-sm mt-1">Create a new blog post</p>
      </div>
      <AdminPostEditor post={null} />
    </div>
  )
}