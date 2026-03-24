export interface Project {
  id: string;
  title: string;
  description: string;
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

export interface ProjectsData {
  title: string;
  subtitle: string;
  categories: string[];
  projects: Project[];
}
