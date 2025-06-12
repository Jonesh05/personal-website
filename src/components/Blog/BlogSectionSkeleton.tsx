
'use client';

export default function BlogSectionSkeleton({ className = '' }: { className?: string }) {
  return (
    <section className={`py-16 lg:py-20 bg-gray-50 ${className}`}>
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12">
          <div className="h-8 bg-gray-300 rounded-lg w-64 mx-auto mb-4 animate-pulse"></div>
          <div className="h-4 bg-gray-300 rounded w-96 mx-auto animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="aspect-[16/10] bg-gray-300 animate-pulse"></div>
              <div className="p-5">
                <div className="h-3 bg-gray-300 rounded w-20 mb-3 animate-pulse"></div>
                <div className="h-5 bg-gray-300 rounded w-full mb-2 animate-pulse"></div>
                <div className="h-5 bg-gray-300 rounded w-3/4 mb-4 animate-pulse"></div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-gray-300 rounded w-full animate-pulse"></div>
                  <div className="h-3 bg-gray-300 rounded w-5/6 animate-pulse"></div>
                  <div className="h-3 bg-gray-300 rounded w-4/6 animate-pulse"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-gray-300 rounded w-16 animate-pulse"></div>
                  <div className="h-3 bg-gray-300 rounded w-20 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center">
          <div className="h-12 bg-gray-300 rounded-lg w-40 mx-auto animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}