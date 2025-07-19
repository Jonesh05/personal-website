
import Link from 'next/link';
import Image from 'next/image';
import { postsApi } from '@/lib/firebase/firestore';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  tags: string[];
  createdAt: Date;
  author?: string;
  readTime?: number;
}

interface BlogSectionProps {
  className?: string;
}

export default async function BlogSection({ className = '' }: BlogSectionProps) {
  let posts: BlogPost[] = [];
  try {
    const res = await postsApi.getPublished(4);
    posts = res.posts;
  } catch {
    // Podrías mostrar un mensaje de error aquí si lo deseas
    return null;
  }

  return (
    <section className={`py-16 lg:py-20 bg-gray-50 ${className}`}>
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Latest Articles
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Thoughts, insights, and ideas on development, design, and technology
          </p>
        </div>

        {/* Blog Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {posts.map((post, index) => (
            <BlogCard key={post.id} post={post} priority={index < 2} />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link
            href="/blog"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            View All Articles
            <svg
              className="ml-2 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

interface BlogCardProps {
  post: BlogPost;
  priority?: boolean;
}

function BlogCard({ post, priority = false }: BlogCardProps) {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));

  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="bg-white rounded-xl shadow-xs hover:shadow-md transition-shadow duration-300 overflow-hidden h-full flex flex-col">
        {/* Featured Image */}
        <div className="relative aspect-16/10 overflow-hidden bg-gray-100">
          {post.featuredImage ? (
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-blue-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
              </svg>
            </div>
          )}

          {/* Category Badge */}
          {post.tags?.length > 0 && (
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/90 text-gray-800 backdrop-blur-xs">
                {post.tags[0]}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col">
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <time dateTime={new Date(post.createdAt).toISOString()}>
              {formatDate(post.createdAt)}
            </time>
            <span className="mx-2">•</span>
            <span>{post.readTime || 5} min read</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
            {post.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-3 flex-1 mb-4">{post.excerpt}</p>
          <div className="flex items-center justify-between">
            {post.author && (
              <div className="flex items-center">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700">
                    {post.author.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="ml-2 text-xs text-gray-600">{post.author}</span>
              </div>
            )}
            <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
              Read more
              <svg
                className="ml-1 w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}