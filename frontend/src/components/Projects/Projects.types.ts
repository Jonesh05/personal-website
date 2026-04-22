import type { Locale } from '@/i18n/constants'

/**
 * Localized string — used for project descriptions which the product rules
 * explicitly require to translate with the rest of the site. Project titles
 * are intentionally NOT localized (they must stay English everywhere).
 */
export type LocalizedText = Record<Locale, string>

export interface Project {
  id: string;
  /** Always English — titles never translate (product rule). */
  title: string;
  /** Per-locale description. Rendered via `description[locale]` at runtime. */
  description: LocalizedText;
  image: string;
  technologies: string[];
  category: 'web' | 'blockchain' | 'AI/ML' | 'mobile';
  status: 'completed' | 'in-progress' | 'planning';
  tags:       string[]
  liveUrl?:    string
  githubUrl?:  string
  demoUrl?:    string
  coverImage?: string
  accentColor: 'purple' | 'green'
  featured: boolean;
  year: number;
}

/**
 * Section-level chrome. Titles/subtitles come from the i18n dictionary at
 * render time so we keep a single source of truth per namespace.
 */
export interface ProjectsData {
  categories: string[];
  projects: Project[];
}
