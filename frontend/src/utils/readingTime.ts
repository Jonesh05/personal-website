/**
 * Estimate reading time in minutes based on a word-count heuristic.
 * Uses 220 wpm — a common value for technical English/Spanish prose — and
 * always returns at least one minute.
 */
export function estimateReadingTime(text: string | undefined | null): number {
  if (!text) return 1
  const words = text.trim().split(/\s+/).filter(Boolean).length
  if (words === 0) return 1
  return Math.max(1, Math.round(words / 220))
}
