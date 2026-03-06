'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HeroAnimations({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const particles = particlesRef.current;
    if (!container || !particles) return;

    const title = container.querySelector('.hero-title');
    const subtitle = container.querySelector('.hero-subtitle');
    const buttons = container.querySelector('.hero-buttons');

    if (!title || !subtitle || !buttons) return;

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

    // 2) Estados iniciales
    gsap.set([title, subtitle, buttons], {
      opacity: 0,
      y: 100,
      scale: 0.8
    });

    // 3) Timeline
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

    // 4) Animación partículas
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

    // 5) ScrollTrigger
    const st = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
      onUpdate: (self) => {
        const p = self.progress;
        gsap.to(title, {
          y: p * -100,
          scale: 1 - p * 0.3,
          opacity: 1 - p * 0.5,
          duration: 0.3
        });
        gsap.to(subtitle, {
          y: p * -80,
          opacity: 1 - p * 0.7,
          duration: 0.3
        });
        gsap.to(buttons, {
          y: p * -60,
          opacity: 1 - p * 0.8,
          duration: 0.3
        });
        gsap.to(container, {
          backgroundPosition: `50% ${50 + p * 30}%`,
          duration: 0.3
        });
      }
    });

    return () => {
      tl.kill();
      st.kill();
      // Clean up particles
      if (particles) {
        particles.innerHTML = '';
      }
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
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-fuchsia-900 to-fuchsia-800"/>
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-transparent animate-pulse" />
      <div ref={particlesRef} className="absolute inset-0 overflow-hidden pointer-events-none" />
      
      {children}
    </section>
  );
}
