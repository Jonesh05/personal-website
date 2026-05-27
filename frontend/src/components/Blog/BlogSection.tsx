import type { Post } from '@/lib/firestore/posts';
import PostCard from '@/components/Blog/PostCard';
import ApiError from '@/components/ui/ApiError';
import { getPosts } from '@/lib/firestore/posts';
import { getServerTranslations } from '@/i18n/server';

export default async function BlogSection() {
  const { t } = await getServerTranslations('Blog');
  let posts: Post[] = [];
  let error: string | null = null;

  try {
    posts = await getPosts({ published: true, limit: 4 });
  } catch (err) {
    error = err instanceof Error ? err.message : 'Error desconocido';
  }

  if (error) {
    return <ApiError message={`${t('loadingArticlesError')}. ${error}`} />;
  }

  if (posts.length === 0) {
    return (
      <section id="blog" className="py-16 lg:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">{t('noArticlesFound')}</h2>
          <p className="text-slate-600 dark:text-gray-400">{t('noArticlesYet')}</p>
        </div>
      </section>
    );
  }

  return (
    <section 
      id="blog" 
      className="relative py-16 lg:py-20 overflow-hidden"
      aria-labelledby="blog-heading"
    >
      {/* Plasma blobs */}
      <div className="hidden dark:block absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="plasma-blob-a absolute -top-40 -right-40 w-[560px] h-[560px] rounded-full opacity-20"
          style={{
            background:
              'radial-gradient(circle at 60% 40%, #7C3AED 0%, #4C1D95 40%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="plasma-blob-b absolute -bottom-40 -left-40 w-[480px] h-[480px] rounded-full opacity-15"
          style={{  
            background:
              'radial-gradient(circle at 40% 60%, #00FFB2 0%, #059669 40%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
      </div>
      <div className="relative z-10 mx-auto px-4 max-w-7xl">
        <header className="text-center mb-12">
          <div
            className="absolute top-0 inset-x-0 h-px rounded-t-2xl mb-16"
            style={{
              background: 'linear-gradient(90deg, transparent, #059669, #00FFB2, transparent)',
            }}
            aria-hidden="true"
          />
          <p
            className="text-lg tracking-widest uppercase mb-3 pt-5"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-green-neon)' }}
          >
            {t('section_label')}
          </p>
          
          <h2
            
            id="blog-heading"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 4.5vw, 3.4rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              color: 'var(--color-text)',
            }}
          >
            {t('title')}
          </h2>
          <p className="mt-8 text-md leading-8 text-slate-600 dark:text-gray-400 text-balance">
            {t('subtitle')}
          </p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}