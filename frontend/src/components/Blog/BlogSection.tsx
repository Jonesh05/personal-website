import type { Post } from '../../../../shared/types/post.types';
import PostCard from '@/components/Blog/PostCard';
import ApiError from '@/components/ui/ApiError';

// URL de la API del backend. Debería estar en una variable de entorno.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface GetPostsResult {
  success: boolean;
  posts: Post[];
  error?: string;
}

async function getPosts(): Promise<GetPostsResult> {
  try {
    const response = await fetch(`${API_URL}/posts`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return { success: true, posts: data.posts || [] };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Failed to fetch posts:', errorMessage, error);
    return { success: false, posts: [], error: errorMessage };
  }
}

/**
 * Componente BlogSection
 * Un Server Component que obtiene y muestra los últimos posts del blog.
 * Maneja los estados de carga (con Suspense), error y vacío.
 */
export default async function BlogSection() {
  const { success, posts, error } = await getPosts();

  if (!success) {
    return <ApiError message={`Failed to load blog posts. ${error}`} />;
  }

  if (posts.length === 0) {
    return (
      <section className="py-16 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">No Posts Found</h2>
          <p className="text-gray-600">There are no articles to display at the moment. Check back later!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 lg:py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">From the Blog</h2>
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