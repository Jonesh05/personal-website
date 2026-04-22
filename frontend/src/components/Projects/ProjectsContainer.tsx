'use client';

import { useProjects } from './useProjects';
import { ProjectsPresentational } from './ProjectsPresentational';
import { useTranslations } from '@/i18n';

const ProjectsContainer = () => {
  const t = useTranslations('Projects');
  const {
    data,
    loading,
    selectedCategory,
    setSelectedCategory,
    filteredProjects,
    featuredProjects,
  } = useProjects();

  if (loading) {
    return (
      <section className="py-20 text-center">
        <p className="text-white">{t('loading')}</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="py-20 text-center">
        <p className="text-red-400">{t('error')}</p>
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
