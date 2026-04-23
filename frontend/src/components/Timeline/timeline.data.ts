/**
 * timeline.data.ts — single source of truth for the Timeline entries.
 *
 * Translation contract (matches product rules):
 *   • `title` is authored in English and NEVER translated. Career titles
 *     ("Blockchain Developer", "Web3 Entrepreneur", "Quantum Computing
 *     Research") must render identically in every locale.
 *   • `descriptionKey` + `categoryKey` resolve against the Timeline i18n
 *     namespace. Only these two strings flip language when the user toggles
 *     the navbar.
 *   • Badge strings inside `tags` are treated as literal terms. Terms like
 *     "Blockchain", "Web3", "AI", "ML", "ReFi" are registered in
 *     `STATIC_KEYS` so they read the same across locales even when embedded
 *     inside translated copy.
 *
 * Extending this list: append a new entry with a unique `id` and matching
 * `entry_<year>_desc` / `cat_*` keys in `i18n/locales/{en,es}.ts`. The
 * presentation layer derives its node layout from array order.
 */

export type TimelineCategory =
  | 'foundations'
  | 'career'
  | 'product'
  | 'research'
  | 'current';

export interface TimelineEntry {
  /** Stable identifier — used as React key and anchors if needed. */
  id: string;
  /** Calendar year the milestone started. */
  year: number;
  /** Career label. Authored in English; never localized. */
  title: string;
  /** Translation key in the `Timeline` namespace (description body). */
  descriptionKey: string;
  /** Translation key for the small category label above the title. */
  categoryKey: string;
  /** Visual accent bucket; maps to a colour in the Timeline component. */
  category: TimelineCategory;
  /** Optional badges. Tech terms stay English via STATIC_KEYS. */
  tags?: readonly string[];
  /** Marks the live / active milestone. Exactly one entry should set this. */
  current?: boolean;
}

export const TIMELINE_ENTRIES: readonly TimelineEntry[] = [
  {
    id: '2020-full-stack',
    year: 2020,
    title: 'Full Stack Foundations',
    descriptionKey: 'entry_2020_desc',
    categoryKey: 'cat_foundations',
    category: 'foundations',
    tags: ['React', 'Node.js', 'TypeScript'],
  },
  {
    id: '2021-cloud',
    year: 2021,
    title: 'AWS Cloud Architect',
    descriptionKey: 'entry_2021_desc',
    categoryKey: 'cat_foundations',
    category: 'foundations',
    tags: ['AWS', 'Next.js', 'Serverless'],
  },
  {
    id: '2022-blockchain-dev',
    year: 2022,
    title: 'Blockchain Developer',
    descriptionKey: 'entry_2022_desc',
    categoryKey: 'cat_career',
    category: 'career',
    tags: ['Solidity', 'Blockchain', 'IPFS'],
  },
  {
    id: '2023-web3-entrepreneur',
    year: 2023,
    title: 'Web3 Entrepreneur',
    descriptionKey: 'entry_2023_desc',
    categoryKey: 'cat_product',
    category: 'product',
    tags: ['Web3', 'DevRel', 'Hackathons'],
  },
  {
    id: '2024-quantum-research',
    year: 2024,
    title: 'Quantum Computing Research',
    descriptionKey: 'entry_2024_desc',
    categoryKey: 'cat_research',
    category: 'research',
    tags: ['Qiskit', 'AI', 'ML'],
  },
  {
    id: '2025-ai-web3-product',
    year: 2025,
    title: 'AI × Web3 Product Engineer',
    descriptionKey: 'entry_2025_desc',
    categoryKey: 'cat_current',
    category: 'current',
    tags: ['AI', 'ReFi', 'Web3'],
    current: true,
  },
] as const;
