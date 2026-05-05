import type { TableAlign } from '@personal-website/shared/types/editorial.types'
import { renderInline } from './inline'

interface Props {
  head: string[]
  rows: string[][]
  align: TableAlign[]
  idx: number
}

const ALIGN_CLASS: Record<NonNullable<TableAlign>, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

function alignFor(a: TableAlign): string {
  return a ? ALIGN_CLASS[a] : 'text-left'
}

export function EditorialTable({ head, rows, align, idx }: Props) {
  return (
    <div className="my-7 overflow-x-auto rounded-xl border border-gray-800
      bg-gray-900/40 ring-1 ring-white/[0.02]">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-900/60">
            {head.map((cell, ci) => (
              <th
                key={ci}
                scope="col"
                className={`${alignFor(align[ci])} px-4 py-3 font-semibold text-white
                  text-[11px] uppercase tracking-[0.14em] border-b border-gray-800`}
              >
                {renderInline(cell, `t-${idx}-h-${ci}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className="border-b border-gray-800/60 last:border-b-0
                hover:bg-gray-900/40 transition-colors"
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`${alignFor(align[ci])} px-4 py-3 text-gray-300
                    align-top`}
                >
                  {renderInline(cell, `t-${idx}-r${ri}-c${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
