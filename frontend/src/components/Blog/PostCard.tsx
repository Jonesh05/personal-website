import Link from 'next/link';
import Image from 'next/image';
import type { Post } from '../../../../shared/types/post.types';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const { title, slug, excerpt, featuredImage, tags, authorId } = post;

  return (
    <Link href={`/blog/${slug}`} className="block group">
      <article className="w-full max-w-sm mx-auto bg-white rounded-lg shadow-md overflow-hidden transform transition-transform duration-300 ease-in-out group-hover:-translate-y-1 group-hover:shadow-xl">
        {/* Image Container */}
        {featuredImage && (
          <div className="relative h-48 w-full">
            <Image
              src={featuredImage}
              alt={`Image for ${title}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          </div>
        )}

        {/* Content Container */}
        <div className="p-6">
          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="mb-4">
              {tags.map((tag) => (
                <span key={tag} className="inline-block bg-primary-100 text-primary-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-primary-600">
            {title}
          </h3>

          {/* Excerpt */}
          <p className="text-gray-600 text-base mb-4">
            {excerpt}
          </p>

          {/* Author */}
          <p className="text-sm font-medium text-gray-500">By {authorId}</p>
        </div>
      </article>
    </Link>
  );
}
