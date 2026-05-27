import { renderInline } from './inline'

interface Props {
  src: string
  alt: string
  caption?: string
  idx: number
}

/**
 * Editorial figure.
 *
 * Wraps the image in a rounded card with subtle border and renders the
 * caption below in muted small caps. The caption supports inline markdown
 * so authors can credit links, emphasise terms, etc.
 *
 * Uses a plain <img> on purpose: editorial body images come from many
 * hosts (S3, Supabase, Unsplash, hand-uploaded), and routing them through
 * next/image would force authors to update next.config.js every time a
 * new domain shows up. The hero/cover image at the top of the article
 * still uses next/image, that one's known and curated.
 */
export function Figure({ src, alt, caption, idx }: Props) {
  return (
    <figure className="my-8 group/fig">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 ring-1 ring-slate-200/40 shadow-sm
        dark:border-gray-800 dark:bg-gray-900/40 dark:ring-white/[0.02] dark:shadow-lg dark:shadow-black/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="block w-full h-auto object-cover transition duration-500
            group-hover/fig:scale-[1.015]"
        />
      </div>
      {caption && (
        <figcaption className="mt-3 flex items-start gap-2 text-sm text-slate-600 dark:text-gray-400">
          <span
            aria-hidden="true"
            className="mt-1.5 inline-block h-px w-6 shrink-0 bg-orange-500/60"
          />
          <span className="leading-relaxed">
            <span className="mr-1 font-mono text-[11px] uppercase tracking-[0.18em]
              text-orange-300/80">
              Fig. {idx}
            </span>
            {renderInline(caption, `fig-${idx}`)}
          </span>
        </figcaption>
      )}
    </figure>
  )
}
