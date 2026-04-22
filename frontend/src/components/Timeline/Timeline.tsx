'use client';

/**
 * Timeline — cyberpunk vertical-spine layout.
 *
 * Architectural boundaries:
 *   • Data  : `timeline.data.ts` (typed, never renders)
 *   • Copy  : `i18n/locales/{en,es}.ts` under the `Timeline` namespace
 *   • View  : this file — pure composition over the two above
 *
 * Translation rules enforced here:
 *   • Entry `title` is rendered verbatim (English only).
 *   • Entry descriptions + category labels resolve through `useTranslations`.
 *   • Tag pills are literal strings; tech/brand terms already live in
 *     `STATIC_KEYS` so they won't localize.
 *
 * Layout:
 *   • Mobile (< lg): single column, spine anchored 22px from the left.
 *   • Desktop (>= lg): centered spine, alternating cards on either side.
 *   • No external libs — depth is simulated with layered gradients, blurs,
 *     and controlled hover transitions.
 */

import type { FC } from 'react';
import { useTranslations } from '@/i18n';
import {
  TIMELINE_ENTRIES,
  type TimelineCategory,
  type TimelineEntry,
} from './timeline.data';

// ─── Accent palette ────────────────────────────────────────────────────────
// Each category carries its own colour identity so the eye can scan the
// timeline by theme. Purple = career / product; green = foundations /
// research; the current milestone amplifies both into the plasma gradient.
interface Accent {
  base: string;         // solid colour (node border, category label, tag text)
  glow: string;         // rgba used for box-shadow / hover glow
  ring: string;         // ping-ring colour for the active node
  chipBg: string;       // tag pill background
  chipBorder: string;   // tag pill border
  stripe: string;       // card top stripe gradient
}

const ACCENTS: Record<TimelineCategory, Accent> = {
  foundations: {
    base:       '#00FFB2',
    glow:       'rgba(0, 255, 178, 0.32)',
    ring:       'rgba(0, 255, 178, 0.45)',
    chipBg:     'rgba(0, 255, 178, 0.08)',
    chipBorder: 'rgba(0, 255, 178, 0.30)',
    stripe:     'linear-gradient(90deg, transparent, #00FFB2, transparent)',
  },
  career: {
    base:       '#BF5EFF',
    glow:       'rgba(191, 94, 255, 0.35)',
    ring:       'rgba(191, 94, 255, 0.5)',
    chipBg:     'rgba(191, 94, 255, 0.10)',
    chipBorder: 'rgba(191, 94, 255, 0.32)',
    stripe:     'linear-gradient(90deg, transparent, #BF5EFF, transparent)',
  },
  product: {
    base:       '#7C3AED',
    glow:       'rgba(124, 58, 237, 0.38)',
    ring:       'rgba(124, 58, 237, 0.5)',
    chipBg:     'rgba(124, 58, 237, 0.12)',
    chipBorder: 'rgba(124, 58, 237, 0.35)',
    stripe:     'linear-gradient(90deg, transparent, #7C3AED, #BF5EFF, transparent)',
  },
  research: {
    base:       '#00FFB2',
    glow:       'rgba(5, 150, 105, 0.35)',
    ring:       'rgba(5, 150, 105, 0.5)',
    chipBg:     'rgba(16, 185, 129, 0.10)',
    chipBorder: 'rgba(16, 185, 129, 0.32)',
    stripe:     'linear-gradient(90deg, transparent, #00FFB2, #059669, transparent)',
  },
  current: {
    base:       '#F0B0FF',
    glow:       'rgba(191, 94, 255, 0.55)',
    ring:       'rgba(191, 94, 255, 0.65)',
    chipBg:     'rgba(191, 94, 255, 0.16)',
    chipBorder: 'rgba(191, 94, 255, 0.45)',
    stripe:     'linear-gradient(90deg, transparent, #7C3AED, #BF5EFF, #00FFB2, transparent)',
  },
};

// ─── Spine ─────────────────────────────────────────────────────────────────
const Spine: FC = () => (
  <>
    {/* Mobile spine — anchored to the left of the node column. */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 bottom-0 left-[22px] w-px lg:hidden"
      style={{
        background:
          'linear-gradient(to bottom, rgba(124,58,237,0) 0%, rgba(124,58,237,0.45) 12%, rgba(191,94,255,0.55) 50%, rgba(0,255,178,0.45) 88%, rgba(0,255,178,0) 100%)',
      }}
    />
    {/* Desktop spine — perfectly centered. */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-0 bottom-0 hidden lg:block left-1/2 w-px -translate-x-1/2"
      style={{
        background:
          'linear-gradient(to bottom, rgba(124,58,237,0) 0%, rgba(124,58,237,0.5) 10%, rgba(191,94,255,0.6) 50%, rgba(0,255,178,0.5) 90%, rgba(0,255,178,0) 100%)',
      }}
    />
  </>
);

// ─── Node ──────────────────────────────────────────────────────────────────
interface NodeProps {
  entry: TimelineEntry;
  accent: Accent;
}

const Node: FC<NodeProps> = ({ entry, accent }) => {
  const yearShort = String(entry.year).slice(-2);
  return (
    <div className="relative flex h-12 w-12 items-center justify-center">
      {/* Pulse ring for the active milestone — pure CSS, no JS driver. */}
      {entry.current && (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: accent.ring, opacity: 0.35 }}
        />
      )}
      {/* Outer halo */}
      <span
        aria-hidden="true"
        className="absolute inset-[-6px] rounded-full opacity-80"
        style={{
          background: `radial-gradient(circle, ${accent.glow} 0%, transparent 70%)`,
        }}
      />
      {/* Core */}
      <span
        className="relative flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${accent.chipBg} 0%, rgba(9,11,18,0.95) 65%)`,
          border: `1px solid ${accent.base}`,
          boxShadow: `0 0 20px ${accent.glow}, inset 0 0 10px ${accent.glow}`,
        }}
      >
        <span
          className="text-[11px] font-semibold tracking-wider"
          style={{
            fontFamily: 'var(--font-mono)',
            color: accent.base,
            textShadow: `0 0 6px ${accent.glow}`,
          }}
        >
          &apos;{yearShort}
        </span>
      </span>
    </div>
  );
};

// ─── Card ──────────────────────────────────────────────────────────────────
interface CardProps {
  entry: TimelineEntry;
  accent: Accent;
  /** `right`: card sits left of the spine → text aligns right on desktop. */
  alignment: 'left' | 'right';
  t: (key: string) => string;
}

const Card: FC<CardProps> = ({ entry, accent, alignment, t }) => {
  // On mobile the card is always left-aligned. `lg:` variants drive the
  // alternating right-align behaviour on desktop only.
  const desktopAlign =
    alignment === 'right' ? 'lg:text-right' : 'lg:text-left';
  const desktopRowAlign =
    alignment === 'right' ? 'lg:justify-end' : 'lg:justify-start';

  return (
    <article
      aria-current={entry.current ? 'step' : undefined}
      className={`group relative rounded-2xl p-6 transition-transform duration-300 ease-out hover:-translate-y-1 ${desktopAlign}`}
      style={{
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
      }}
    >
      {/* Top accent stripe */}
      <span
        aria-hidden="true"
        className="absolute inset-x-6 top-0 h-px opacity-70"
        style={{ background: accent.stripe }}
      />
      {/* Hover glow — activates via group-hover for smooth affordance */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          boxShadow: `0 0 40px ${accent.glow}, inset 0 0 24px ${accent.chipBg}`,
          border: `1px solid ${accent.chipBorder}`,
        }}
      />

      {/* Header row: category label + optional Now badge */}
      <div className={`flex items-center gap-2 flex-wrap ${desktopRowAlign}`}>
        <span
          className="text-[10px] uppercase tracking-[0.22em]"
          style={{
            fontFamily: 'var(--font-mono)',
            color: accent.base,
          }}
        >
          {t(entry.categoryKey)}
        </span>
        {entry.current && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              fontFamily: 'var(--font-mono)',
              background: 'var(--gradient-plasma)',
              color: '#fff',
              boxShadow: '0 0 14px rgba(124,58,237,0.55)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {t('now_badge')}
          </span>
        )}
      </div>

      {/* Year — semantic <time> */}
      <time
        dateTime={String(entry.year)}
        className="mt-2 block text-xs"
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-faint)',
          letterSpacing: '0.08em',
        }}
      >
        {entry.year}
      </time>

      {/* Title — English only, never translated. */}
      <h3
        className="mt-1 leading-tight"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.15rem, 1.8vw, 1.4rem)',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: 'var(--color-text)',
        }}
      >
        {entry.title}
      </h3>

      {/* Description — localized */}
      <p
        className="mt-3 text-sm leading-relaxed"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {t(entry.descriptionKey)}
      </p>

      {/* Tag pills */}
      {entry.tags && entry.tags.length > 0 && (
        <ul
          className={`mt-4 flex flex-wrap gap-1.5 ${desktopRowAlign}`}
          aria-label="Tags"
        >
          {entry.tags.map((tag) => (
            <li key={tag}>
              <span
                className="text-[11px] px-2 py-0.5 rounded-full"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: accent.base,
                  background: accent.chipBg,
                  border: `1px solid ${accent.chipBorder}`,
                }}
              >
                {tag}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
};

// ─── Row ───────────────────────────────────────────────────────────────────
// One entry = one `<li>`. The node is absolutely positioned so the card can
// flow naturally in its column.
interface RowProps {
  entry: TimelineEntry;
  index: number;
  t: (key: string) => string;
}

const Row: FC<RowProps> = ({ entry, index, t }) => {
  const accent = ACCENTS[entry.category];
  // Even index → card on the LEFT of the spine (so it text-aligns right).
  const leftOfSpine = index % 2 === 0;

  // Tailwind-only alignment: card occupies the appropriate desktop column
  // via margins. This keeps the spine untouched by JS and reflows perfectly
  // when the viewport resizes.
  const desktopSide = leftOfSpine
    ? 'lg:mr-[calc(50%+36px)]'
    : 'lg:ml-[calc(50%+36px)]';

  return (
    <li className="relative pb-14 last:pb-0">
      {/* Node: mobile on the left spine, desktop on the centred spine. */}
      <div className="absolute left-0 top-0 z-10 lg:left-1/2 lg:-translate-x-1/2">
        <Node entry={entry} accent={accent} />
      </div>

      {/* Card: shifts to the correct side of the spine on desktop. */}
      <div className={`pl-16 lg:pl-0 ${desktopSide}`}>
        <Card
          entry={entry}
          accent={accent}
          alignment={leftOfSpine ? 'right' : 'left'}
          t={t}
        />
      </div>
    </li>
  );
};

// ─── Timeline ──────────────────────────────────────────────────────────────
const Timeline: FC = () => {
  const t = useTranslations('Timeline');

  return (
    <section
      id="timeline"
      className="relative py-24 overflow-hidden"
      aria-labelledby="timeline-heading"
    >
      {/* Ambient background — subtle plasma wash, zero motion cost. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(ellipse 600px 400px at 20% 10%, rgba(124,58,237,0.15) 0%, transparent 55%), ' +
            'radial-gradient(ellipse 500px 400px at 80% 90%, rgba(0,255,178,0.10) 0%, transparent 55%)',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6">
        {/* Section header */}
        <header className="text-center mb-16">
          <p
            className="text-xs uppercase tracking-[0.28em]"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-green-neon)',
            }}
          >
            {t('section_label')}
          </p>
          <h2
            id="timeline-heading"
            className="mt-3"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 4.5vw, 3.4rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              color: 'var(--color-text)',
            }}
          >
            {t('heading')}
          </h2>
          <p
            className="mt-5 mx-auto max-w-2xl text-sm sm:text-base leading-relaxed"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {t('subtitle')}
          </p>
        </header>

        {/* Timeline list */}
        <ol className="relative" aria-label="Career milestones">
          <Spine />
          {TIMELINE_ENTRIES.map((entry, index) => (
            <Row key={entry.id} entry={entry} index={index} t={t} />
          ))}
        </ol>
      </div>
    </section>
  );
};

export default Timeline;
