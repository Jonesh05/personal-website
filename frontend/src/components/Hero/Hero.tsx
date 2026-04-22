'use client';

import { useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';
import { HeroClient } from './HeroClient'

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  
  // Datos de partículas generados una sola vez (estables entre renders)
  const particleData = useMemo(() => {
    const COLORS = [
      { bg: 'rgba(191, 94, 255, 0.9)',  shadow: '0 0 8px 2px rgba(191, 94, 255, 0.7)'  },
      { bg: 'rgba(0, 255, 178, 0.9)',   shadow: '0 0 8px 2px rgba(0, 255, 178, 0.7)'   },
      { bg: 'rgba(255, 255, 255, 0.7)', shadow: '0 0 5px 1px rgba(255, 255, 255, 0.4)' },
    ];
    return Array.from({ length: 55 }, (_, i) => ({
      id:     i,
      size:   2 + Math.random() * 4,
      left:   Math.random() * 100,
      top:    Math.random() * 100,
      color:  COLORS[i % COLORS.length],
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Effect 1: entrada del hero + parallax (no toca partículas) ──
  useEffect(() => {
    const container = containerRef.current;
    const title     = titleRef.current;
    const subtitle  = subtitleRef.current;
    const buttons   = buttonsRef.current;
    if (!container || !title || !subtitle || !buttons) return;

    // Estados iniciales
    gsap.set([title, subtitle, buttons], { opacity: 0, y: 100, scale: 0.8 });

    // Timeline de entrada
    const tl = gsap.timeline();
    tl.to(title,    { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power3.out' })
      .to(subtitle, { opacity: 1, y: 0, scale: 1, duration: 1,   ease: 'power3.out' }, '-=0.8')
      .to(buttons,  { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' }, '-=0.6');

    // ScrollTrigger parallax
    ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
      onUpdate: (self) => {
        const p = self.progress;
        gsap.to(title,    { y: p * -100, scale: 1 - p * 0.3, opacity: 1 - p * 0.5, duration: 0.3 });
        gsap.to(subtitle, { y: p * -80,  opacity: 1 - p * 0.7, duration: 0.3 });
        gsap.to(buttons,  { y: p * -60,  opacity: 1 - p * 0.8, duration: 0.3 });
        gsap.to(container, { backgroundPosition: `50% ${50 + p * 30}%`, duration: 0.3 });
      },
    });

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  // ── Effect 2: animación flotante de partículas ──
  // Corre DESPUÉS de que React pinta los <span data-particle> en el DOM
  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;

    const els = container.querySelectorAll<HTMLElement>('[data-particle]');
    if (els.length === 0) return;

    const tweens = Array.from(els).map((el, i) =>
      gsap.to(el, {
        y:        -30 + Math.random() * 60,
        x:        -20 + Math.random() * 40,
        duration: 3 + Math.random() * 2,
        repeat:   -1,
        yoyo:     true,
        ease:     'sine.inOut',
        delay:    i * 0.08,
      })
    );

    return () => tweens.forEach((t) => t.kill());
  }, [particleData]); // particleData estable, corre 1 vez tras el primer paint

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 overflow-hidden"
      style={{
        
        backgroundImage:
          'radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), ' +
          'radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)'
      }}
    >
      <div ref={glowRef} className="absolute inset-0 bg-gradient-to-br from-purple-900 via-gray-900 to-slate-950"/>

      {/* Overlay ligero */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-transparent animate-pulse" />
      {/* ── Plasma background blobs (CSS-only, SSR-safe) ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Purple blob — top left */}
        <div
          className="plasma-blob-a absolute -top-32 -left-32 w-[680px] h-[680px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle at 40% 40%, #7C3AED 0%, #4C1D95 40%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        {/* Green blob — bottom right */}
        <div
          className="plasma-blob-b absolute -bottom-32 -right-32 w-[560px] h-[560px] rounded-full opacity-25"
          style={{
            background: 'radial-gradient(circle at 60% 60%, #00FFB2 0%, #059669 40%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        {/* Accent blob — center */}
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
      {/* Grid overlay — encima de blobs */}
      <div className="fixed inset-0 grid-overlay pointer-events-none opacity-20" aria-hidden="true" />
      {/* Partículas — renderizadas por React, animadas por GSAP */}
      <div
        ref={particlesRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 3 }}
      >
        {particleData.map((p) => (
          <span
            key={p.id}
            data-particle
            style={{
              position:    'absolute',
              width:       `${p.size}px`,
              height:      `${p.size}px`,
              borderRadius: '50%',
              left:        `${p.left}%`,
              top:         `${p.top}%`,
              background:  p.color.bg,
              boxShadow:   p.color.shadow,
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>

      
      <div className="relative flex flex-col-reverse items-center justify-center gap-6 sm:flex-row sm:items-center sm:justify-between md:gap-10 lg:gap-14">
      {/* Contenido */}
        <div className="mx-auto px-4 py-20 relative z-10 text-center">
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
            <span
              ref={titleRef}
              style={{ color: 'var(--color-text)' }}>Jhonny</span>
          <br />
          <span className="text-plasma">Pimiento</span>
          </h1>

          {/* Typewriter role — delegated to client */}
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
              View My Work
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a
              href="#contact"
              className="group relative inline-flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-sm transition-all duration-300 hover:border-plasma"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--color-text)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Get in Touch
            </a>
          </div>

        </div>
        <div className="relative w-52 h-52 mb-40 mx-auto">
          {/* Spinners */}
          {/* <div className="absolute -inset-6 rounded-full bg-linear-to-r from-fuchsia-500 via-purple-600 to-indigo-500 animate-spin-slow z-0 blur-md opacity-70"></div>
          <div className="absolute -inset-4 rounded-full bg-linear-to-r from-purple-500 via-fuchsia-400 to-pink-500 animate-spin-reverse-slower z-0 blur-xs opacity-60"></div> */}
          <div className="absolute -inset-2 rounded-full bg-linear-to-r from-fuchsia-400 to-purple-600 animate-spin-slowest z-0 opacity-40"></div>
          {/* Avatar visible */}
          <div className="relative z-10 w-full h-full rounded-full overflow-hidden shadow-xl shadow-fuchsia-500/30">
            <Image
              src="/images/about.webp"
              alt="Avatar"
              width={208}
              height={208}
              className="w-full h-full object-cover object-center rounded-full"
            />
            
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-ping"></div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-400 rounded-full"></div>
          </div>
        
        
      </div>
      

      {/* Scroll pending */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
