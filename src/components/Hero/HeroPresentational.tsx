import { FC } from 'react';
import { HeroData } from '../../hooks/useHeroData';
import { motion } from 'framer-motion';

interface HeroPresentationalProps {
  data: HeroData;
}

const gradientText = 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-slate-500 bg-clip-text text-transparent';

export const HeroPresentational: FC<HeroPresentationalProps> = ({ data }) => (
  <section className="relative min-h-[80vh] flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-slate-900 to-slate-800">
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', bounce: 0.5, duration: 1 }}
      className="relative z-10 flex flex-col items-center"
    >
      <motion.div
        className="w-40 h-40 rounded-full bg-white bg-opacity-10 backdrop-blur-lg border border-white/20 shadow-xl flex items-center justify-center mb-6"
        initial={{ scale: 0.7 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
      >
        <img
          src={data.avatar}
          alt={data.name}
          className="w-32 h-32 rounded-full object-cover border-4 border-white/30 shadow-lg"
        />
      </motion.div>
      <h1 className={`text-4xl md:text-6xl font-extrabold text-center mb-4 ${gradientText}`}>{data.name}</h1>
      <p className="text-lg md:text-2xl text-slate-200 text-center max-w-2xl mb-8">
        {data.description}
      </p>
      <div className="flex gap-6 mb-8">
        {data.social.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-100 hover:text-purple-400 transition-colors text-2xl"
          >
            {link.icon}
          </a>
        ))}
      </div>
    </motion.div>
    {/* Scroll Indicator */}
    <motion.div
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center"
      animate={{ y: [0, 20, 0] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
    >
      <div className="w-2 h-8 bg-gradient-to-b from-purple-400 to-slate-400 rounded-full opacity-70" />
      <span className="text-xs text-slate-300 mt-2">Scroll</span>
    </motion.div>
  </section>
);
