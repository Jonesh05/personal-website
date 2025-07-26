'use client';

import { FC, useEffect, useRef } from 'react';
import { Project, ProjectsData } from './Projects.types';
import gsap from 'gsap';

interface Props {
  data: ProjectsData;
  projects: Project[];
  featuredProjects: Project[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const ProjectsPresentational: FC<Props> = ({
  data,
  projects,
  selectedCategory,
  onCategoryChange
}) => {
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    gsap.fromTo(
      cardsRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.7, ease: 'power3.out' }
    );
  }, [projects]);

  return (
    <section className="py-24 bg-gradient-to-br from-purple-900 via-slate-900 to-slate-800">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-3 text-white">{data.title}</h2>
        <p className="text-lg text-slate-300 text-center mb-12 max-w-2xl mx-auto">{data.subtitle}</p>
        <div className="flex justify-center gap-4 mb-12 flex-wrap">
          {data.categories.map(cat => (
            <button
              key={cat}
              className={`px-5 py-2.5 rounded-full font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-white/10 text-slate-200 hover:bg-purple-600 hover:text-white'
              }`}
              style={{ minWidth: '100px' }}
              onClick={() => onCategoryChange(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
        {projects?.map((project, idx) => (
            <div
              key={project.id}
              ref={el => {
                if (el) {
                  cardsRef.current[idx] = el;
                }
              }}
              className="relative group bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 flex flex-col hover:scale-[1.025] transition-all duration-300 h-full"
            >
              <img
                src={project.image}
                alt={project.title}
                className="rounded-xl w-full h-40 object-cover mb-4 border border-white/10 shadow"
              />
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2 py-1 rounded bg-purple-500 text-white font-bold uppercase">
                  {project.category}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    project.status === 'completed'
                      ? 'bg-green-500/80 text-white'
                      : project.status === 'in-progress'
                      ? 'bg-yellow-500/80 text-white'
                      : 'bg-slate-500/80 text-white'
                  }`}
                >
                  {project.status.replace('-', ' ')}
                </span>
                <span className="ml-auto text-xs text-slate-400">{project.year}</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">{project.title}</h3>
              <p className="text-slate-200 mb-6 flex-grow">{project.description}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {project.technologies.map(tech => (
                  <span
                    key={tech}
                    className="px-3 py-1 bg-purple-100/20 text-purple-300 rounded-full text-xs font-semibold"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <div className="flex gap-3 mt-auto">
                {project.links.live && (
                  <a
                    href={project.links.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1 rounded bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white hover:scale-105 transition"
                  >
                    Live
                  </a>
                )}
                {project.links.github && (
                  <a
                    href={project.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1 rounded bg-slate-700 text-white hover:bg-black transition"
                  >
                    GitHub
                  </a>
                )}
                {project.links.demo && (
                  <a
                    href={project.links.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1 rounded bg-fuchsia-600 text-white hover:bg-fuchsia-800 transition"
                  >
                    Demo
                  </a>
                )}
              </div>
              {project.featured && (
                <span className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-2 py-1 rounded-full text-[10px] font-bold shadow">
                  ★ Featured
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
