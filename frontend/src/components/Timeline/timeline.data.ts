export type TimelineCategory =
  | 'foundations'
  | 'career'
  | 'product'
  | 'research'
  | 'current';

export interface TimelineEntry {

  id: string;
  /** Calendar year the milestone started. */
  year: number;

  title: string;
  /** Translation key in the `Timeline` namespace (description body). */
  descriptionKey: string;
  /** Translation key for the small category label above the title. */
  categoryKey: string;
  /** Visual accent bucket; maps to a colour in the Timeline component. */
  category: TimelineCategory;

  tags?: readonly string[];
  /** Marks the live / active milestone. Exactly one entry should set this. */
  current?: boolean;
}

export const TIMELINE_ENTRIES: readonly TimelineEntry[] = [
  {
    id: '2021-full-stack',
    year: 2021,
    title: 'Full Stack Foundations',
    descriptionKey: 'entry_2021_desc',
    categoryKey: 'cat_foundations',
    category: 'foundations',
    tags: ['React', 'Node.js', 'TypeScript'],
  },
  {
    id: '2022-cloud',
    year: 2022,
    title: 'AWS Cloud Architect',
    descriptionKey: 'entry_2022_desc',
    categoryKey: 'cat_foundations',
    category: 'foundations',
    tags: ['AWS', 'Next.js', 'Serverless'],
  },
  {
    id: '2023-blockchain-dev',
    year: 2023,
    title: 'Blockchain Developer',
    descriptionKey: 'entry_2023_desc',
    categoryKey: 'cat_career',
    category: 'career',
    tags: ['Solidity', 'Blockchain', 'IPFS'],
  },
  {
    id: '2024-web3-entrepreneur',
    year: 2024,
    title: 'Web3 Entrepreneur',
    descriptionKey: 'entry_2024_desc',
    categoryKey: 'cat_product',
    category: 'product',
    tags: ['Web3', 'DevRel', 'Hackathons'],
  },
  {
    id: '2025-quantum-research',
    year: 2025,
    title: 'Quantum Computing Research',
    descriptionKey: 'entry_2025_desc',
    categoryKey: 'cat_research',
    category: 'research',
    tags: ['Qiskit', 'AI', 'ML'],
  },
  {
    id: '2026-ai-web3-product',
    year: 2026,
    title: 'AI × Web3 Product Engineer',
    descriptionKey: 'entry_2026_desc',
    categoryKey: 'cat_current',
    category: 'current',
    tags: ['AI', 'ReFi', 'Web3'],
    current: true,
  },
] as const;
