/**
 * Componente PostCardSkeleton
 * Muestra una versión de carga de la tarjeta de un post.
 */
export default function PostCardSkeleton() {
  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      {/* Image Placeholder */}
      <div className="h-48 bg-gray-300"></div>
      <div className="p-6">
        {/* Tag Placeholder */}
        <div className="h-4 w-1/4 bg-gray-300 rounded mb-4"></div>
        {/* Title Placeholder */}
        <div className="h-6 w-3/4 bg-gray-300 rounded mb-2"></div>
        {/* Excerpt Placeholder */}
        <div className="h-4 w-full bg-gray-300 rounded mb-1"></div>
        <div className="h-4 w-5/6 bg-gray-300 rounded mb-4"></div>
        {/* Author Placeholder */}
        <div className="h-4 w-1/2 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
}
