export default function PostCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-white/[0.08] dark:bg-[#0B111E] animate-pulse">
      <div className="aspect-[16/10] w-full bg-slate-200 dark:bg-white/[0.05]" />
      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="h-4 w-16 rounded bg-slate-200 dark:bg-white/[0.06]" />
            <div className="h-3 w-14 rounded bg-slate-200 dark:bg-white/[0.06]" />
          </div>
          <div className="mb-2 h-5 w-4/5 rounded bg-slate-200 dark:bg-white/[0.08]" />
          <div className="mb-4 h-5 w-3/5 rounded bg-slate-200 dark:bg-white/[0.08]" />
          <div className="mb-1.5 h-3.5 w-full rounded bg-slate-200 dark:bg-white/[0.05]" />
          <div className="mb-6 h-3.5 w-5/6 rounded bg-slate-200 dark:bg-white/[0.05]" />
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/[0.06]">
          <div className="h-3.5 w-28 rounded bg-slate-200 dark:bg-white/[0.06]" />
          <div className="h-3 w-20 rounded bg-slate-200 dark:bg-white/[0.06]" />
        </div>
      </div>
    </div>
  )
}
