'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { TerminalIcon } from '@/components/ui/Icons';
import { useTranslations } from '@/i18n';

/**
 * About — bilingual (EN default, ES via navbar toggle).
 *
 * Translation scope (per product rules):
 *   • Section heading "About" → never translates (static key).
 *   • Bios → translated (About.bio_1 / bio_2).
 *   • Role pills → translated (role_1..3); "DevRel" / "Web3" stay English via
 *     STATIC_KEYS, so the pill reads the same across locales.
 *   • Terminal dialogue → translated through discrete keys so the typewriter
 *     animation stays deterministic (no parsing of mixed-language strings).
 */

const gradientText =
  'bg-linear-to-r from-purple-100 via-fuchsia-400 to-gray-500 bg-clip-text text-transparent';

type LineType = 'command' | 'success' | 'error' | 'warning';
interface TerminalLine {
  text: string;
  type: LineType;
  delay?: number;
}

const About: React.FC = () => {
  const t = useTranslations('About');

  // Terminal sequence is derived from the current locale. useMemo ensures the
  // typewriter effect resets cleanly whenever the user switches language.
  const terminalSequence: TerminalLine[] = useMemo(
    () => [
      { text: t('terminal_cmd_1'),     type: 'command' },
      { text: t('terminal_completed'), type: 'success', delay: 800 },
      { text: t('terminal_cmd_2'),     type: 'command', delay: 1000 },
      { text: t('terminal_completed'), type: 'success', delay: 800 },
      { text: t('terminal_cmd_3'),     type: 'command', delay: 1000 },
      { text: t('terminal_completed'), type: 'success', delay: 800 },
      { text: t('terminal_warning_1'), type: 'warning', delay: 1200 },
      { text: t('terminal_warning_2'), type: 'warning', delay: 600 },
      { text: t('terminal_error'),     type: 'error',   delay: 800 },
      { text: '> _',                   type: 'command', delay: 1000 },
    ],
    [t],
  );

  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showCursor, setShowCursor] = useState(true);
  const [displayedLines, setDisplayedLines] = useState<TerminalLine[]>([]);

  // Reset the typewriter whenever the language (and therefore the sequence)
  // changes, so the user never sees half-English / half-Spanish lines.
  useEffect(() => {
    setDisplayedLines([]);
    setCurrentLineIndex(0);
    setCurrentText('');
    setIsTyping(true);
  }, [terminalSequence]);

  useEffect(() => {
    if (currentLineIndex >= terminalSequence.length) {
      setIsTyping(false);
      return;
    }

    const currentLine = terminalSequence[currentLineIndex];
    let charIndex = 0;
    let cancelled = false;

    const typeWriter = () => {
      if (cancelled) return;
      if (charIndex < currentLine.text.length) {
        setCurrentText(currentLine.text.slice(0, charIndex + 1));
        charIndex++;
        setTimeout(typeWriter, 50 + Math.random() * 50);
      } else {
        setTimeout(() => {
          if (cancelled) return;
          setDisplayedLines(prev => [...prev, currentLine]);
          setCurrentText('');
          setCurrentLineIndex(prev => prev + 1);
        }, currentLine.delay || 500);
      }
    };

    const kickoff = setTimeout(typeWriter, 200);
    return () => {
      cancelled = true;
      clearTimeout(kickoff);
    };
  }, [currentLineIndex, terminalSequence]);

  useEffect(() => {
    const cursorInterval = setInterval(() => setShowCursor(prev => !prev), 500);
    return () => clearInterval(cursorInterval);
  }, []);

  // Loop the sequence every 15 s so returning visitors see it again.
  useEffect(() => {
    const resetInterval = setInterval(() => {
      setDisplayedLines([]);
      setCurrentLineIndex(0);
      setCurrentText('');
      setIsTyping(true);
    }, 15000);
    return () => clearInterval(resetInterval);
  }, []);

  const getLineColor = (type: LineType | undefined) => {
    switch (type) {
      case 'command': return 'text-blue-400';
      case 'success': return 'text-green-400';
      case 'error':   return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default:        return 'text-white';
    }
  };

  return (
    <section id="about" className="py-20">
      <div className="container mx-auto px-4">
        <div className="md:col-span-5 backdrop-blur-xs border-3 shadow-[4px_4px_0_rgba(0,0,0,1)] rounded-2xl p-6 flex flex-col transition-all duration-300 animate-slide-up bg-gray-900">
          <div className="space-y-6">
            <div className="flex flex-wrap pb-6">
              {/* "About" is a frozen term per product rules — rendered as a
                  literal so it never flips to another language. */}
              <h2
                className={`px-4 py-2 rounded-full bg-primary-50 font-bold text-4xl transition text-center mb-6 shadow-lg ${gradientText} hover:text-cyan-400`}
              >
                About
              </h2>
            </div>
            <p className="text-xl font-semibold text-zinc-50">{t('bio_1')}</p>
            <p className="text-xl font-semibold text-zinc-50">{t('bio_2')}</p>
            <div className="flex flex-wrap gap-4 pb-6">
              {[t('role_1'), t('role_2'), t('role_3')].map(label => (
                <span
                  key={label}
                  className={`px-4 py-2 rounded-full bg-primary-50 font-semibold transition text-center mb-4 shadow-lg ${gradientText} hover:text-cyan-400`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Terminal Section */}
          <div className="max-w-7xl mt-8 mb-16">
            <div className="bg-black/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-900/30 border border-gray-700/50 overflow-hidden">
              <div className="bg-gray-800/50 px-6 py-4 flex items-center justify-between border-b border-gray-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <TerminalIcon className="w-4 h-4" />
                  <span className="text-sm font-mono">{t('terminal_heading_title')}</span>
                </div>
              </div>

              <div className="p-6 font-mono text-sm leading-relaxed min-h-80">
                {displayedLines.map((line, index) => (
                  <div key={index} className={`mb-2 ${getLineColor(line.type)}`}>
                    {line.text}
                  </div>
                ))}

                {isTyping && currentText && (
                  <div className={`mb-2 ${getLineColor(terminalSequence[currentLineIndex]?.type)}`}>
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
