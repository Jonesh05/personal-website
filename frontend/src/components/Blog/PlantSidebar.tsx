"use client";

import React, { useMemo } from "react"
import { motion } from "framer-motion"

/**
 * PlantSidebar Component
 * Stack: Next.js 16, React 19, Tailwind v4, Framer Motion
 * Pattern: Atomic Design - Organism
 * Design: Fixed left sidebar with animated growing plant
 */
export default function PlantSidebar() {
  
  const particles = useMemo(() => [
    { top: 26.94, left: 66.21 },
    { top: 28.91, left: 90.30 },
    { top: 24.76, left: 12.36 },
    { top: 94.06, left: 46.78 },
    { top: 83.63, left: 94.54 },
    { top: 56.05, left: 77.77 },
    { top: 73.78, left: 12.87 },
    { top: 29.92, left: 76.01 },
    { top: 9.59, left: 14.41 },
    { top: 58.46, left: 96.26 },
    { top: 1.45, left: 99.54 },
    { top: 19.05, left: 34.82 },
  ], []);

  return (
    <aside className="h-full w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 flex flex-col overflow-hidden">
      {/* Plant Graphic Header */}
      <div className="mb-6">
        <h2 className="text-white font-medium tracking-tight text-lg mb-1">
          Matcha Range
        </h2>
        <p className="text-white/40 text-xs font-mono uppercase tracking-widest">
          Synthesis v1.0
        </p>
      </div>

      {/* Content System Watering (SVG) */}
      <div className="relative flex-1 flex items-end justify-center min-h-400px">
        {/* Micro-particles / Stars - FIXED positions */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((particle, i) => (
            <motion.div
              key={i}
              className="absolute w-0.5 h-0.5 bg-blue-400/30 rounded-full"
              style={{
                top: `${particle.top}%`,
                left: `${particle.left}%`,
              }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 3 + i, repeat: Infinity }}
            />
          ))}
        </div>

        <svg
          viewBox="0 0 200 600"
          className="w-full h-full drop-shadow-[0_0_15px_rgba(74,222,128,0.1)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* (Stem) Animated */}
          <motion.path
            d="M100 600C100 600 100 450 100 350C100 250 80 200 80 150C80 100 100 50 100 0"
            stroke="url(#stemGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 8,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "loop",
              repeatDelay: 2
            }}
          />

          {/* (Leaves) */}
          {[
            { y: 450, x: 100, rotate: -40, delay: 2 },
            { y: 380, x: 100, rotate: 160, delay: 3.5 },
            { y: 280, x: 92, rotate: -30, delay: 5 },
            { y: 180, x: 82, rotate: 150, delay: 6.5 },
            { y: 80, x: 88, rotate: -20, delay: 8 },
          ].map((leaf, index) => (
            <motion.g
              key={index}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.1, 1], 
                opacity: 1 
              }}
              transition={{ 
                delay: leaf.delay, 
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 10 - leaf.delay
              }}
              style={{ originX: `${leaf.x}px`, originY: `${leaf.y}px` }}
            >
              <motion.path
                animate={{
                  rotate: [0, 5, -3, 2, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                d={`M${leaf.x} ${leaf.y} C${leaf.x + 20} ${leaf.y - 10}, ${leaf.x + 40} ${leaf.y + 10}, ${leaf.x} ${leaf.y + 40} C${leaf.x - 40} ${leaf.y + 10}, ${leaf.x - 20} ${leaf.y - 10}, ${leaf.x} ${leaf.y}`}
                fill="url(#leafGradient)"
                className="opacity-90"
                style={{ rotate: leaf.rotate }}
              />
            </motion.g>
          ))}

          {/* Gradients */}
          <defs>
            <linearGradient id="stemGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#1a1c20" />
              <stop offset="100%" stopColor="#4ade80" />
            </linearGradient>
            <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="100%" stopColor="#166534" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Footer del Sidebar - Integrated Links */}
      <div className="mt-auto pt-6 border-t border-white/5">
        <div className="flex flex-col gap-4">
          <div className="flex space-x-4 mt-6 justify-center">
            <motion.a 
              whileHover={{ y: -2 }} 
              href="https://github.com/jonesh05"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </motion.a>
            <motion.a 
              whileHover={{ y: -2 }} 
              href="https://linkedin.com/in/jhonny-pimiento"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </motion.a>
          </div>
        </div>
      </div>
    </aside>
  );
}