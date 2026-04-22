import type { Post } from '@/lib/firestore/posts';
import PostCard from '@/components/Blog/PostCard';
import ApiError from '@/components/ui/ApiError';
import { getPosts } from '@/lib/firestore/posts';

/**
 * Componente BlogSection
 * Un Server Component que obtiene y muestra los últimos posts del blog.
 * Maneja los estados de carga (con Suspense), error y vacío.
 */
export default async function BlogSection() {
  let posts: Post[] = [];
  let error: string | null = null;

  try {
    posts = await getPosts({ published: true, limit: 4 });
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error';
  }

  if (error) {
    return <ApiError message={`Failed to load blog posts. ${error}`} />;
  }

  if (posts.length === 0) {
    return (
      <section id="blog" className="py-16 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">No Posts Found</h2>
          <p className="text-gray-600">There are no articles to display at the moment. Check back later!</p>
        </div>
      </section>
    );
  }

  return (
    <section id="blog" className="py-16 lg:py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-balance">Selected Publications</h2>
          <p className="mt-4 text-lg leading-8 text-gray-600">
            Latest articles and tutorials to help you grow.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}