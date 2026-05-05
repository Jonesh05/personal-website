'use client'

import { useState } from 'react'
import { TOKEN_CLASS, tokenize } from './highlight'

interface Props {
  lang: string
  code: string
  title?: string
}

/**
 * Editorial code block.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────┐
 *   │ ● ● ●   filename.ts            ts   [Copy]   │  ← chrome bar
 *   ├──────────────────────────────────────────────┤
 *   │ 1   const x = 1                              │  ← gutter + code
 *   │ 2   ...                                      │
 *   └──────────────────────────────────────────────┘
 *
 * The chrome bar is omitted when there's no language and no title, so a
 * bare ``` block stays visually quiet.
 */
export function CodeBlock({ lang, code, title }: Props) {
  const [copied, setCopied] = useState(false)
  const tokens = tokenize(code, lang)
  const lines = code.split('\n')
  const showChrome = Boolean(lang || title)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // clipboard blocked — silently no-op
    }
  }

  return (
    <figure className="my-7 group/code overflow-hidden rounded-xl border border-gray-800
      bg-gray-950/80 shadow-lg shadow-black/30 ring-1 ring-white/[0.02]">
      {showChrome && (
        <header className="flex items-center justify-between gap-3 border-b border-gray-800
          bg-gray-900/70 px-4 py-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
            </div>
            {title && (
              <span className="truncate font-mono text-xs text-gray-300">
                {title}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {lang && (
              <span className="font-mono text-[10px] uppercase tracking-[0.18em]
                text-gray-500">
                {lang}
              </span>
            )}
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? 'Copied to clipboard' : 'Copy code'}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-800
                bg-gray-900 px-2 py-1 text-[11px] font-medium text-gray-400
                hover:border-gray-700 hover:text-orange-300 transition-colors
                focus:outline-none focus:ring-2 focus:ring-orange-500/40"
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </header>
      )}

      <div className="relative">
        {!showChrome && (
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Copied to clipboard' : 'Copy code'}
            className="absolute right-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-md
              border border-gray-800 bg-gray-900/80 px-2 py-1 text-[11px] font-medium
              text-gray-400 opacity-0 group-hover/code:opacity-100
              hover:border-gray-700 hover:text-orange-300 transition
              focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        )}

        <pre className="overflow-x-auto py-4 text-[13.5px] leading-[1.7] font-mono">
          <code className="grid">
            {lines.map((_, lineIdx) => (
              <span key={lineIdx} className="grid grid-cols-[2.5rem_1fr]">
                <span
                  className="select-none pr-3 text-right text-gray-600 tabular-nums"
                  aria-hidden="true"
                >
                  {lineIdx + 1}
                </span>
                <span className="pr-4">
                  {renderLine(tokens, lineIdx)}
                </span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </figure>
  )
}

/**
 * Render a single line by walking the token stream and slicing each token's
 * text on newline boundaries. This keeps the highlighter state simple
 * (one tokenize pass for the whole block) while still producing per-line
 * rows for the gutter.
 */
function renderLine(tokens: ReturnType<typeof tokenize>, targetLine: number) {
  const out: React.ReactNode[] = []
  let line = 0
  let key = 0

  for (const tok of tokens) {
    const parts = tok.value.split('\n')
    for (let p = 0; p < parts.length; p++) {
      if (line === targetLine && parts[p].length > 0) {
        out.push(
          <span key={key++} className={TOKEN_CLASS[tok.type]}>
            {parts[p]}
          </span>,
        )
      }
      if (p < parts.length - 1) line++
      if (line > targetLine) return out.length ? out : ['\u200B']
    }
  }

  return out.length ? out : ['\u200B']
}

function CopyIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-3 w-3 text-emerald-400" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
