import { notFound } from 'next/navigation'
import AdminPostEditor from '@/components/Admin/AdminPostEditor.client'
import { getPostById } from '@/lib/firestore/posts'

interface EditPostPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const resolvedParams = await params
  const post = await getPostById(resolvedParams.id)

  if (!post) {
    notFound()
  }

  return (
    <div>
      <AdminPostEditor post={post} />
    </div>
  )
}
