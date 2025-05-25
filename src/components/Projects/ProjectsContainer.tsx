'use client';

import { ProjectsPresentational } from './ProjectsPresentational';
import { useProjects } from './useProjects';

const ProjectsContainer = () => {
  const { data, selectedCategory, setSelectedCategory, filteredProjects } = useProjects();
  return (
    <ProjectsPresentational
      data={data}
      projects={filteredProjects}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
    />
  );
};

export default ProjectsContainer;
