'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminAuthModal } from '@/components/Auth/AdminAuthModal';
import { useTranslations } from '@/i18n';
import { BlogBanner3D } from './BlogBanner3D.client';

const BlogHeaderInner: React.FC = () => {
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('Blog');

  useEffect(() => {
    if (searchParams) {
      const loginRequired = searchParams.get('login') === 'required';
      const unauthorized = searchParams.get('error') === 'unauthorized';
      if (loginRequired || unauthorized) {
        setIsAdminModalOpen(true);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        setIsAdminModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="relative isolate overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-slate-50 via-white to-slate-100/80 dark:border-white/[0.08] dark:from-[#070B14] dark:via-[#0A1020] dark:to-[#090F1C]">
        {/* Architectural dot-matrix studio floor (distinct from homepage plasma) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.45] dark:opacity-[0.22]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(100,116,139,0.28) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Soft sculptural studio light wash behind the 3D stage */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[8%] top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full opacity-55 blur-[120px] dark:opacity-35"
          style={{
            background:
              'radial-gradient(circle, rgba(99,102,241,0.34) 0%, rgba(56,189,248,0.22) 45%, transparent 72%)',
          }}
        />

        {/* Subtle paper/studio grain texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")",
          }}
        />

        {/* Asymmetric Editorial + Interactive 3D Stage */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-28 pb-10 sm:px-6 md:pt-32 md:pb-14 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-4">
            {/* Editorial Copy Column */}
            <div className="text-center lg:col-span-6 lg:text-left">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-600 shadow-xs backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-indigo-500 dark:bg-cyan-400"
                  aria-hidden="true"
                />
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  JOURNAL · WEB3 &amp; SECURITY
                </span>
              </div>

              <h1
                className="mb-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl cursor-default dark:text-white"
                style={{ fontFamily: 'var(--font-display)', lineHeight: 1.06 }}
                onDoubleClick={() => setIsAdminModalOpen(true)}
                title={t('adminAccessHint')}
              >
                {t('title')}
              </h1>

              <p className="mx-auto max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg lg:mx-0 dark:text-slate-300/90">
                {t('subtitle')}
              </p>

              {/* Interactive 3D discovery hint */}
              <p
                className="mt-6 text-xs tracking-wide text-slate-500 dark:text-slate-400"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Drag sculpture to orbit 360° · Click to pulse
              </p>
            </div>

            {/* Interactive GPU 3D Sculpture Stage — generous, borderless */}
            <div className="relative mx-auto h-[320px] w-full max-w-[440px] sm:h-[370px] sm:max-w-[500px] lg:col-span-6 lg:-my-6 lg:h-[420px] lg:max-w-none">
              <BlogBanner3D />
            </div>
          </div>
        </div>
      </header>

      <AdminAuthModal
        isOpen={isAdminModalOpen}
        onCloseAction={() => setIsAdminModalOpen(false)}
        onAuthSuccessAction={() => {
          setIsAdminModalOpen(false);
          router.push('/blog/admin');
          router.refresh();
        }}
      />
    </>
  );
};

export const BlogHeader: React.FC = () => {
  return (
    <Suspense
      fallback={
        <header className="relative overflow-hidden border-b border-slate-200/80 bg-slate-50 pt-28 pb-14 dark:border-white/[0.08] dark:bg-[#070B14]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1
              className="text-4xl font-extrabold text-slate-900 sm:text-5xl dark:text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Blog
            </h1>
          </div>
        </header>
      }
    >
      <BlogHeaderInner />
    </Suspense>
  );
};
