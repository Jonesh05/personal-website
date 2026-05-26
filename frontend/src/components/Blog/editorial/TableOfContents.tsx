'use client'

import { useEffect, useState } from 'react'
import type { TocEntry } from '@personal-website/shared/types/editorial.types'

interface Props {
  entries: TocEntry[]
}

/**
 * Inline editorial Table of Contents.
 *
 * Rendered at the top of the article (after the lead paragraph) when the
 * post has at least three H2 headings. Active section is tracked with an
 * IntersectionObserver against the heading anchors.
 */
export function TableOfContents({ entries }: Props) {
  const [active, setActive] = useState<string | null>(entries[0]?.id ?? null)

  useEffect(() => {
    if (entries.length === 0) return

    const ids = entries.map((e) => e.id)
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    if (els.length === 0) return

    const visible = new Map<string, number>()

    const obs = new IntersectionObserver(
      (records) => {
        for (const r of records) {
          if (r.isIntersecting) {
            visible.set(r.target.id, r.intersectionRatio)
          } else {
            visible.delete(r.target.id)
          }
        }
        // Pick the highest heading still in view (i.e. earliest in `ids`).
        for (const id of ids) {
          if (visible.has(id)) {
            setActive(id)
            return
          }
        }
      },
      { rootMargin: '-96px 0px -60% 0px', threshold: [0, 0.1, 0.5, 1] },
    )

    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [entries])

  if (entries.length < 3) return null

  return (
    <nav
      aria-label="Table of contents"
      className="my-10 not-prose rounded-2xl border border-slate-200 bg-slate-50 dark:border-gray-800 dark:bg-gray-900/40
        ring-1 ring-slate-200/40 dark:ring-white/[0.02] px-5 sm:px-6 py-5"
    >
      <header className="flex items-center gap-2 mb-4">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-orange-400" aria-hidden="true" />
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-orange-300">
          In this article
        </span>
      </header>

      <ol className="space-y-1.5">
        {entries.map((entry, i) => {
          const isActive = active === entry.id
          const indent = entry.level === 3 ? 'pl-6' : 'pl-0'
          return (
            <li key={entry.id} className={indent}>
              <a
                href={`#${entry.id}`}
                className={[
                  'group relative inline-flex items-baseline gap-3 py-1 text-sm transition-colors',
                  isActive
                    ? 'text-orange-600 dark:text-orange-300'
                    : 'text-slate-600 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-200',
                ].join(' ')}
              >
                <span
                  className={[
                    'font-mono text-[11px] tabular-nums',
                    isActive ? 'text-orange-400' : 'text-slate-400 dark:text-gray-600',
                  ].join(' ')}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="leading-snug">
                  {entry.text}
                </span>
                {isActive && (
                  <span
                    className="absolute -left-3 top-2 inline-block h-3 w-0.5 rounded-full
                      bg-orange-400"
                    aria-hidden="true"
                  />
                )}
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
