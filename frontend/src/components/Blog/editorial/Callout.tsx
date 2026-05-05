import type { CalloutVariant } from '@personal-website/shared/types/editorial.types'

interface VariantStyle {
  border: string
  bg: string
  ring: string
  iconColor: string
  titleColor: string
  defaultTitle: string
  Icon: () => React.ReactElement
}

const STYLES: Record<CalloutVariant, VariantStyle> = {
  note: {
    border: 'border-sky-500/40',
    bg: 'bg-sky-500/[0.07]',
    ring: 'ring-sky-500/10',
    iconColor: 'text-sky-300',
    titleColor: 'text-sky-200',
    defaultTitle: 'Note',
    Icon: NoteIcon,
  },
  tip: {
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/[0.07]',
    ring: 'ring-emerald-500/10',
    iconColor: 'text-emerald-300',
    titleColor: 'text-emerald-200',
    defaultTitle: 'Tip',
    Icon: TipIcon,
  },
  info: {
    border: 'border-indigo-500/40',
    bg: 'bg-indigo-500/[0.07]',
    ring: 'ring-indigo-500/10',
    iconColor: 'text-indigo-300',
    titleColor: 'text-indigo-200',
    defaultTitle: 'Info',
    Icon: InfoIcon,
  },
  warning: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/[0.07]',
    ring: 'ring-amber-500/10',
    iconColor: 'text-amber-300',
    titleColor: 'text-amber-200',
    defaultTitle: 'Heads up',
    Icon: WarningIcon,
  },
  danger: {
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/[0.07]',
    ring: 'ring-rose-500/10',
    iconColor: 'text-rose-300',
    titleColor: 'text-rose-200',
    defaultTitle: 'Watch out',
    Icon: DangerIcon,
  },
  quote: {
    border: 'border-orange-500/40',
    bg: 'bg-orange-500/[0.05]',
    ring: 'ring-orange-500/10',
    iconColor: 'text-orange-300',
    titleColor: 'text-orange-200',
    defaultTitle: 'Quote',
    Icon: QuoteIcon,
  },
}

interface Props {
  variant: CalloutVariant
  title?: string
  children: React.ReactNode
}

export function Callout({ variant, title, children }: Props) {
  const s = STYLES[variant]
  return (
    <aside
      role="note"
      className={`my-7 rounded-2xl border ${s.border} ${s.bg} ring-1 ${s.ring}
        backdrop-blur-[1px] px-5 sm:px-6 py-5`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full
          bg-black/30 ${s.iconColor}`}>
          <s.Icon />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${s.titleColor}`}>
            {title || s.defaultTitle}
          </p>
          <div className="mt-2 [&>p:first-child]:mt-0 [&>:last-child]:mb-0
            text-gray-200/95 [&>p]:my-3">
            {children}
          </div>
        </div>
      </div>
    </aside>
  )
}

// ── Icons ──────────────────────────────────────────────────────────────────
function svgProps() {
  return {
    className: 'h-4 w-4',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
}

function NoteIcon() {
  return (
    <svg {...svgProps()}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  )
}

function TipIcon() {
  return (
    <svg {...svgProps()}>
      <path d="M12 2a7 7 0 0 0-4 12.7V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.3A7 7 0 0 0 12 2Z" />
      <line x1="10" y1="22" x2="14" y2="22" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg {...svgProps()}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg {...svgProps()}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function DangerIcon() {
  return (
    <svg {...svgProps()}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}

function QuoteIcon() {
  return (
    <svg {...svgProps()}>
      <path d="M3 21c3 0 7-1 7-8V5c0-1-1-2-2-2H4c-1 0-2 1-2 2v6c0 1 1 2 2 2h3" />
      <path d="M14 21c3 0 7-1 7-8V5c0-1-1-2-2-2h-4c-1 0-2 1-2 2v6c0 1 1 2 2 2h3" />
    </svg>
  )
}
