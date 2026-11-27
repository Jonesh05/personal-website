'use client';

// Zero-HTTP-Request Deterministic Vector Banner & Badge Engine for Project Cards.
//
// Why this exists:
// - Replaces runtime `/api/og/project` raster image requests inside `<ProjectCard />`
//   so cards render in 0ms on first paint with zero network waterfalls, zero layout
//   shift, and crystal-clear Retina/4K vector fidelity.
// - Follows Domain-Driven Design (DDD) value-object semantics: given a project's
//   immutable domain attributes (`id`, `title`, `category`, `accentColor`,
//   `technologies`), it deterministically computes a unique geometric blueprint,
//   circuit topology, and interactive badge hierarchy using design system tokens.

import { FC } from 'react';
import type { Project } from './Projects.types';

interface ProjectCardVisualProps {
  project: Project;
  hovered: boolean;
  statusLabel: string;
  featuredLabel: string;
}

/** Deterministic 32-bit FNV-1a hash from project title/id for unique visual seeds. */
function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const PALETTE = {
  purple: {
    bgStart:      '#0a0614',
    bgEnd:        '#1a0d33',
    primary:      '#BF5EFF',
    secondary:    '#7C3AED',
    glow:         'rgba(191, 94, 255, 0.32)',
    pillBg:       'rgba(124, 58, 237, 0.22)',
    pillBorder:   'rgba(191, 94, 255, 0.38)',
    pillText:     '#e9d5ff',
  },
  green: {
    bgStart:      '#030f0b',
    bgEnd:        '#09261b',
    primary:      '#00FFB2',
    secondary:    '#059669',
    glow:         'rgba(0, 255, 178, 0.28)',
    pillBg:       'rgba(5, 150, 105, 0.22)',
    pillBorder:   'rgba(0, 255, 178, 0.35)',
    pillText:     '#a7f3d0',
  },
} as const;

/** Category-specific vector glyph rendered in the blueprint corner. */
function CategoryGlyph({
  category,
  color,
}: {
  category: Project['category'];
  color: string;
}) {
  if (category === 'blockchain') {
    // Isometric Hex-Cube Node
    return (
      <g stroke={color} strokeWidth="1.5" fill="none" opacity="0.85">
        <polygon points="20,4 34,12 34,28 20,36 6,28 6,12" />
        <polyline points="6,12 20,20 34,12" />
        <line x1="20" y1="20" x2="20" y2="36" />
        <circle cx="20" cy="4" r="2" fill={color} />
        <circle cx="34" cy="12" r="2" fill={color} />
        <circle cx="6" cy="12" r="2" fill={color} />
        <circle cx="20" cy="20" r="2.5" fill={color} />
      </g>
    );
  }

  if (category === 'AI/ML') {
    // Neural Tensor Graph
    return (
      <g stroke={color} strokeWidth="1.5" fill="none" opacity="0.85">
        <line x1="8" y1="10" x2="20" y2="6" />
        <line x1="8" y1="10" x2="20" y2="20" />
        <line x1="8" y1="30" x2="20" y2="20" />
        <line x1="8" y1="30" x2="20" y2="34" />
        <line x1="20" y1="6" x2="32" y2="20" />
        <line x1="20" y1="20" x2="32" y2="20" />
        <line x1="20" y1="34" x2="32" y2="20" />
        <circle cx="8" cy="10" r="3" fill="#080E18" stroke={color} />
        <circle cx="8" cy="30" r="3" fill="#080E18" stroke={color} />
        <circle cx="20" cy="6" r="3" fill="#080E18" stroke={color} />
        <circle cx="20" cy="20" r="3.5" fill={color} />
        <circle cx="20" cy="34" r="3" fill="#080E18" stroke={color} />
        <circle cx="32" cy="20" r="3.5" fill={color} />
      </g>
    );
  }

  // Default: Web / Execution Layer Terminal Architecture
  return (
    <g stroke={color} strokeWidth="1.5" fill="none" opacity="0.85">
      <rect x="4" y="6" width="32" height="28" rx="4" />
      <line x1="4" y1="13" x2="36" y2="13" />
      <polyline points="11,19 16,23 11,27" />
      <line x1="19" y1="27" x2="27" y2="27" />
    </g>
  );
}

export const ProjectCardVisual: FC<ProjectCardVisualProps> = ({
  project,
  hovered,
  statusLabel,
  featuredLabel,
}) => {
  const theme = PALETTE[project.accentColor ?? 'purple'];
  const seed = hashSeed(`${project.id}:${project.title}`);

  // Deterministic coordinates derived from the project hash
  const orbX = 240 + (seed % 110);
  const orbY = 30 + ((seed >> 4) % 60);
  const nodeA = 55 + ((seed >> 8) % 70);
  const nodeB = 115 + ((seed >> 12) % 85);
  const primaryTechs = project.technologies.slice(0, 3);
  const extraTechCount = Math.max(0, project.technologies.length - 3);

  return (
    <div
      className="relative w-full h-44 overflow-hidden select-none"
      style={{
        background: `linear-gradient(135deg, ${theme.bgStart} 0%, ${theme.bgEnd} 100%)`,
        borderBottom: `1px solid ${
          project.accentColor === 'green'
            ? 'rgba(16, 185, 129, 0.35)'
            : 'rgba(124, 58, 237, 0.4)'
        }`,
      }}
    >
      {/* Inline Vector Blueprint SVG (0 network cost, instant SSR/CSR paint) */}
      <svg
        viewBox="0 0 400 176"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full transition-transform duration-500 ease-out"
        style={{
          transform: hovered ? 'scale(1.035)' : 'scale(1)',
        }}
        aria-hidden="true"
      >
        <defs>
          <pattern
            id={`grid-${project.id}`}
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
            <circle cx="24" cy="24" r="1" fill="rgba(255,255,255,0.12)" />
          </pattern>

          <radialGradient id={`glow-${project.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity="0.32" />
            <stop offset="100%" stopColor={theme.primary} stopOpacity="0" />
          </radialGradient>

          <linearGradient id={`trace-${project.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={theme.secondary} stopOpacity="0.1" />
            <stop offset="60%" stopColor={theme.primary} stopOpacity="0.65" />
            <stop offset="100%" stopColor={theme.primary} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Architectural Grid */}
        <rect width="400" height="176" fill={`url(#grid-${project.id})`} />

        {/* Ambient Plasma Orb */}
        <circle
          cx={orbX}
          cy={orbY}
          r={hovered ? 115 : 95}
          fill={`url(#glow-${project.id})`}
        />

        {/* Deterministic Circuit Traces */}
        <g stroke={`url(#trace-${project.id})`} strokeWidth="1.25" fill="none">
          <path d={`M 0 ${nodeA} H ${nodeB} L ${nodeB + 28} ${nodeA + 28} H 390`} />
          <path
            d={`M ${nodeB - 30} 176 L ${nodeB} ${nodeA + 44} H ${orbX}`}
            strokeDasharray="4 4"
          />
          <circle cx={nodeB} cy={nodeA} r="2.5" fill={theme.primary} opacity="0.7" />
          <circle
            cx={nodeB + 28}
            cy={nodeA + 28}
            r="2.5"
            fill={theme.primary}
            opacity="0.7"
          />
        </g>

        {/* Category Blueprint Glyph */}
        <g transform="translate(338, 44)">
          <CategoryGlyph category={project.category} color={theme.primary} />
        </g>
      </svg>

      {/* Bottom Vignette for High-Contrast Badge Readability */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(4,8,15,0.15) 0%, transparent 40%, ${theme.bgStart}e6 100%)`,
        }}
      />

      {/* Top HUD Bar: Category Chip + Status / Featured Badges */}
      <div className="absolute top-3 inset-x-3.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* Category Badge */}
          <span
            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.14em] backdrop-blur-md"
            style={{
              fontFamily: 'var(--font-mono)',
              background: theme.pillBg,
              border: `1px solid ${theme.pillBorder}`,
              color: theme.pillText,
            }}
          >
            {project.category}
          </span>

          {/* Year Chip */}
          <span
            className="px-2 py-0.5 rounded-full text-[10px] backdrop-blur-md"
            style={{
              fontFamily: 'var(--font-mono)',
              background: 'rgba(8, 14, 24, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(232, 240, 254, 0.72)',
            }}
          >
            {project.year}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Featured Badge */}
          {project.featured && (
            <span
              className="text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase"
              style={{
                fontFamily: 'var(--font-mono)',
                background: 'var(--gradient-plasma)',
                boxShadow: '0 0 12px rgba(124, 58, 237, 0.45)',
              }}
            >
              {featuredLabel}
            </span>
          )}
        </div>
      </div>

      {/* Bottom HUD Overlay: Architecture Stack Badges & Live Status */}
      <div className="absolute bottom-3 inset-x-3.5 flex items-end justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {primaryTechs.map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium backdrop-blur-md transition-colors"
              style={{
                fontFamily: 'var(--font-mono)',
                background: 'rgba(8, 14, 24, 0.78)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#e2e8f0',
              }}
            >
              {tech}
            </span>
          ))}
          {extraTechCount > 0 && (
            <span
              className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold backdrop-blur-md"
              style={{
                fontFamily: 'var(--font-mono)',
                background: theme.pillBg,
                border: `1px solid ${theme.pillBorder}`,
                color: theme.pillText,
              }}
            >
              +{extraTechCount}
            </span>
          )}
        </div>

        {/* Status Pill */}
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-md shrink-0 ${
            project.status === 'completed'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/35'
              : project.status === 'in-progress'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/35'
              : 'bg-slate-500/20 text-slate-300 border border-slate-500/35'
          }`}
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {statusLabel}
        </span>
      </div>
    </div>
  );
};

export default ProjectCardVisual;
