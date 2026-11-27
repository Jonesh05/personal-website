'use client'

import { useState } from 'react'
import Link from 'next/link'

interface PopularTagsClientProps {
  title: string
  tags: string[]
  activeTag?: string
}

export function PopularTagsClient({
  title,
  tags,
  activeTag,
}: PopularTagsClientProps) {
  const [orderedTags, setOrderedTags] = useState<string[]>(tags)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  const handleDragStart = (index: number) => {
    setDraggedIdx(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === index) return
    setOverIdx(index)
  }

  const handleDrop = (index: number) => {
    if (draggedIdx === null || draggedIdx === index) {
      setDraggedIdx(null)
      setOverIdx(null)
      return
    }
    setOrderedTags((prev) => {
      const next = [...prev]
      const [moved] = next.splice(draggedIdx, 1)
      next.splice(index, 0, moved)
      return next
    })
    setDraggedIdx(null)
    setOverIdx(null)
  }

  const handleDragEnd = () => {
    setDraggedIdx(null)
    setOverIdx(null)
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#0B111E] dark:shadow-[0_18px_48px_-18px_rgba(0,0,0,0.65)]">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2
          className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h2>
        <span
          className="text-[10px] uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500"
          style={{ fontFamily: 'var(--font-mono)' }}
          title="Drag tags to reorder"
        >
          drag · filter
        </span>
      </div>

      {/* Uniform 2-column grid for crisp, balanced rows (no uneven jagged wrapping) */}
      <div className="grid grid-cols-2 gap-2">
        {orderedTags.map((tag, idx) => {
          const isActive =
            activeTag !== undefined &&
            activeTag.toLowerCase() === tag.toLowerCase()
          const isDragged = draggedIdx === idx
          const isOver = overIdx === idx

          return (
            <div
              key={tag}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
              className={`group relative rounded-xl transition-all duration-150 ${
                isDragged ? 'opacity-45 scale-[0.97]' : ''
              } ${
                isOver
                  ? 'ring-2 ring-emerald-400/50 dark:ring-emerald-400/40'
                  : ''
              }`}
            >
              <Link
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className={`flex w-full items-center justify-between gap-1.5 rounded-xl border px-3 py-2 font-mono text-xs font-medium transition-all ${
                  isActive
                    ? 'border-purple-400/60 bg-purple-500/15 text-purple-700 dark:border-emerald-400/45 dark:bg-emerald-400/10 dark:text-emerald-300'
                    : 'border-slate-200/80 bg-slate-50/70 text-slate-700 hover:border-purple-300/70 hover:bg-purple-50/50 hover:text-purple-700 dark:border-white/[0.07] dark:bg-white/[0.03] dark:text-slate-300 dark:hover:border-purple-400/35 dark:hover:bg-white/[0.06] dark:hover:text-white'
                }`}
              >
                <span className="truncate">#{tag}</span>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-[10px] text-slate-300 transition-colors group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400 cursor-grab active:cursor-grabbing"
                >
                  ⋮⋮
                </span>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
