'use client';

import React, { useState, useEffect } from 'react';
import { TerminalIcon } from '@/components/ui/Icons';


const gradientText = 'bg-linear-to-r from-purple-100 via-fuchsia-400 to-gray-500 bg-clip-text text-transparent';

interface TerminalLine {
  text: string;
  type: 'command' | 'success' | 'error' | 'warning';
  delay?: number;
}

const About: React.FC = () => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showCursor, setShowCursor] = useState(true);

  const terminalSequence: TerminalLine[] = [
    { text: '$ Compilando algoritmos de inteligencia artificial', type: 'command' },
    { text: 'Completado [100%]', type: 'success', delay: 800 },
    { text: '$ Hackeando la matrix', type: 'command', delay: 1000 },
    { text: 'Completado [100%]', type: 'success', delay: 800 },
    { text: '$ Generando claves de cifrado de 8192 bits', type: 'command', delay: 1000 },
    { text: 'Completado [100%]', type: 'success', delay: 800 },
    { text: '# Intentando optimizar recursos. Error:', type: 'warning', delay: 1200 },
    { text: 'Incompetencia institucional.', type: 'warning', delay: 600 },
    { text: 'ERROR [Código: 0xE45F]', type: 'error', delay: 800 },
    { text: '> _', type: 'command', delay: 1000 }
  ];

  const [displayedLines, setDisplayedLines] = useState<TerminalLine[]>([]);

  useEffect(() => {
    if (currentLineIndex >= terminalSequence.length) {
      setIsTyping(false);
      return;
    }

    const currentLine = terminalSequence[currentLineIndex];
    let charIndex = 0;

    const typeWriter = () => {
      if (charIndex < currentLine.text.length) {
        setCurrentText(currentLine.text.slice(0, charIndex + 1));
        charIndex++;
        setTimeout(typeWriter, 50 + Math.random() * 50);
      } else {
        // Line completed, add to displayed lines
        setTimeout(() => {
          setDisplayedLines(prev => [...prev, currentLine]);
          setCurrentText('');
          setCurrentLineIndex(prev => prev + 1);
        }, currentLine.delay || 500);
      }
    };

    setTimeout(typeWriter, 200);
  }, [currentLineIndex]);

  // Cursor blinking effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  // Reset animation every 15 seconds
  useEffect(() => {
    const resetInterval = setInterval(() => {
      setDisplayedLines([]);
      setCurrentLineIndex(0);
      setCurrentText('');
      setIsTyping(true);
    }, 15000);
    return () => clearInterval(resetInterval);
  }, []);

  const getLineColor = (type: string) => {
    switch (type) {
      case 'command': return 'text-blue-400';
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-white';
    }
  };

  return (
    <section id="about" className="py-20">
      <div className="container mx-auto px-4">
        <div className="md:col-span-5 backdrop-blur-xs border-3 shadow-[4px_4px_0_rgba(0,0,0,1)] rounded-2xl p-6 flex flex-col transition-all duration-300 animate-slide-up bg-gray-900"> 
          <div className="space-y-6">
            <div className="flex flex-wrap pb-6">
              <h2 className={`px-4 py-2 rounded-full bg-primary-50 font-bold text-4xl transition text-center mb-6 shadow-lg ${gradientText} hover:text-cyan-400`}>ABOUT</h2>
            </div>
            <p className="text-xl font-semibold text-zinc-50">
              Hi, I'm Jhonny👋, a Colombian entrepreneur with a passion for Web3 and blockchain technology.
              With a background in full-stack development, I specialize in creating innovative solutions that leverage
              the power of decentralized technologies.
            </p>
            <p className="text-xl font-semibold text-zinc-50">
              I'm a student of Cybersecurity Engineer. My journey in tech started with traditional web development, but I quickly found my passion in the
              decentralized space. I'm constantly exploring new possibilities in Web3, from DeFi applications to
              NFTs and beyond.
            </p>
            <div className="flex flex-wrap gap-4 pb-6">
              <span className={`px-4 py-2 rounded-full bg-primary-50 font-semibold transition text-center mb-4 shadow-lg ${gradientText} hover:text-cyan-400`}>Full Stack Developer</span>
              <span className={`px-4 py-2 rounded-full bg-primary-50 font-semibold transition text-center mb-4 shadow-lg ${gradientText} hover:text-cyan-400`}>DevRel</span>
              <span className={`px-4 py-2 rounded-full bg-primary-50 font-semibold transition text-center mb-4 shadow-lg ${gradientText} hover:text-cyan-400`}>Web3 Enthusiast</span>
            </div>
          </div>
          {/* Terminal Section */}
          <div className="max-w-7xl  mt-8 mb-16">
            <div className="bg-black/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-900/30 border border-gray-700/50 overflow-hidden">
              {/* Terminal Header */}
              <div className="bg-gray-800/50 px-6 py-4 flex items-center justify-between border-b border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <TerminalIcon className="w-4 h-4" />
                  <span className="text-sm font-mono">terminal</span>
                </div>
              </div>

              {/* Terminal Body */}
              <div className="p-6 font-mono text-sm leading-relaxed min-h-80">
                {displayedLines.map((line, index) => (
                  <div key={index} className={`mb-2 ${getLineColor(line.type)}`}>
                    {line.text}
                  </div>
                ))}

                {isTyping && currentText && (
                  <div className={`mb-2 ${getLineColor(terminalSequence[currentLineIndex]?.type || 'command')}`}>
                    {currentText}
                    {showCursor && <span className="bg-blue-400 text-black ml-1 animate-pulse">|</span>}
                  </div>
                )}

                {!isTyping && (
                  <div className="text-blue-400 animate-pulse">
                    &gt; <span className={showCursor ? 'opacity-100' : 'opacity-0'}>_</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div> 
      </div>

    </section>
  );
};

export default About;
