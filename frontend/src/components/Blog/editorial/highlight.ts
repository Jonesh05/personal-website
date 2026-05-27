/**
 * Minimal, dependency-free syntax highlighter.
 *
 * Designed for editorial code blocks tens to a few hundred lines, not
 * full IDE buffers. We tokenize with priority-ordered regex (comments
 * first, then strings, then keywords/numbers/identifiers) so that
 * comments and strings always win over inner keywords.
 *
 * Token classes map to a fixed Tailwind palette so the renderer can
 * produce <span> nodes without any runtime CSS injection.
 */

export type TokenType =
  | 'plain'
  | 'comment'
  | 'string'
  | 'number'
  | 'keyword'
  | 'builtin'
  | 'type'
  | 'function'
  | 'tag'
  | 'attribute'
  | 'punctuation'
  | 'operator'
  | 'regex'

export interface Token {
  type: TokenType
  value: string
}

interface Rule {
  type: TokenType
  re: RegExp
}

const KW_JS = new Set([
  'const','let','var','function','return','if','else','for','while','do',
  'switch','case','break','continue','default','throw','try','catch','finally',
  'new','delete','typeof','instanceof','in','of','class','extends','super',
  'this','import','export','from','as','async','await','yield','static',
  'public','private','protected','readonly','interface','type','enum',
  'implements','namespace','declare','abstract','keyof','infer','satisfies',
  'is','void','any','unknown','never','true','false','null','undefined',
])

const BUILTIN_JS = new Set([
  'console','window','document','Math','Date','JSON','Object','Array',
  'Number','String','Boolean','Symbol','Promise','Set','Map','WeakMap',
  'WeakSet','Error','RegExp','globalThis','process','require','module',
  'exports','__dirname','__filename',
])

const KW_PY = new Set([
  'def','return','if','elif','else','for','while','break','continue','pass',
  'class','import','from','as','with','try','except','finally','raise',
  'lambda','yield','global','nonlocal','assert','del','in','is','not','and',
  'or','True','False','None','async','await','self','cls',
])

const KW_BASH = new Set([
  'if','then','else','elif','fi','for','in','do','done','while','case','esac',
  'function','return','export','source','local','readonly','set','unset',
  'echo','printf','read','exit','cd','pwd','ls','cat','grep','sed','awk',
])

const KW_SQL = new Set([
  'SELECT','FROM','WHERE','INSERT','UPDATE','DELETE','CREATE','DROP','ALTER',
  'TABLE','INDEX','VIEW','JOIN','LEFT','RIGHT','INNER','OUTER','ON','AS',
  'AND','OR','NOT','NULL','IS','IN','BETWEEN','LIKE','ORDER','BY','GROUP',
  'HAVING','LIMIT','OFFSET','UNION','ALL','DISTINCT','VALUES','SET','INTO',
  'PRIMARY','KEY','FOREIGN','REFERENCES','DEFAULT','CASE','WHEN','THEN','END',
])

function makeJsRules(): Rule[] {
  return [
    { type: 'comment', re: /\/\/[^\n]*/y },
    { type: 'comment', re: /\/\*[\s\S]*?\*\//y },
    { type: 'string', re: /`(?:\\.|[^\\`])*`/y },
    { type: 'string', re: /"(?:\\.|[^\\"\n])*"/y },
    { type: 'string', re: /'(?:\\.|[^\\'\n])*'/y },
    // Regex literal heuristic: must follow `=,({[!&|?:;` or start
    { type: 'regex', re: /\/(?:\\.|[^\\/\n])+\/[gimsuy]*/y },
    { type: 'number', re: /\b(?:0x[0-9a-fA-F_]+|0b[01_]+|0o[0-7_]+|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?n?)\b/y },
    { type: 'keyword', re: /\b[A-Za-z_$][A-Za-z0-9_$]*\b/y },
    { type: 'punctuation', re: /[{}[\]().,;]/y },
    { type: 'operator', re: /[=+\-*/%<>!&|^~?:]+/y },
  ]
}

function makePyRules(): Rule[] {
  return [
    { type: 'comment', re: /#[^\n]*/y },
    { type: 'string', re: /"""[\s\S]*?"""/y },
    { type: 'string', re: /'''[\s\S]*?'''/y },
    { type: 'string', re: /[rfbu]?"(?:\\.|[^\\"\n])*"/y },
    { type: 'string', re: /[rfbu]?'(?:\\.|[^\\'\n])*'/y },
    { type: 'number', re: /\b\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?j?\b/y },
    { type: 'keyword', re: /\b[A-Za-z_][A-Za-z0-9_]*\b/y },
    { type: 'operator', re: /[=+\-*/%<>!&|^~]+/y },
    { type: 'punctuation', re: /[{}[\]().,;:]/y },
  ]
}

function makeBashRules(): Rule[] {
  return [
    { type: 'comment', re: /#[^\n]*/y },
    { type: 'string', re: /"(?:\\.|[^\\"])*"/y },
    { type: 'string', re: /'[^']*'/y },
    { type: 'attribute', re: /\$\{[^}]+\}|\$[A-Za-z_][A-Za-z0-9_]*/y },
    { type: 'number', re: /\b\d+\b/y },
    { type: 'keyword', re: /\b[A-Za-z_][A-Za-z0-9_-]*\b/y },
    { type: 'operator', re: /[=+\-*/%<>!&|^~?:]+/y },
    { type: 'punctuation', re: /[{}[\]().,;]/y },
  ]
}

function makeJsonRules(): Rule[] {
  return [
    { type: 'string', re: /"(?:\\.|[^\\"])*"\s*:/y },
    { type: 'string', re: /"(?:\\.|[^\\"])*"/y },
    { type: 'number', re: /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/y },
    { type: 'keyword', re: /\b(?:true|false|null)\b/y },
    { type: 'punctuation', re: /[{}[\]:,]/y },
  ]
}

function makeCssRules(): Rule[] {
  return [
    { type: 'comment', re: /\/\*[\s\S]*?\*\//y },
    { type: 'string', re: /"(?:\\.|[^\\"])*"/y },
    { type: 'string', re: /'(?:\\.|[^\\'])*'/y },
    { type: 'attribute', re: /[-a-z]+(?=\s*:)/y },
    { type: 'number', re: /-?\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|deg|s|ms)?\b/y },
    { type: 'keyword', re: /#[a-fA-F0-9]{3,8}\b/y },
    { type: 'function', re: /[a-zA-Z-]+(?=\()/y },
    { type: 'tag', re: /[.#]?[a-zA-Z][a-zA-Z0-9_-]*/y },
    { type: 'punctuation', re: /[{};:,()]/y },
  ]
}

function makeHtmlRules(): Rule[] {
  return [
    { type: 'comment', re: /<!--[\s\S]*?-->/y },
    { type: 'string', re: /"(?:\\.|[^\\"])*"/y },
    { type: 'string', re: /'(?:\\.|[^\\'])*'/y },
    { type: 'tag', re: /<\/?[a-zA-Z][a-zA-Z0-9-]*/y },
    { type: 'tag', re: /\/?>/y },
    { type: 'attribute', re: /[a-zA-Z-]+(?==)/y },
    { type: 'punctuation', re: /[=]/y },
  ]
}

function getRules(lang: string): { rules: Rule[]; keywords?: Set<string>; builtins?: Set<string> } {
  const l = lang.toLowerCase()
  if (l === 'js' || l === 'javascript' || l === 'jsx' ||
      l === 'ts' || l === 'typescript' || l === 'tsx') {
    return { rules: makeJsRules(), keywords: KW_JS, builtins: BUILTIN_JS }
  }
  if (l === 'py' || l === 'python') {
    return { rules: makePyRules(), keywords: KW_PY }
  }
  if (l === 'sh' || l === 'bash' || l === 'zsh' || l === 'shell') {
    return { rules: makeBashRules(), keywords: KW_BASH }
  }
  if (l === 'json') return { rules: makeJsonRules() }
  if (l === 'css' || l === 'scss') return { rules: makeCssRules() }
  if (l === 'html' || l === 'xml' || l === 'svg') return { rules: makeHtmlRules() }
  if (l === 'sql') return { rules: makeJsRules(), keywords: new Set(Array.from(KW_SQL).map((s) => s.toLowerCase())) }
  return { rules: [] }
}

function refineIdentifier(
  value: string,
  next: string | undefined,
  keywords?: Set<string>,
  builtins?: Set<string>,
): TokenType {
  if (keywords?.has(value)) return 'keyword'
  if (builtins?.has(value)) return 'builtin'
  // Type-like identifiers (PascalCase) become "type".
  if (/^[A-Z][A-Za-z0-9_]*$/.test(value)) return 'type'
  // Followed by `(` → function call.
  if (next === '(') return 'function'
  return 'plain'
}

export function tokenize(code: string, lang: string): Token[] {
  const { rules, keywords, builtins } = getRules(lang)
  if (!rules.length) return [{ type: 'plain', value: code }]

  const out: Token[] = []
  let i = 0
  let pending = ''

  const flushPending = () => {
    if (pending) {
      out.push({ type: 'plain', value: pending })
      pending = ''
    }
  }

  while (i < code.length) {
    const ch = code[i]
    if (ch === ' ' || ch === '\t' || ch === '\n') {
      pending += ch
      i++
      continue
    }

    let matched: { type: TokenType; value: string } | null = null
    for (const rule of rules) {
      rule.re.lastIndex = i
      const m = rule.re.exec(code)
      if (m && m.index === i) {
        matched = { type: rule.type, value: m[0] }
        break
      }
    }

    if (!matched) {
      pending += ch
      i++
      continue
    }

    flushPending()

    // Identifier refinement (e.g. JS "keyword" rule actually catches all
    // identifiers, narrow it down to keyword/builtin/type/function/plain).
    if (matched.type === 'keyword' && (keywords || builtins)) {
      const next = code[i + matched.value.length]
      const refined = refineIdentifier(matched.value, next, keywords, builtins)
      out.push({ type: refined, value: matched.value })
    } else {
      out.push(matched)
    }
    i += matched.value.length
  }

  flushPending()
  return out
}

/**
 * Tailwind class for each token type.
 * Tuned for the orange-on-dark editorial palette.
 */
export const TOKEN_CLASS: Record<TokenType, string> = {
  plain: 'text-gray-200',
  comment: 'text-gray-500 italic',
  string: 'text-emerald-300',
  number: 'text-amber-300',
  keyword: 'text-orange-400 font-medium',
  builtin: 'text-sky-300',
  type: 'text-cyan-300',
  function: 'text-yellow-200',
  tag: 'text-orange-300',
  attribute: 'text-purple-300',
  punctuation: 'text-gray-500',
  operator: 'text-pink-300',
  regex: 'text-rose-300',
}
