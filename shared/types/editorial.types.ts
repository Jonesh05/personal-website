/**
 * Editorial renderer types, shared between the parser, the renderer, and
 * any tooling (linters, preview shells, exporters) that needs to reason
 * about parsed post content.
 *
 * The renderer is intentionally narrow: it only supports the constructs an
 * editorial post actually uses (heading, paragraph, code with copy +
 * highlighting, callout, figure, table, blockquote, list, hr). Everything
 * else falls back to plain text.
 */

export type CalloutVariant =
    | "note"
    | "tip"
    | "info"
    | "warning"
    | "danger"
    | "quote"

export type TableAlign = "left" | "center" | "right" | null

export type EditorialBlock =
    | { type: "heading"; level: 1 | 2 | 3 | 4; text: string; id: string }
    | { type: "paragraph"; text: string; lead?: boolean }
    | { type: "code"; lang: string; title?: string; code: string }
    | { type: "quote"; lines: string[] }
    | { type: "ul"; items: string[] }
    | { type: "ol"; items: string[] }
    | { type: "hr" }
    | { type: "figure"; src: string; alt: string; caption?: string }
    | { type: "table"; head: string[]; rows: string[][]; align: TableAlign[] }
    | {
          type: "callout"
          variant: CalloutVariant
          title?: string
          children: EditorialBlock[]
      }
    | { type: "spacer" }

export interface TocEntry {
    id: string
    text: string
    level: 2 | 3
}
