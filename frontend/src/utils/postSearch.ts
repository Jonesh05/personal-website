// frontend/src/utils/postSearch.ts
// Accent-insensitive, multi-word token search matcher for blog posts.

export interface SearchablePost {
  id: string
  slug: string
  title: string
  excerpt?: string
  tags?: string[]
}

/**
 * Strips diacritics/accents and lowercases text for forgiving matching
 * (e.g., "eslabon" matches "ESLABÓN", "arquitectonica" matches "Arquitectónica").
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Returns true if every whitespace-separated token in `query` appears
 * anywhere in the post's title, excerpt, or tags.
 * Allows matching by the 2nd, 3rd, or any keyword in any order.
 */
export function matchesPostSearch(post: SearchablePost, query: string): boolean {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return true

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true

  const haystack = normalizeSearchText(
    [post.title, post.excerpt ?? '', ...(post.tags ?? [])].join(' '),
  )

  return tokens.every((token) => haystack.includes(token))
}

/**
 * Scores a post against a query so title matches rank ahead of excerpt/tag matches.
 */
export function scorePostSearch(post: SearchablePost, query: string): number {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return 0

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean)
  const normTitle = normalizeSearchText(post.title)
  const normTags = normalizeSearchText((post.tags ?? []).join(' '))
  const normExcerpt = normalizeSearchText(post.excerpt ?? '')

  let score = 0
  if (normTitle.includes(normalizedQuery)) score += 10
  for (const token of tokens) {
    if (normTitle.includes(token)) score += 4
    if (normTags.includes(token)) score += 2
    if (normExcerpt.includes(token)) score += 1
  }
  return score
}

const PRESERVED_ACRONYMS = new Set([
  'AI', 'API', 'AWS', 'CSS', 'DAO', 'DEFI', 'DNS', 'ETH', 'EVM', 'GPU',
  'HTML', 'HTTP', 'HTTPS', 'IOT', 'JWT', 'LLM', 'NFT', 'REFI', 'RPC',
  'SDK', 'SQL', 'SSH', 'TLS', 'UI', 'UX', 'WEB3', 'ZK',
])

/**
 * Normalizes ALL-CAPS titles into clean editorial sentence case while
 * preserving mixed-case titles and technical acronyms.
 */
export function normalizePostTitle(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  const letters = trimmed.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '')
  const isAllCaps = letters.length > 4 && letters === letters.toUpperCase()
  if (!isAllCaps) return trimmed

  const lower = trimmed.toLocaleLowerCase('es')
  const sentence = lower.replace(/(^|:\s+)([a-záéíóúüñ])/gu, (_, sep: string, ch: string) => {
    return `${sep}${ch.toLocaleUpperCase('es')}`
  })

  return sentence.replace(/\b[a-z0-9]+\b/gi, (word) => {
    const upper = word.toUpperCase()
    if (upper === 'WEB3') return 'Web3'
    if (upper === 'DEFI') return 'DeFi'
    if (upper === 'REFI') return 'ReFi'
    if (upper === 'IOT') return 'IoT'
    return PRESERVED_ACRONYMS.has(upper) ? upper : word
  })
}

export interface HighlightSegment {
  text: string
  matched: boolean
}

/**
 * Splits `text` into matched / unmatched segments for accent-insensitive
 * keyword highlighting inside autocomplete suggestions.
 */
export function highlightSearchTerms(text: string, query: string): HighlightSegment[] {
  const tokens = normalizeSearchText(query).split(/\s+/).filter((t) => t.length > 0)
  if (tokens.length === 0) return [{ text, matched: false }]

  // Build normalized string with 1-to-1 index mapping back to original characters
  const chars = Array.from(text)
  const normChars = chars.map((ch) =>
    ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(),
  )
  const normFull = normChars.join('')
  const mask = new Array<boolean>(chars.length).fill(false)

  for (const token of tokens) {
    let start = 0
    while (start < normFull.length) {
      const idx = normFull.indexOf(token, start)
      if (idx === -1) break
      for (let i = idx; i < idx + token.length && i < mask.length; i++) {
        mask[i] = true
      }
      start = idx + token.length
    }
  }

  const segments: HighlightSegment[] = []
  for (let i = 0; i < chars.length; i++) {
    const last = segments[segments.length - 1]
    if (last && last.matched === mask[i]) {
      last.text += chars[i]
    } else {
      segments.push({ text: chars[i], matched: mask[i] })
    }
  }
  return segments
}
