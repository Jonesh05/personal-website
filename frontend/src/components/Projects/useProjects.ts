'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProjectsData, Project } from './Projects.types';
import type { ProjectImage } from '@/lib/cdn/image';

const filterProjectsByCategory = (projects: Project[], category: string): Project[] => {
  if (category === 'all') return projects;
  return projects.filter(project => project.category === category);
};

const getFeaturedProjects = (projects: Project[]): Project[] => {
  return projects.filter(project => project.featured);
};

/**
 * PROJECTS_DATA the single source of truth for the Projects section.
  layer only for display labels (see
 *     `ProjectsPresentational`).
 */
// ─── Image descriptors ────────────────────────────────────────────────────────
// Use { provider: 'og' } until a real asset is uploaded to your CDN.
// To swap to Cloudinary: { provider: 'cloudinary', publicId: 'projects/slug' }
// To swap to Cloudflare: { provider: 'cloudflare', imageId: 'abc123' }
// The resolver (resolveProjectImage) handles all URL construction automatically.
// ─────────────────────────────────────────────────────────────────────────────

const img = (p: ProjectImage): ProjectImage => p

const PROJECTS_DATA: ProjectsData = {
  categories: ['all', 'web', 'blockchain', 'AI/ML'],
  projects: [
    {
      id: '1',
      title: 'Lanark Agentic E-commerce',
      description: {
        en: 'LANARK is an Execution Agentic Marketplace built on CELO. It integrates artificial intelligence, on-chain payments, stablecoins, and automation so that a user can discover products, negotiate, buy, and execute the entire transaction from a single experience.',
        es: 'LANARK es un Execution Agentic Marketplace construido sobre CELO. Integra inteligencia artificial, pagos on-chain, stablecoins y automatización para que un usuario pueda descubrir productos, negociar, comprar y ejecutar toda la transacción desde una única experiencia.',
      },
      image: img({ provider: 'og' }),
      technologies: ['React', 'TypeScript', 'Wagmi', 'Reown', 'Vercel AI SDK', 'SUPABASE', 'Azure Services'],
      tags:        ['React', 'TypeScript', 'Wagmi', 'Reown', 'Vercel AI SDK', 'SUPABASE', 'Azure Services'],
      category:    'web',
      status:      'completed',
      accentColor: 'green',
      featured:    true,
      year:        2026,
      demoUrl:     'https://lanark-marketplace-agentic.vercel.app',
      liveUrl:     'lanark-marketplace-agentic.vercel.app',
      githubUrl:   'https://github.com/Jonesh05/lanark-marketplace-agentic/',
    },
    {
      id: '2',
      title: 'Carbon Mint',
      description: {
        en: 'Regenerative-finance platform that uses NFTs to fund environmental projects. Smart contracts, minting and an integrated marketplace.',
        es: 'Plataforma de finanzas regenerativas que usa NFTs para proyectos ambientales. Smart contracts, minteo y marketplace integrado.',
      },
      // Swap to { provider: 'cloudinary', publicId: 'projects/nft-refi' } once uploaded
      image: img({ provider: 'og' }),
      technologies: ['Solidity', 'Hardhat', 'RainbowKit', 'Next.js', 'IPFS'],
      tags:         ['Solidity', 'Hardhat', 'RainbowKit', 'Next.js', 'IPFS'],
      category:    'blockchain',
      status:      'completed',
      accentColor: 'purple',
      featured:    true,
      year:        2024,
      demoUrl:     'https://nft-refi-demo.com',
      githubUrl:   'https://github.com/Jonesh05/CarbonMint-web3',
    },
    {
      id: '3',
      title: 'Quantum Computing Research',
      description: {
        en: 'Research and prototypes in Qiskit for quantum algorithms applied to portfolio optimization and ML workloads.',
        es: 'Investigación y prototipos con Qiskit para algoritmos cuánticos aplicados a optimización de portafolios y cargas de ML.',
      },
      image: img({ provider: 'og' }),
      technologies: ['Qiskit', 'Python', 'Jupyter', 'NumPy', 'Matplotlib'],
      tags:         ['Qiskit', 'Python', 'Jupyter', 'NumPy', 'Matplotlib'],
      category:    'AI/ML',
      status:      'in-progress',
      accentColor: 'green',
      featured:    false,
      year:        2025,
      githubUrl:   'https://github.com/usuario/quantum-research',
    },
    {
      id: '4',
      title: 'Hackathon Clerk',
      description: {
        en: 'Hackathon entry: a supply-chain traceability system built on smart contracts and decentralized oracles.',
        es: 'Hackathon: un sistema de trazabilidad de cadena de suministro basado en smart contracts y oráculos descentralizados.',
      },
      image: img({ provider: 'og' }),
      technologies: ['Solidity', 'Chainlink', 'React', 'Web3.js', 'Node.js'],
      tags:         ['Solidity', 'Chainlink', 'React', 'Web3.js', 'Node.js'],
      category:    'blockchain',
      status:      'completed',
      accentColor: 'purple',
      featured:    true,
      year:        2025,
      demoUrl:     'https://supply-chain-demo.com',
    },
    {
      id: '5',
      title: 'Design System & UI Kit',
      description: {
        en: 'A complete design system with reusable components, design tokens and interactive documentation tailored for product teams.',
        es: 'Sistema de diseño completo con componentes reutilizables, tokens de diseño y documentación interactiva orientada a equipos de producto.',
      },
      image: img({ provider: 'og' }),
      technologies: ['React', 'Storybook', 'Figma', 'Styled Components'],
      tags:         ['React', 'Storybook', 'Figma', 'Styled Components'],
      category:    'web',
      status:      'completed',
      accentColor: 'green',
      featured:    false,
      year:        2025,
      liveUrl:     'https://design-system-demo.com',
    },
    {
      id: '6',
      title: 'AI Trading Bot',
      description: {
        en: 'Automated trading bot that combines ML-driven technical analysis with strategy execution across crypto exchanges.',
        es: 'Bot de trading automatizado que combina análisis técnico dirigido por ML con ejecución de estrategias en exchanges cripto.',
      },
      image: img({ provider: 'og' }),
      technologies: ['Python', 'TensorFlow', 'Pandas', 'Binance API'],
      tags:         ['Python', 'TensorFlow', 'Pandas', 'Binance API'],
      category:    'AI/ML',
      status:      'in-progress',
      accentColor: 'purple',
      featured:    false,
      year:        2025,
      githubUrl:   'https://github.com/usuario/ai-trading-bot',
    },
  ],
};

export const useProjects = () => {
  const [data, setData]                     = useState<ProjectsData | null>(null);
  const [loading, setLoading]               = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    setData(PROJECTS_DATA);
    setLoading(false);
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
