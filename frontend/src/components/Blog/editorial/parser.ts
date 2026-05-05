import type {
  CalloutVariant,
  EditorialBlock,
  TableAlign,
  TocEntry,
} from '@personal-website/shared/types/editorial.types'

/**
 * Parse an editorial Markdown source into a flat list of blocks.
 *
 * Beyond CommonMark essentials, the parser recognises three custom
 * constructs that drive the editorial layout:
 *
 *   1. Container blocks   → `:::variant Title?` ... `:::`
 *      Variants: note, tip, info, warning, danger, quote.
 *      Containers may nest other blocks (paragraphs, lists, code).
 *
 *   2. Code blocks with metadata
 *      ```lang title="filename.ts"
 *      Title is rendered as the editor-style filename pill.
 *
 *   3. Image-only lines become <figure> with the alt text as caption,
 *      so authors can drop images inline without thinking about figures.
 *
 * Headings get slugified ids so the TOC can anchor-link them.
 */

const SLUG_DROP = /[^a-z0-9\s-]/g
const SLUG_SPACE = /\s+/g

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[`*_~[\]()]/g, '')
      .replace(SLUG_DROP, '')
      .trim()
      .replace(SLUG_SPACE, '-')
      .slice(0, 80) || 'section'
  )
}

function uniqueSlug(used: Set<string>, base: string): string {
  if (!used.has(base)) {
    used.add(base)
    return base
  }
  let n = 2
  while (used.has(`${base}-${n}`)) n++
  const slug = `${base}-${n}`
  used.add(slug)
  return slug
}

const VALID_CALLOUT: ReadonlySet<CalloutVariant> = new Set([
  'note',
  'tip',
  'info',
  'warning',
  'danger',
  'quote',
])

const HEADING_RE = /^(#{1,4})\s+(.*)$/
const HR_RE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/
const FENCE_RE = /^```([^\s]*)\s*(.*)$/
const CONTAINER_OPEN_RE = /^:::([a-z]+)\s*(.*)$/i
const CONTAINER_CLOSE_RE = /^:::\s*$/
const UL_RE = /^\s*[-*+]\s+(.*)$/
const OL_RE = /^\s*\d+\.\s+(.*)$/
const QUOTE_RE = /^>\s?(.*)$/
const TABLE_DIV_RE = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/
const TABLE_ROW_RE = /^\s*\|.*\|\s*$/
const IMAGE_ONLY_RE = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/
const CODE_TITLE_RE = /title=(?:"([^"]*)"|'([^']*)'|(\S+))/

function parseTitleAttr(meta: string): string | undefined {
  const m = meta.match(CODE_TITLE_RE)
  if (!m) return undefined
  return m[1] ?? m[2] ?? m[3]
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed.split('|').map((c) => c.trim())
}

function parseTableAlign(divider: string): TableAlign[] {
  return splitTableRow(divider).map((cell) => {
    const left = cell.startsWith(':')
    const right = cell.endsWith(':')
    if (left && right) return 'center'
    if (right) return 'right'
    if (left) return 'left'
    return null
  })
}

export interface ParseResult {
  blocks: EditorialBlock[]
  toc: TocEntry[]
}

export function parseEditorial(raw: string): ParseResult {
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  const usedSlugs = new Set<string>()
  const toc: TocEntry[] = []

  // The same routine is used at top level and inside containers.
  // It walks lines from `start`, stops when it hits `stopAt` (e.g. a closing
  // `:::`), and returns both the consumed blocks and the new cursor.
  function walk(
    start: number,
    stopAt?: RegExp,
  ): { blocks: EditorialBlock[]; end: number } {
    const blocks: EditorialBlock[] = []
    let i = start
    // Only the outermost stream gets a "lead" paragraph (the editorial
    // dropcap-style first paragraph). Containers never produce one.
    let leadAssigned = stopAt !== undefined

    while (i < lines.length) {
      const line = lines[i]

      if (stopAt && stopAt.test(line)) {
        return { blocks, end: i }
      }

      const containerMatch = line.match(CONTAINER_OPEN_RE)
      if (containerMatch && !CONTAINER_CLOSE_RE.test(line)) {
        const rawVariant = containerMatch[1].toLowerCase() as CalloutVariant
        const variant = VALID_CALLOUT.has(rawVariant) ? rawVariant : 'note'
        const title = containerMatch[2]?.trim() || undefined
        const child = walk(i + 1, CONTAINER_CLOSE_RE)
        blocks.push({ type: 'callout', variant, title, children: child.blocks })
        i = child.end + 1
        continue
      }

      const fence = line.match(FENCE_RE)
      if (fence) {
        const lang = fence[1].trim()
        const title = parseTitleAttr(fence[2] || '')
        const buf: string[] = []
        i++
        while (i < lines.length && !lines[i].startsWith('```')) {
          buf.push(lines[i])
          i++
        }
        blocks.push({ type: 'code', lang, title, code: buf.join('\n') })
        i++
        continue
      }

      const heading = line.match(HEADING_RE)
      if (heading) {
        const level = heading[1].length as 1 | 2 | 3 | 4
        const text = heading[2].trim()
        const id = uniqueSlug(usedSlugs, slugify(text))
        if (level === 2 || level === 3) {
          toc.push({ id, text, level })
        }
        blocks.push({ type: 'heading', level, text, id })
        i++
        continue
      }

      if (HR_RE.test(line)) {
        blocks.push({ type: 'hr' })
        i++
        continue
      }

      if (QUOTE_RE.test(line)) {
        const buf: string[] = []
        while (i < lines.length && QUOTE_RE.test(lines[i])) {
          buf.push(lines[i].replace(QUOTE_RE, '$1'))
          i++
        }
        blocks.push({ type: 'quote', lines: buf })
        continue
      }

      if (UL_RE.test(line)) {
        const items: string[] = []
        while (i < lines.length && UL_RE.test(lines[i])) {
          items.push(lines[i].replace(UL_RE, '$1'))
          i++
        }
        blocks.push({ type: 'ul', items })
        continue
      }

      if (OL_RE.test(line)) {
        const items: string[] = []
        while (i < lines.length && OL_RE.test(lines[i])) {
          items.push(lines[i].replace(OL_RE, '$1'))
          i++
        }
        blocks.push({ type: 'ol', items })
        continue
      }

      // Tables: header row immediately followed by an alignment divider.
      if (
        TABLE_ROW_RE.test(line) &&
        i + 1 < lines.length &&
        TABLE_DIV_RE.test(lines[i + 1])
      ) {
        const head = splitTableRow(line)
        const align = parseTableAlign(lines[i + 1])
        const rows: string[][] = []
        i += 2
        while (i < lines.length && TABLE_ROW_RE.test(lines[i])) {
          rows.push(splitTableRow(lines[i]))
          i++
        }
        blocks.push({ type: 'table', head, align, rows })
        continue
      }

      // Image on its own line → figure (alt text becomes the caption).
      const fig = line.match(IMAGE_ONLY_RE)
      if (fig) {
        blocks.push({
          type: 'figure',
          src: fig[2],
          alt: fig[1],
          caption: fig[3] || fig[1] || undefined,
        })
        i++
        continue
      }

      if (line.trim() === '') {
        if (blocks[blocks.length - 1]?.type !== 'spacer') {
          blocks.push({ type: 'spacer' })
        }
        i++
        continue
      }

      // Paragraph: gather adjacent non-empty, non-special lines.
      const paragraphLines = [line]
      i++
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !HEADING_RE.test(lines[i]) &&
        !FENCE_RE.test(lines[i]) &&
        !CONTAINER_OPEN_RE.test(lines[i]) &&
        !CONTAINER_CLOSE_RE.test(lines[i]) &&
        !QUOTE_RE.test(lines[i]) &&
        !UL_RE.test(lines[i]) &&
        !OL_RE.test(lines[i]) &&
        !HR_RE.test(lines[i]) &&
        !IMAGE_ONLY_RE.test(lines[i]) &&
        !(stopAt && stopAt.test(lines[i]))
      ) {
        paragraphLines.push(lines[i])
        i++
      }

      const text = paragraphLines.join(' ').trim()
      const lead = !leadAssigned && text.length > 0
      if (lead) leadAssigned = true
      blocks.push({ type: 'paragraph', text, lead })
    }

    return { blocks, end: i }
  }

  const { blocks } = walk(0)
  return { blocks, toc }
}
