'use client';

import React, { useState, useEffect } from 'react';

interface TerminalLine {
  text: string;
  type: 'command' | 'success' | 'error' | 'warning';
  delay?: number;
}

export default function TerminalAnimations() {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showCursor, setShowCursor] = useState(true);
  const [displayedLines, setDisplayedLines] = useState<TerminalLine[]>([]);

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

    const initialTimeout = setTimeout(typeWriter, 200);
    return () => clearTimeout(initialTimeout);
  }, [currentLineIndex, terminalSequence]);

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
    <>
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
    </>
  );
}
