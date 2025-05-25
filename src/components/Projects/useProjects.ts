'use client';

import { useState, useMemo } from 'react';
import { ProjectsData } from './Projects.types';

const PROJECTS_DATA: ProjectsData = {
  title: "Proyectos Destacados",
  subtitle: "Una selección de mis trabajos en Web3, AI y desarrollo frontend",
  categories: ['all', 'web', 'blockchain', 'ai'],
  projects: [
    {
      id: '1',
      title: 'E-commerce Platform',
      description: 'Plataforma de comercio electrónico completa construida con Vite + React + TypeScript. Incluye carrito, checkout, gestión de productos y panel administrativo.',
      image: '/api/placeholder/400/250',
      technologies: ['React', 'TypeScript', 'Vite', 'Tailwind', 'Zustand'],
      category: 'web',
      status: 'completed',
      links: {
        live: 'https://ecommerce-demo.com',
        github: 'https://github.com/usuario/ecommerce'
      },
      featured: true,
      year: 2024
    },
    {
      id: '2',
      title: 'NFT ReFi Platform',
      description: 'Plataforma de finanzas regenerativas usando NFTs para proyectos ambientales. Smart contracts, minting y marketplace integrado.',
      image: '/api/placeholder/400/250',
      technologies: ['Solidity', 'Hardhat', 'RainbowKit', 'Next.js', 'IPFS'],
      category: 'blockchain',
      status: 'completed',
      links: {
        demo: 'https://nft-refi-demo.com',
        github: 'https://github.com/usuario/nft-refi'
      },
      featured: true,
      year: 2024
    },
    {
      id: '3',
      title: 'Quantum Computing Research',
      description: 'Investigación y desarrollo con Qiskit para algoritmos cuánticos aplicados a optimización de portfolios y machine learning.',
      image: '/api/placeholder/400/250',
      technologies: ['Qiskit', 'Python', 'Jupyter', 'NumPy', 'Matplotlib'],
      category: 'ai',
      status: 'in-progress',
      links: {
        github: 'https://github.com/usuario/quantum-research'
      },
      featured: false,
      year: 2024
    },
    {
      id: '4',
      title: 'Blockchain Hackathon Winner',
      description: 'Solución ganadora en hackathon blockchain para trazabilidad de cadena de suministro usando smart contracts y oráculos.',
      image: '/api/placeholder/400/250',
      technologies: ['Solidity', 'Chainlink', 'React', 'Web3.js', 'Node.js'],
      category: 'blockchain',
      status: 'completed',
      links: {
        demo: 'https://supply-chain-demo.com'
      },
      featured: true,
      year: 2023
    },
    {
      id: '5',
      title: 'Design System & UI Kit',
      description: 'Sistema de diseño completo con componentes reutilizables, tokens de diseño y documentación interactiva para equipos de desarrollo.',
      image: '/api/placeholder/400/250',
      technologies: ['React', 'Storybook', 'Figma', 'Styled Components'],
      category: 'web',
      status: 'completed',
      links: {
        live: 'https://design-system-demo.com'
      },
      featured: false,
      year: 2023
    },
    {
      id: '6',
      title: 'AI Trading Bot',
      description: 'Bot de trading automatizado usando machine learning para análisis técnico y ejecución de estrategias en mercados crypto.',
      image: '/api/placeholder/400/250',
      technologies: ['Python', 'TensorFlow', 'Pandas', 'Binance API'],
      category: 'ai',
      status: 'in-progress',
      links: {
        github: 'https://github.com/usuario/ai-trading-bot'
      },
      featured: false,
      year: 2024
    }
  ]
};

export function useProjects() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const filteredProjects = useMemo(
    () =>
      selectedCategory === 'all'
        ? PROJECTS_DATA.projects
        : PROJECTS_DATA.projects.filter(p => p.category === selectedCategory),
    [selectedCategory]
  );
  return {
    data: PROJECTS_DATA,
    selectedCategory,
    setSelectedCategory,
    filteredProjects
  };
}
