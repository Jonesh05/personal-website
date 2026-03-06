'use client';

import { useState } from 'react';
import { Project, ProjectsData } from './Projects.types';
import { ProjectsPresentational } from './ProjectsPresentational';

interface Props {
  data: ProjectsData;
  initialProjects: Project[];
  initialFeaturedProjects: Project[];
}

export default function ProjectFilter({ data, initialProjects, initialFeaturedProjects }: Props) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProjects = selectedCategory === 'all'
    ? initialProjects
    : initialProjects.filter(p => p.category === selectedCategory);

  const featuredProjects = filteredProjects.filter(p => p.featured);

  return (
    <ProjectsPresentational
      data={data}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      projects={filteredProjects}
      featuredProjects={featuredProjects}
    />
  );
}
