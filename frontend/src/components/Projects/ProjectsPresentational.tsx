'use client';

import { FC, useEffect, useRef, useState } from 'react';
import { Project, ProjectsData } from './Projects.types';
import gsap from 'gsap';

interface Props {
  data: ProjectsData;
  projects: Project[];
  featuredProjects: Project[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

// Glow values por accentColor — leídos por proyecto, no por array
const ACCENT = {
  purple: {
    border: 'rgba(124, 58, 237, 0.4)',
    glow:   '0 0 40px rgba(124, 58, 237, 0.35), 0 0 80px rgba(124, 58, 237, 0.15)',
    stripe: 'linear-gradient(90deg, transparent, #7C3AED, #BF5EFF, transparent)',
  },
  green: {
    border: 'rgba(16, 185, 129, 0.35)',
    glow:   '0 0 40px rgba(16, 185, 129, 0.3), 0 0 80px rgba(16, 185, 129, 0.12)',
    stripe: 'linear-gradient(90deg, transparent, #059669, #00FFB2, transparent)',
  },
} as const;

// Card individual con hover gestionado por state local
const ProjectCard: FC<{ project: Project; idx: number; cardRef: (el: HTMLDivElement | null) => void }> = ({
  project,
  cardRef,
}) => {
  const [hovered, setHovered] = useState(false);
  const accent = ACCENT[project.accentColor ?? 'purple'];

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col h-full rounded-2xl overflow-hidden transition-transform duration-300"
      style={{
        background:  'var(--color-surface-2)',
        border:      `1px solid ${accent.border}`,
        boxShadow:   hovered ? accent.glow : 'var(--shadow-card)',
        transform:   hovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      {/* Stripe top */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{ background: accent.stripe }}
        aria-hidden="true"
      />

      {/* Imagen */}
      <img
        src={project.image}
        alt={project.title}
        className="w-full h-40 object-cover"
        style={{ borderBottom: `1px solid ${accent.border}` }}
      />

      {/* Body */}
      <div className="flex flex-col flex-1 p-6">
        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-bold uppercase"
            style={{
              fontFamily: 'var(--font-mono)',
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--color-text-muted)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {project.category}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              project.status === 'completed'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : project.status === 'in-progress'
                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
            }`}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {project.status === 'completed' ? '● Completed'
              : project.status === 'in-progress' ? '◌ In Progress'
              : project.status}
          </span>
          <span
            className="ml-auto text-xs"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-faint)' }}
          >
            {project.year}
          </span>
        </div>

        {/* Title */}
        <h3
          className="text-xl font-bold mb-2 leading-tight transition-colors duration-200"
          style={{
            fontFamily: 'var(--font-display)',
            color: hovered
              ? project.accentColor === 'green'
                ? 'var(--color-green-neon)'
                : 'var(--color-purple-neon)'
              : 'var(--color-text)',
          }}
        >
          {project.title}
        </h3>

        {/* Description */}
        <p className="text-sm leading-relaxed flex-1 mb-4" style={{ color: 'var(--color-text-muted)' }}>
          {project.description}
        </p>

        {/* Tech tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.technologies.map(tech => (
            <span
              key={tech}
              className="text-xs px-2.5 py-0.5 rounded-full"
              style={{
                fontFamily:  'var(--font-mono)',
                background:  project.accentColor === 'purple'
                  ? 'rgba(124,58,237,0.15)'
                  : 'rgba(16,185,129,0.12)',
                color:       project.accentColor === 'purple'
                  ? 'var(--color-purple-neon)'
                  : 'var(--color-green-neon)',
                border: `1px solid ${accent.border}`,
              }}
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Links */}
        <div className="flex items-center gap-3 mt-auto">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs transition-colors duration-200 hover:text-purple-300"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs transition-colors duration-200 hover:text-emerald-300"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Demo
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs transition-all duration-200 ml-auto"
              style={{
                fontFamily: 'var(--font-mono)',
                color:      'var(--color-green-neon)',
                padding:    '4px 12px',
                background: 'rgba(16,185,129,0.1)',
                border:     '1px solid rgba(16,185,129,0.3)',
                borderRadius: '999px',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--color-green-neon)', boxShadow: '0 0 6px var(--color-green-neon)' }}
              />
              Live
            </a>
          )}
        </div>
      </div>

      {/* Featured badge */}
      {project.featured && (
        <span
          className="absolute top-3 right-3 text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold"
          style={{
            fontFamily: 'var(--font-mono)',
            background: 'var(--gradient-plasma)',
            boxShadow:  '0 0 12px rgba(124,58,237,0.4)',
          }}
        >
          ★ Featured
        </span>
      )}
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────
export const ProjectsPresentational: FC<Props> = ({
  data,
  projects,
  selectedCategory,
  onCategoryChange,
}) => {
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (cardsRef.current.length === 0) return;
    gsap.fromTo(
      cardsRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.6, ease: 'power3.out' }
    );
  }, [projects]);

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <h2
          className="text-4xl font-bold text-center mb-3"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
        >
          {data.title}
        </h2>
        <p className="text-center mb-12 max-w-2xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
          {data.subtitle}
        </p>

        {/* Filter tabs */}
        <div
          className="flex justify-center gap-1 p-1.5 mb-12 rounded-full mx-auto w-fit"
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
          }}
        >
          {data.categories.map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={isActive}
                onClick={() => onCategoryChange(cat)}
                className="px-4 py-1.5 rounded-full text-sm transition-all duration-200"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize:   '13px',
                  background: isActive ? 'var(--gradient-plasma)' : 'transparent',
                  color:      isActive ? '#fff' : 'var(--color-text-muted)',
                  boxShadow:  isActive ? '0 0 20px rgba(124,58,237,0.3)' : 'none',
                  cursor:     'pointer',
                  border:     'none',
                }}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            );
          })}
        </div>

        {/* Grid — cada card es un grid item directo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, idx) => (
            <ProjectCard
              key={project.id}
              project={project}
              idx={idx}
              cardRef={el => { if (el) cardsRef.current[idx] = el; }}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
