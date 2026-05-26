import React from 'react'

/**
 * Inline token renderer.
 *
 * Tokens, in priority order:
 *   `code`         → <code>
 *   **bold**       → <strong>
 *   ~~strike~~     → <s>
 *   *italic*       → <em>
 *   ![alt](url)    → <img>  (rare inline; figures handled at block level)
 *   [label](url)   → <a>
 *
 * The first match wins. Backtick spans are matched first so their inner
 * `*` / `_` aren't reinterpreted as emphasis.
 */

const INLINE_RE = new RegExp(
  [
    '(`[^`]+`)',
    '(\\*\\*[^*\\n]+\\*\\*)',
    '(~~[^~\\n]+~~)',
    '(\\*[^*\\n]+\\*)',
    '(!\\[[^\\]]*\\]\\([^)\\s]+\\))',
    '(\\[[^\\]]+\\]\\([^)\\s]+(?:\\s+"[^"]*")?\\))',
  ].join('|'),
  'g',
)

const LINK_RE = /^\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/
const IMG_RE = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/

export function renderInline(
  text: string,
  keyPrefix: string,
): React.ReactNode[] {
  if (!text) return []

  const out: React.ReactNode[] = []
  let lastIndex = 0
  let i = 0

  for (const m of text.matchAll(INLINE_RE)) {
    const start = m.index ?? 0
    if (start > lastIndex) {
      out.push(text.slice(lastIndex, start))
    }
    const token = m[0]
    out.push(renderToken(token, `${keyPrefix}-${i++}`))
    lastIndex = start + token.length
  }
  if (lastIndex < text.length) {
    out.push(text.slice(lastIndex))
  }
  return out
}

function renderToken(token: string, key: string): React.ReactNode {
  if (token.startsWith('`') && token.endsWith('`')) {
    return (
      <code
        key={key}
        className="rounded-md bg-slate-100 border border-slate-200 dark:bg-gray-900 dark:border-gray-800 px-1.5 py-0.5
          text-[0.88em] font-mono text-orange-600 dark:text-orange-300 align-baseline"
      >
        {token.slice(1, -1)}
      </code>
    )
  }

  if (token.startsWith('**') && token.endsWith('**')) {
    return (
      <strong key={key} className="font-semibold text-slate-900 dark:text-white">
        {token.slice(2, -2)}
      </strong>
    )
  }

  if (token.startsWith('~~') && token.endsWith('~~')) {
    return (
      <s key={key} className="text-slate-400 decoration-slate-400 dark:text-gray-500 dark:decoration-gray-600">
        {token.slice(2, -2)}
      </s>
    )
  }

  if (token.startsWith('*') && token.endsWith('*')) {
    return (
      <em key={key} className="italic text-slate-700 dark:text-gray-200">
        {token.slice(1, -1)}
      </em>
    )
  }

  const img = token.match(IMG_RE)
  if (img) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        key={key}
        src={img[2]}
        alt={img[1]}
        className="inline-block max-h-6 align-text-bottom"
        loading="lazy"
      />
    )
  }

  const link = token.match(LINK_RE)
  if (link) {
    const href = link[2]
    const title = link[3]
    const isExternal = /^https?:/.test(href)
    return (
      <a
        key={key}
        href={href}
        title={title}
        className="text-orange-400 underline underline-offset-[5px]
          decoration-orange-500/40 hover:decoration-orange-400 hover:text-orange-300
          transition-colors"
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
      >
        {link[1]}
      </a>
    )
  }

  return <React.Fragment key={key}>{token}</React.Fragment>
}
