'use client';

import { useProjects } from './useProjects';
import { ProjectsPresentational } from './ProjectsPresentational';

const ProjectsContainer = () => {
  const {
    data,
    loading,
    selectedCategory,
    setSelectedCategory,
    filteredProjects,
    featuredProjects,
  } = useProjects();

  // 1. Estado de carga
  if (loading) {
    return (
      <section className="py-20 text-center">
        <p className="text-white">Cargando proyectos…</p>
      </section>
    );
  }

  // 2. Fallback por si data sigue siendo null (muy improbable tras loading)
  if (!data) {
    return (
      <section className="py-20 text-center">
        <p className="text-red-400">Error al cargar proyectos.</p>
      </section>
    );
  }

  // 3. Render del presentational con datos garantizados no-null
  return (
    <ProjectsPresentational
      data={data}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      projects={filteredProjects}
      featuredProjects={featuredProjects}
    />
  );
};

export default ProjectsContainer;
