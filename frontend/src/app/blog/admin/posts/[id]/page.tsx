import { getSessionUser } from '@/lib/auth/session'
import { redirect, notFound } from 'next/navigation'
import { getPostById }    from '@/lib/firestore/posts'
import { AdminPostEditor } from '@/components/Blog/AdminPostEditor'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: Props) {
  const user = await getSessionUser()
  if (!user?.isAdmin) redirect('/blog/login')

  const { id } = await params
  const post = await getPostById(id)
  if (!post) notFound()

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Edit Post</h1>
        <p className="text-gray-500 text-sm mt-1 truncate">{post.title}</p>
      </div>
      <AdminPostEditor post={post} />
    </div>
  )
}