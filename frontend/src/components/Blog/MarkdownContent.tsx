'use client'

import React, { useMemo } from 'react'
import type { EditorialBlock } from '@personal-website/shared/types/editorial.types'
import { parseEditorial } from './editorial/parser'
import { renderInline } from './editorial/inline'
import { CodeBlock } from './editorial/CodeBlock'
import { Callout } from './editorial/Callout'
import { Figure } from './editorial/Figure'
import { EditorialTable } from './editorial/Table'
import { TableOfContents } from './editorial/TableOfContents'

/**
 * MarkdownContent — the editorial renderer.
 *
 * This is intentionally not a generic Markdown engine. It targets the
 * exact constructs an editorial post needs:
 *
 *   • Headings with anchor ids and section dividers
 *   • A lead paragraph with a drop cap
 *   • Auto-generated Table of Contents (3+ H2s)
 *   • Code blocks with chrome bar, language label, copy button,
 *     line numbers and minimal syntax highlighting
 *   • Callouts: note / tip / info / warning / danger / quote
 *   • Figures with numbered captions
 *   • Tables with alignment
 *   • Lists, blockquotes, hr, inline emphasis / code / links
 *
 * Container syntax for callouts:
 *
 *     :::tip Pro tip
 *     Body content here, can include **markdown**.
 *     :::
 *
 * Code blocks accept a `title` attribute next to the language:
 *
 *     ```ts title="server-action.ts"
 *     export async function action() { ... }
 *     ```
 */

interface Props {
  source: string
}

export function MarkdownContent({ source }: Props) {
  const { blocks, toc } = useMemo(() => parseEditorial(source), [source])

  // Figures get a 1-based index so captions can read "Fig. 1", "Fig. 2", ...
  let figureIdx = 0
  let tocInjected = false

  return (
    <div className="text-gray-300 text-[17px] leading-[1.78] font-light selection:bg-orange-500/30">
      {blocks.map((block, i) => {
        const node = renderBlock(block, i, () => ++figureIdx)

        // Inject the TOC after the lead paragraph (or at the start if there
        // isn't one). Keeps it close to the article opening without
        // obstructing the hero/excerpt up top.
        if (!tocInjected && block.type === 'paragraph' && block.lead) {
          tocInjected = true
          return (
            <React.Fragment key={i}>
              {node}
              <TableOfContents entries={toc} />
            </React.Fragment>
          )
        }

        return <React.Fragment key={i}>{node}</React.Fragment>
      })}

      {!tocInjected && toc.length >= 3 && (
        <div className="-mt-2">
          <TableOfContents entries={toc} />
        </div>
      )}
    </div>
  )
}

function renderBlock(
  block: EditorialBlock,
  i: number,
  nextFigure: () => number,
): React.ReactNode {
  switch (block.type) {
    case 'heading':
      return <Heading idx={i} level={block.level} text={block.text} id={block.id} />

    case 'paragraph':
      if (block.lead) {
        return (
          <p
            className="my-6 text-[1.18rem] sm:text-[1.22rem] leading-[1.7] text-gray-200/95
              first-letter:float-left first-letter:mr-2 first-letter:mt-1
              first-letter:text-[3.4rem] first-letter:leading-[0.9]
              first-letter:font-display first-letter:font-bold
              first-letter:text-orange-400 first-letter:pr-1"
          >
            {renderInline(block.text, `lead-${i}`)}
          </p>
        )
      }
      return (
        <p className="my-5">
          {renderInline(block.text, `p-${i}`)}
        </p>
      )

    case 'code':
      return <CodeBlock lang={block.lang} code={block.code} title={block.title} />

    case 'quote':
      return (
        <blockquote
          className="my-7 relative pl-6 pr-4 py-1 border-l-2 border-orange-500/70
            text-gray-200 italic text-[1.05em]"
        >
          <span
            aria-hidden="true"
            className="absolute -left-[2px] -top-2 text-[2.6rem] font-display
              leading-none text-orange-500/40 select-none"
          >
            “
          </span>
          {block.lines.map((line, li) => (
            <p key={li} className="my-2">
              {renderInline(line, `q-${i}-${li}`)}
            </p>
          ))}
        </blockquote>
      )

    case 'ul':
      return (
        <ul className="my-5 space-y-2 pl-6 list-none">
          {block.items.map((item, li) => (
            <li key={li} className="relative pl-1">
              <span
                aria-hidden="true"
                className="absolute -left-5 top-[0.7em] inline-block h-1.5 w-1.5
                  rounded-full bg-orange-400"
              />
              {renderInline(item, `ul-${i}-${li}`)}
            </li>
          ))}
        </ul>
      )

    case 'ol':
      return (
        <ol className="my-5 space-y-2 pl-2 list-none counter-reset-[ed]">
          {block.items.map((item, li) => (
            <li key={li} className="relative pl-10">
              <span
                aria-hidden="true"
                className="absolute left-0 top-[0.1em] inline-flex h-6 w-7 items-center
                  justify-center rounded-md border border-gray-800 bg-gray-900
                  font-mono text-[11px] tabular-nums text-orange-300"
              >
                {String(li + 1).padStart(2, '0')}
              </span>
              {renderInline(item, `ol-${i}-${li}`)}
            </li>
          ))}
        </ol>
      )

    case 'hr':
      return (
        <div
          className="my-12 flex items-center justify-center gap-3"
          role="separator"
          aria-hidden="true"
        >
          <span className="h-px w-12 bg-gray-800" />
          <span className="h-1 w-1 rounded-full bg-orange-500/70" />
          <span className="h-px w-12 bg-gray-800" />
        </div>
      )

    case 'figure':
      return <Figure src={block.src} alt={block.alt} caption={block.caption} idx={nextFigure()} />

    case 'table':
      return <EditorialTable head={block.head} rows={block.rows} align={block.align} idx={i} />

    case 'callout':
      return (
        <Callout variant={block.variant} title={block.title}>
          {block.children.map((child, ci) => (
            <React.Fragment key={ci}>
              {renderBlock(child, ci, nextFigure)}
            </React.Fragment>
          ))}
        </Callout>
      )

    case 'spacer':
      return <div className="h-1" aria-hidden="true" />
  }
}

// ── Heading with anchor link ─────────────────────────────────────────────
interface HeadingProps {
  level: 1 | 2 | 3 | 4
  text: string
  id: string
  idx: number
}

function Heading({ level, text, id, idx }: HeadingProps) {
  const inner = (
    <a
      href={`#${id}`}
      className="group/h relative inline-flex items-baseline gap-2 no-underline
        text-inherit hover:text-inherit"
    >
      <span>{renderInline(text, `h-${idx}`)}</span>
      <span
        aria-hidden="true"
        className="opacity-0 group-hover/h:opacity-100 transition-opacity
          font-mono text-orange-400 text-base font-normal"
      >
        #
      </span>
    </a>
  )

  const common = 'text-white font-bold scroll-mt-28 tracking-tight font-display'

  if (level === 1) {
    return (
      <h2 id={id} className={`${common} text-[2rem] sm:text-[2.4rem] mt-16 mb-5 leading-[1.1]`}>
        {inner}
      </h2>
    )
  }

  if (level === 2) {
    return (
      <div className="mt-14 mb-4">
        <div className="mb-3 flex items-center gap-3">
          <span className="h-px w-8 bg-gradient-to-r from-orange-500 to-transparent"
            aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-orange-400/80">
            §
          </span>
        </div>
        <h2 id={id} className={`${common} text-[1.7rem] sm:text-[1.9rem] leading-[1.15]`}>
          {inner}
        </h2>
      </div>
    )
  }

  if (level === 3) {
    return (
      <h3 id={id} className={`${common} text-[1.3rem] sm:text-[1.4rem] mt-10 mb-2`}>
        {inner}
      </h3>
    )
  }

  return (
    <h4 id={id} className={`${common} text-[1.1rem] mt-8 mb-2 text-orange-200/90`}>
      {inner}
    </h4>
  )
}
