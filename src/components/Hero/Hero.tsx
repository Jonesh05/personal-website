'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Hero = () => {
  // Sólo los refs que realmente usas
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const title = titleRef.current;
    const subtitle = subtitleRef.current;
    const buttons = buttonsRef.current;
    const particles = particlesRef.current;
    if (!container || !title || !subtitle || !buttons || !particles) return;

    // 1) Crear partículas
    const createParticles = () => {
      for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'absolute w-2 h-2 bg-white/20 rounded-full';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particles.appendChild(particle);
      }
    };
    createParticles();

    // 2) Estados iniciales: título, subtítulo y botones
    gsap.set([title, subtitle, buttons], {
      opacity: 0,
      y: 100,
      scale: 0.8
    });

    // 3) Timeline de entrada
    const tl = gsap.timeline();
    tl.to(title, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 1.2,
      ease: 'power3.out'
    })
      .to(
        subtitle,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: 'power3.out'
        },
        '-=0.8'
      )
      .to(
        buttons,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out'
        },
        '-=0.6'
      );

    // 4) Animación de partículas flotantes
    const particleEls = particles.querySelectorAll<HTMLDivElement>('div');
    particleEls.forEach((p, i) => {
      gsap.to(p, {
        y: -30 + Math.random() * 60,
        x: -20 + Math.random() * 40,
        duration: 3 + Math.random() * 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.1
      });
    });

    // 5) ScrollTrigger para parallax
    ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
      onUpdate: (self) => {
        const p = self.progress;
        // Parallax título
        gsap.to(title, {
          y: p * -100,
          scale: 1 - p * 0.3,
          opacity: 1 - p * 0.5,
          duration: 0.3
        });
        // Parallax subtítulo
        gsap.to(subtitle, {
          y: p * -80,
          opacity: 1 - p * 0.7,
          duration: 0.3
        });
        // Parallax botones
        gsap.to(buttons, {
          y: p * -60,
          opacity: 1 - p * 0.8,
          duration: 0.3
        });
        // Fondo parallax
        gsap.to(container, {
          backgroundPosition: `50% ${50 + p * 30}%`,
          duration: 0.3
        });
      }
    });

    // 6) Limpieza al desmontar
    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

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
      {/* Partículas */}
      <div ref={particlesRef} className="absolute inset-0 overflow-hidden pointer-events-none" />

      {/* Overlay ligero */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-transparent animate-pulse" />

      {/* Contenido */}
      <div className="container mx-auto px-4 py-20 relative z-10 text-center">
        <h1
          ref={titleRef}
          className="text-5xl md:text-7xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80"
        >
          Jhonny Pimiento
        </h1>
        <p ref={subtitleRef} className="text-2xl md:text-3xl text-white/90 mb-8 font-light">
          Web3 & Blockchain Developer | Colombian Entrepreneur
        </p>
        <div ref={buttonsRef} className="flex flex-col md:flex-row gap-4 justify-center">
          <Link
            href="#contact"
            className="px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Get in Touch
          </Link>
          <Link
            href="#projects"
            className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
          >
            View My Work
          </Link>
        </div>
      </div>

      {/* Indicador de scroll animado con Tailwind */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
