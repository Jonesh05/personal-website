export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  technologies: string[];
  category: 'web' | 'blockchain' | 'ai' | 'mobile';
  status: 'completed' | 'in-progress' | 'planning';
  links: {
    live?: string;
    github?: string;
    demo?: string;
  };
  featured: boolean;
  year: number;
}

export interface ProjectsData {
  title: string;
  subtitle: string;
  categories: string[];
  projects: Project[];
}
