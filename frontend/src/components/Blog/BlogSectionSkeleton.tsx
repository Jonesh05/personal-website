
import PostCardSkeleton from './PostCardSkeleton';

interface BlogSectionSkeletonProps {
  count?: number;
}

/**
 * Componente BlogSectionSkeleton
 * Muestra una cuadrícula de esqueletos de tarjetas de post para el estado de carga.
 */
export default function BlogSectionSkeleton({ count = 4 }: BlogSectionSkeletonProps) {
  return (
    <div className="w-full py-16 lg:py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {Array.from({ length: count }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}