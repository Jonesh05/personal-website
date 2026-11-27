'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { HeroClient } from './HeroClient';
import { useTranslations } from '@/i18n';

const COLORS = [
  { bg: 'rgba(191, 94, 255, 0.9)',  shadow: '0 0 8px 2px rgba(191, 94, 255, 0.7)'  },
  { bg: 'rgba(0, 255, 178, 0.9)',   shadow: '0 0 8px 2px rgba(0, 255, 178, 0.7)'   },
  { bg: 'rgba(255, 255, 255, 0.7)', shadow: '0 0 5px 1px rgba(255, 255, 255, 0.4)' },
] as const;

interface ParticleData {
  id:       number;
  size:     number;
  left:     number;
  top:      number;
  dx:       number;
  dy:       number;
  duration: number;
  delay:    number;
  color:    typeof COLORS[number];
}

type ParticleStyle = CSSProperties & {
  '--dx':    string;
  '--dy':    string;
  '--dur':   string;
  '--delay': string;
};

function generateParticles(count: number, isMobile: boolean): ParticleData[] {
  return Array.from({ length: count }, (_, i) => ({
    id:       i,
    size:     2 + Math.random() * 4,
    left:     Math.random() * 100,
    top:      Math.random() * 100,
    dx:       (isMobile ? -10 : -20) + Math.random() * (isMobile ? 20 : 40),
    dy:       (isMobile ? -15 : -30) + Math.random() * (isMobile ? 30 : 60),
    duration: (isMobile ? 4.5 : 3.5) + Math.random() * 2.5,
    delay:    (i % 12) * 0.25,
    color:    COLORS[i % COLORS.length],
  }));
}

const Hero = () => {
  const t = useTranslations('Hero');

  /**
   * Particles are generated purely client-side after mount and animated with
   * lightweight CSS @keyframes (no GSAP runtime in the initial Hero bundle).
   * Server always renders an empty array → no hydration mismatch.
   */
  const [particleData, setParticleData] = useState<ParticleData[]>([]);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    setParticleData(generateParticles(isMobile ? 18 : 55, isMobile));
  }, []);

  return (
    <section
      className="relative min-h-screen flex items-center justify-center bg-white dark:bg-gradient-to-br dark:from-primary-600 dark:via-primary-700 dark:to-primary-800 overflow-hidden
        pt-[max(6.75rem,calc(env(safe-area-inset-top,0px)+5.25rem))] pb-10
        sm:pt-16 md:pt-20 lg:pt-10"
    >
      <div
        className="hidden dark:block absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), ' +
            'radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
        }}
      />
      <div className="hidden dark:block absolute inset-0 bg-gradient-to-br from-purple-900 via-gray-900 to-slate-950" aria-hidden="true" />

      {/* Overlay */}
      <div className="hidden dark:block absolute inset-0 bg-gradient-to-r from-primary-500/20 to-transparent animate-pulse" aria-hidden="true" />
      {/* ── Plasma background blobs (CSS-only, SSR-safe) ── */}
      <div className="hidden dark:block absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Purple blob, top left */}
        <div
          className="plasma-blob-a absolute -top-32 -left-32 w-[680px] h-[680px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle at 40% 40%, #7C3AED 0%, #4C1D95 40%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        {/* Green blob, bottom right */}
        <div
          className="plasma-blob-b absolute -bottom-32 -right-32 w-[560px] h-[560px] rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle at 60% 60%, #00FFB2 0%, #059669 40%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        {/* Accent blob, center */}
        <div
          className="plasma-blob-c absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #BF5EFF 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        {/* Scanline vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(4,8,15,0.7) 100%)',
          }}
        />
      </div>
      {/* Grid overlay, over blobs */}
      <div className="hidden dark:block fixed inset-0 grid-overlay pointer-events-none opacity-20" aria-hidden="true" />

      <div
        className="hidden dark:block absolute inset-0 pointer-events-none"
        style={{ zIndex: 3 }}
        aria-hidden="true"
      >
        {particleData.map((p) => {
          const style: ParticleStyle = {
            position:      'absolute',
            width:         `${p.size}px`,
            height:        `${p.size}px`,
            borderRadius:  '50%',
            left:          `${p.left}%`,
            top:           `${p.top}%`,
            background:    p.color.bg,
            boxShadow:     p.color.shadow,
            pointerEvents: 'none',
            '--dx':        `${p.dx.toFixed(1)}px`,
            '--dy':        `${p.dy.toFixed(1)}px`,
            '--dur':       `${p.duration.toFixed(2)}s`,
            '--delay':     `${p.delay.toFixed(2)}s`,
          };
          return (
            <span
              key={p.id}
              className="hero-particle"
              style={style}
            />
          );
        })}
      </div>


      <div className="relative flex flex-col-reverse items-center justify-center gap-6 sm:flex-row sm:items-center sm:justify-between md:gap-10 lg:gap-14">
      {/* Content */}
        <div className="mx-auto px-4 py-10 mt-2.5 relative text-center ">
          {/* Name */}
          <h1
          className="reveal-up"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(3rem, 8vw, 7rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.0,
            animationDelay: '80ms',
          }}
          >
            <span style={{ color: 'var(--color-text)' }}>Jhonny</span>
          <br />
          <span className="text-plasma">Pimiento</span>
          </h1>

          {/* Typewriter role, delegated to client */}
          <HeroClient />
          {/* Tech stack pills */}
        <div
          className="flex flex-wrap justify-center gap-2 mt-8 reveal-up"
          style={{ animationDelay: '320ms' }}
        >
          {['Web3', 'Solidity', 'Next.js', 'AWS', 'Qiskit', 'TypeScript'].map((tech) => (
            <span
              key={tech}
              className="tag-default px-3 py-1 rounded-full text-xs"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {tech}
            </span>
          ))}
        </div>
          {/* CTA buttons */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 reveal-up"
            style={{ animationDelay: '400ms' }}
          >
            <a
              href="#projects"
              className="group relative inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm overflow-hidden transition-all duration-300"
              style={{
                background: 'var(--gradient-plasma)',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                boxShadow: '0 0 32px rgba(124, 58, 237, 0.4)',
              }}
            >
              {t('cta_work')}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a
              href="#contact"
              className="group relative inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm transition-all duration-300 hover:border-plasma bg-slate-100 border border-slate-200 text-slate-900 dark:bg-white/[0.04] dark:border-white/10 dark:text-[color:var(--color-text)]"
              style={{
                fontFamily: 'var(--font-mono)',
              }}
            >
              {t('cta_contact')}
            </a>
          </div>

        </div>
        <div className="relative w-52 h-52 md:w-64 md:h-64 lg:w-80 lg:h-80
          mb-12 sm:mb-20 mx-auto mt-6 sm:mt-24 md:mt-32 lg:mt-36">
          <div className="hidden dark:block absolute -inset-2 rounded-full bg-linear-to-r from-fuchsia-400 to-purple-600 animate-spin-slowest z-0 opacity-40" aria-hidden="true" />
          {/* Avatar visible */}
          <div className="relative z-10 w-full h-full rounded-full overflow-hidden shadow-xl shadow-fuchsia-500/30">
            <Image
              src="/images/image-devcon.jpg"
              alt="Jhonny Pimiento — Senior Software & Web3 Engineer"
              width={320}
              height={320}
              priority
              sizes="(max-width:768px) 208px,(max-width:1024px) 256px,320px"
              className="w-full h-full object-cover object-center rounded-full"
            />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-ping" aria-hidden="true" />
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-400 rounded-full" aria-hidden="true" />
          </div>


      </div>


      {/* Scroll pending */}
      <div className="absolute bottom-[5px] pb-40 left-[41%] hidden dark:lg:block -translate-x-1/2" aria-hidden="true">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
