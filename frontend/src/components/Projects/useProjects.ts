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

/**
 * PROJECTS_DATA — the single source of truth for the Projects section.
 *
 * Rules enforced by the shape:
 *   • `title` is a plain string → authored in English; never translated.
 *   • `description` is a `{ en, es }` record → both languages live side-by-side
 *     so the component can pick the right variant based on the active locale.
 *   • Category names (`web`, `blockchain`, `AI/ML`) are identifiers, not
 *     copy. They travel through the i18n layer only for display labels (see
 *     `ProjectsPresentational`).
 */
const PROJECTS_DATA: ProjectsData = {
  categories: ['all', 'web', 'blockchain', 'AI/ML'],
  projects: [
    {
      id: '1',
      title: 'Utilscore E-commerce',
      description: {
        en: 'A full e-commerce platform built with Vite + React + TypeScript. Ships with cart, checkout, product management and an admin dashboard.',
        es: 'Plataforma de comercio electrónico completa construida con Vite + React + TypeScript. Incluye carrito, checkout, gestión de productos y panel administrativo.',
      },
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
      description: {
        en: 'Regenerative-finance platform that uses NFTs to fund environmental projects. Smart contracts, minting and an integrated marketplace.',
        es: 'Plataforma de finanzas regenerativas que usa NFTs para proyectos ambientales. Smart contracts, minteo y marketplace integrado.',
      },
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
      description: {
        en: 'Research and prototypes in Qiskit for quantum algorithms applied to portfolio optimization and ML workloads.',
        es: 'Investigación y prototipos con Qiskit para algoritmos cuánticos aplicados a optimización de portafolios y cargas de ML.',
      },
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
      description: {
        en: 'Winning hackathon entry: a supply-chain traceability system built on smart contracts and decentralized oracles.',
        es: 'Proyecto ganador de hackathon: un sistema de trazabilidad de cadena de suministro basado en smart contracts y oráculos descentralizados.',
      },
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
      description: {
        en: 'A complete design system with reusable components, design tokens and interactive documentation tailored for product teams.',
        es: 'Sistema de diseño completo con componentes reutilizables, tokens de diseño y documentación interactiva orientada a equipos de producto.',
      },
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
      description: {
        en: 'Automated trading bot that combines ML-driven technical analysis with strategy execution across crypto exchanges.',
        es: 'Bot de trading automatizado que combina análisis técnico dirigido por ML con ejecución de estrategias en exchanges cripto.',
      },
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
