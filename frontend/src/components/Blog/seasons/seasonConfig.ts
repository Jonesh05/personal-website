// frontend/src/components/Blog/seasons/seasonConfig.ts
// Modular seasonal configuration for Matcha Range.
// Flip `DEFAULT_SEASON` anytime to switch the site's active seasonal theme
// without modifying rendering or animation code.

export type SeasonId = 'december' | 'spring' | 'autumn' | 'cyber';

export const DEFAULT_SEASON: SeasonId = 'december';

export interface SeasonTheme {
  id: SeasonId;
  shortLabel: string;
  title: string;
  subtitle: string;
  icon: string;
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  auroraA: string;
  auroraB: string;
  groundTop: string;
  groundBottom: string;
  foliageLight: string;
  foliageMid: string;
  foliageDeep: string;
  snowCap: boolean;
  starColor: string;
  bulbColors: readonly string[];
  particleColors: readonly string[];
  particleMode: 'snow' | 'petals' | 'leaves' | 'spores';
  hint: string;
}

export const SEASON_THEMES: Record<SeasonId, SeasonTheme> = {
  december: {
    id: 'december',
    shortLabel: 'Dec',
    title: 'Winter Lights',
    subtitle: 'December Edition',
    icon: '❄',
    skyTop: '#0B1736',
    skyMid: '#132A52',
    skyBottom: '#1C3E6E',
    auroraA: 'rgba(52, 211, 153, 0.24)',
    auroraB: 'rgba(251, 191, 36, 0.20)',
    groundTop: '#E2F1FF',
    groundBottom: '#93C5FD',
    foliageLight: '#34D399',
    foliageMid: '#059669',
    foliageDeep: '#064E3B',
    snowCap: true,
    starColor: '#FEF08A',
    bulbColors: ['#FDE68A', '#FBBF24', '#FB7185', '#34D399', '#7DD3FC', '#F9A8D4'],
    particleColors: ['#FFFFFF', '#E0F2FE', '#FEF9C3'],
    particleMode: 'snow',
    hint: 'Swirl snow · Click to sparkle',
  },
  spring: {
    id: 'spring',
    shortLabel: 'Spr',
    title: 'Sakura Matcha',
    subtitle: 'Spring Bloom',
    icon: '✿',
    skyTop: '#1A2442',
    skyMid: '#2D3A64',
    skyBottom: '#4A4E7D',
    auroraA: 'rgba(244, 114, 182, 0.22)',
    auroraB: 'rgba(253, 224, 71, 0.16)',
    groundTop: '#A7F3D0',
    groundBottom: '#059669',
    foliageLight: '#6EE7B7',
    foliageMid: '#10B981',
    foliageDeep: '#047857',
    snowCap: false,
    starColor: '#FBCFE8',
    bulbColors: ['#F9A8D4', '#FDE68A', '#FBCFE8', '#A7F3D0'],
    particleColors: ['#FBCFE8', '#F9A8D4', '#FFF1F2'],
    particleMode: 'petals',
    hint: 'Drift petals · Click to bloom',
  },
  autumn: {
    id: 'autumn',
    shortLabel: 'Aut',
    title: 'Amber Canopy',
    subtitle: 'Autumn Glow',
    icon: '✦',
    skyTop: '#1E1426',
    skyMid: '#3A1F2D',
    skyBottom: '#613331',
    auroraA: 'rgba(251, 146, 60, 0.24)',
    auroraB: 'rgba(245, 158, 11, 0.18)',
    groundTop: '#FDBA74',
    groundBottom: '#9A3412',
    foliageLight: '#FBBF24',
    foliageMid: '#EA580C',
    foliageDeep: '#991B1B',
    snowCap: false,
    starColor: '#FDE68A',
    bulbColors: ['#FDE68A', '#FB923C', '#F87171', '#FCD34D'],
    particleColors: ['#FB923C', '#FBBF24', '#F87171'],
    particleMode: 'leaves',
    hint: 'Rustle leaves · Click for glow',
  },
  cyber: {
    id: 'cyber',
    shortLabel: 'Cyb',
    title: 'Neon Forest',
    subtitle: 'Digital Flora',
    icon: '◈',
    skyTop: '#060B19',
    skyMid: '#0D1730',
    skyBottom: '#13213D',
    auroraA: 'rgba(0, 255, 178, 0.22)',
    auroraB: 'rgba(191, 94, 255, 0.22)',
    groundTop: '#1E293B',
    groundBottom: '#0F172A',
    foliageLight: '#00FFB2',
    foliageMid: '#10B981',
    foliageDeep: '#065F46',
    snowCap: false,
    starColor: '#00FFB2',
    bulbColors: ['#00FFB2', '#BF5EFF', '#38BDF8', '#A7F3D0'],
    particleColors: ['#00FFB2', '#BF5EFF', '#7DD3FC'],
    particleMode: 'spores',
    hint: 'Bend field · Click to surge',
  },
};

export const SEASON_ORDER: readonly SeasonId[] = [
  'december',
  'spring',
  'autumn',
  'cyber',
];
