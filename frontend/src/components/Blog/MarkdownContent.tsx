'use client'

import React, { useMemo } from 'react'

/**
 * MarkdownContent — intentionally small, dependency-free renderer for the
 * subset of Markdown our blog actually produces. It fixes two problems with
 * the previous inline renderer:
 *
 *   1. Fenced code blocks (```) were rendered line-by-line, so multi-line
 *      snippets became stacked empty tags.
 *   2. Inline `code`, **bold**, *italic*, and [links](url) were dropped.
 *
 * Supported:
 *   - Headings (#, ##, ###)
 *   - Fenced code blocks with optional language hint
 *   - Blockquotes (>)
 *   - Ordered / unordered lists
 *   - Paragraphs with inline code, bold, italic, links
 *
 * The renderer operates on a plain string and does not execute HTML, so it
 * is safe against injected markup from the editor.
 */

type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'code'; lang: string; code: string }
  | { type: 'quote'; lines: string[] }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'paragraph'; text: string }
  | { type: 'spacer' }

function parseBlocks(raw: string): Block[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const buf: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        buf.push(lines[i])
        i++
      }
      blocks.push({ type: 'code', lang, code: buf.join('\n') })
      continue
    }

    // Headings
    if (line.startsWith('### ')) {
      blocks.push({ type: 'heading', level: 3, text: line.slice(4) })
      continue
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', level: 2, text: line.slice(3) })
      continue
    }
    if (line.startsWith('# ')) {
      blocks.push({ type: 'heading', level: 1, text: line.slice(2) })
      continue
    }

    // Blockquote (merge consecutive > lines)
    if (line.startsWith('> ')) {
      const buf: string[] = [line.slice(2)]
      while (i + 1 < lines.length && lines[i + 1].startsWith('> ')) {
        i++
        buf.push(lines[i].slice(2))
      }
      blocks.push({ type: 'quote', lines: buf })
      continue
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''))
        i++
      }
      i--
      blocks.push({ type: 'ul', items })
      continue
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''))
        i++
      }
      i--
      blocks.push({ type: 'ol', items })
      continue
    }

    // Empty line = spacer
    if (line.trim() === '') {
      if (blocks[blocks.length - 1]?.type !== 'spacer') {
        blocks.push({ type: 'spacer' })
      }
      continue
    }

    // Default: paragraph (merge adjacent non-empty, non-special lines)
    const paragraphLines = [line]
    while (
      i + 1 < lines.length &&
      lines[i + 1].trim() !== '' &&
      !lines[i + 1].startsWith('#') &&
      !lines[i + 1].startsWith('```') &&
      !lines[i + 1].startsWith('> ') &&
      !/^\s*[-*]\s+/.test(lines[i + 1]) &&
      !/^\s*\d+\.\s+/.test(lines[i + 1])
    ) {
      i++
      paragraphLines.push(lines[i])
    }
    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') })
  }

  return blocks
}

// ── Inline renderer ───────────────────────────────────────────────────────
// Supported inline tokens: **bold**, *italic*, `code`, [label](url)
const INLINE_RE = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g

function renderInline(text: string, keyPrefix = ''): React.ReactNode[] {
  const parts = text.split(INLINE_RE)
  return parts.filter(Boolean).map((part, idx) => {
    const key = `${keyPrefix}-${idx}`
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key} className="text-white font-semibold">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={key} className="italic text-gray-200">{part.slice(1, -1)}</em>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={key}
          className="rounded-md bg-gray-900 border border-gray-800 px-1.5 py-0.5
            text-[0.9em] font-mono text-orange-300">
          {part.slice(1, -1)}
        </code>
      )
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) {
      const isExternal = /^https?:/.test(link[2])
      return (
        <a key={key}
          href={link[2]}
          className="text-orange-400 underline underline-offset-4 decoration-orange-500/40 hover:decoration-orange-400"
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}>
          {link[1]}
        </a>
      )
    }
    return <React.Fragment key={key}>{part}</React.Fragment>
  })
}

// ── Block renderer ─────────────────────────────────────────────────────────
function Heading({ level, text, idx }: { level: 1 | 2 | 3; text: string; idx: number }) {
  const common = 'text-white font-bold scroll-mt-24 tracking-tight'
  if (level === 1) return <h2 key={idx} className={`${common} text-3xl mt-14 mb-4`}>{renderInline(text, String(idx))}</h2>
  if (level === 2) return <h2 key={idx} className={`${common} text-2xl mt-12 mb-3`}>{renderInline(text, String(idx))}</h2>
  return <h3 key={idx} className={`${common} text-xl mt-10 mb-2`}>{renderInline(text, String(idx))}</h3>
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="my-6 overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
      {lang && (
        <div className="flex items-center justify-between bg-gray-900/80 px-4 py-1.5
          text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-800">
          <span>{lang}</span>
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="font-mono text-orange-200 whitespace-pre">{code}</code>
      </pre>
    </div>
  )
}

export function MarkdownContent({ source }: { source: string }) {
  const blocks = useMemo(() => parseBlocks(source), [source])

  return (
    <div className="text-gray-300 text-[17px] leading-[1.75]">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading':
            return <Heading key={idx} idx={idx} level={block.level} text={block.text} />

          case 'code':
            return <CodeBlock key={idx} lang={block.lang} code={block.code} />

          case 'quote':
            return (
              <blockquote key={idx}
                className="my-6 border-l-4 border-orange-500 bg-orange-500/5 rounded-r-md
                  pl-5 pr-4 py-3 text-gray-300 italic">
                {block.lines.map((line, li) => (
                  <p key={li} className="not-italic:first-of-type">{renderInline(line, `q-${idx}-${li}`)}</p>
                ))}
              </blockquote>
            )

          case 'ul':
            return (
              <ul key={idx} className="my-5 space-y-2 pl-6 list-disc marker:text-orange-400">
                {block.items.map((item, li) => (
                  <li key={li}>{renderInline(item, `ul-${idx}-${li}`)}</li>
                ))}
              </ul>
            )

          case 'ol':
            return (
              <ol key={idx} className="my-5 space-y-2 pl-6 list-decimal marker:text-orange-400 marker:font-semibold">
                {block.items.map((item, li) => (
                  <li key={li}>{renderInline(item, `ol-${idx}-${li}`)}</li>
                ))}
              </ol>
            )

          case 'paragraph':
            return (
              <p key={idx} className="my-5">
                {renderInline(block.text, `p-${idx}`)}
              </p>
            )

          case 'spacer':
            return <div key={idx} className="h-2" aria-hidden="true" />
        }
      })}
    </div>
  )
}
