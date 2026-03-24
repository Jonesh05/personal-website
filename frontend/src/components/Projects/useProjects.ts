'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProjectsData, Project } from './Projects.types';

const filterProjectsByCategory = (projects: Project[], category: string): Project[] => {
  if (category === 'all') return projects;
  return projects.filter(project => project.category === category);
};

const getFeaturedProjects = (projects: Project[]): Project[] => {
  return projects.filter(project => project.featured);
};

const PROJECTS_DATA: ProjectsData = {
  title: 'Proyectos Destacados',
  subtitle: 'Una selección de mis trabajos en Web3, AI y desarrollo frontend',
  categories: ['all', 'web', 'blockchain', 'AI/ML'],
  projects: [
    {
      id: '1',
      title: 'Utilscore E-commerce',
      description:
        'Plataforma de comercio electrónico completa construida con Vite + React + TypeScript. Incluye carrito, checkout, gestión de productos y panel administrativo.',
      image: 'https://picsum.photos/400/250?grayscale',
      technologies: ['React', 'TypeScript', 'Vite', 'Tailwind', 'Zustand'],
      tags:        ['React', 'TypeScript', 'Vite', 'Tailwind', 'Zustand'],
      category:    'web',
      status:      'completed',
      accentColor: 'green',
      featured:    true,
      year:        2024,
      liveUrl:     'https://ecommerce-demo.com',
      githubUrl:   'https://github.com/usuario/ecommerce',
    },
    {
      id: '2',
      title: 'NFT ReFi Platform',
      description:
        'Plataforma de finanzas regenerativas usando NFTs para proyectos ambientales. Smart contracts, minting y marketplace integrado.',
      image: '/images/NFT-card.webp',
      technologies: ['Solidity', 'Hardhat', 'RainbowKit', 'Next.js', 'IPFS'],
      tags:         ['Solidity', 'Hardhat', 'RainbowKit', 'Next.js', 'IPFS'],
      category:    'blockchain',
      status:      'completed',
      accentColor: 'purple',
      featured:    true,
      year:        2024,
      demoUrl:     'https://nft-refi-demo.com',
      githubUrl:   'https://github.com/usuario/nft-refi',
    },
    {
      id: '3',
      title: 'Quantum Computing Research',
      description:
        'Investigación y desarrollo con Qiskit para algoritmos cuánticos aplicados a optimización de portfolios y machine learning.',
      image: 'https://picsum.photos/400/250?grayscale',
      technologies: ['Qiskit', 'Python', 'Jupyter', 'NumPy', 'Matplotlib'],
      tags:         ['Qiskit', 'Python', 'Jupyter', 'NumPy', 'Matplotlib'],
      category:    'AI/ML',
      status:      'in-progress',
      accentColor: 'green',
      featured:    false,
      year:        2024,
      githubUrl:   'https://github.com/usuario/quantum-research',
    },
    {
      id: '4',
      title: 'Hackathon Clerk',
      description:
        'Solución ganadora en hackathon blockchain para trazabilidad de cadena de suministro usando smart contracts y oráculos.',
      image: 'https://picsum.photos/400/250?grayscale',
      technologies: ['Solidity', 'Chainlink', 'React', 'Web3.js', 'Node.js'],
      tags:         ['Solidity', 'Chainlink', 'React', 'Web3.js', 'Node.js'],
      category:    'blockchain',
      status:      'completed',
      accentColor: 'purple',
      featured:    true,
      year:        2023,
      demoUrl:     'https://supply-chain-demo.com',
    },
    {
      id: '5',
      title: 'Design System & UI Kit',
      description:
        'Sistema de diseño completo con componentes reutilizables, tokens de diseño y documentación interactiva para equipos de desarrollo.',
      image: 'https://picsum.photos/400/250?grayscale',
      technologies: ['React', 'Storybook', 'Figma', 'Styled Components'],
      tags:         ['React', 'Storybook', 'Figma', 'Styled Components'],
      category:    'web',
      status:      'completed',
      accentColor: 'green',
      featured:    false,
      year:        2023,
      liveUrl:     'https://design-system-demo.com',
    },
    {
      id: '6',
      title: 'AI Trading Bot',
      description:
        'Bot de trading automatizado usando machine learning para análisis técnico y ejecución de estrategias en mercados crypto.',
      image: 'https://picsum.photos/400/250?grayscale',
      technologies: ['Python', 'TensorFlow', 'Pandas', 'Binance API'],
      tags:         ['Python', 'TensorFlow', 'Pandas', 'Binance API'],
      category:    'AI/ML',
      status:      'in-progress',
      accentColor: 'purple',
      featured:    false,
      year:        2024,
      githubUrl:   'https://github.com/usuario/ai-trading-bot',
    },
  ],
};

export const useProjects = () => {
  const [data, setData]                     = useState<ProjectsData | null>(null);
  const [loading, setLoading]               = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const load = async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
      setData(PROJECTS_DATA);
      setLoading(false);
    };
    load();
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const filteredProjects  = data ? filterProjectsByCategory(data.projects, selectedCategory) : [];
  const featuredProjects  = getFeaturedProjects(filteredProjects);

  return {
    data,
    loading,
    selectedCategory,
    setSelectedCategory: handleCategoryChange,
    filteredProjects,
    featuredProjects,
  };
};
