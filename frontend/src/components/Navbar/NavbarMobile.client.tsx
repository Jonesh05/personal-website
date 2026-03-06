'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface NavLinkItem {
  name: string;
  href: string;
}

interface SocialLinkItem {
  name: string;
  href: string;
  icon: string;
}

interface NavbarMobileProps {
  navLinks: NavLinkItem[];
  socialLinks: SocialLinkItem[];
  children: React.ReactNode;
}

const useScrollDirection = () => {
  const [scrollDirection, setScrollDirection] = useState<string | null>(null);
  const [lastScrollY, setLastScrollY] = useState<number>(0);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset;
      const direction = scrollY > lastScrollY ? "down" : "up";
      if (direction !== scrollDirection && (scrollY - lastScrollY > 10 || scrollY - lastScrollY < -10)) {
        setScrollDirection(direction);
      }
      setLastScrollY(scrollY > 0 ? scrollY : 0);
    };
    window.addEventListener("scroll", updateScrollDirection);
    return () => window.removeEventListener("scroll", updateScrollDirection);
  }, [scrollDirection, lastScrollY]);

  return scrollDirection;
};

export default function NavbarMobile({ navLinks, socialLinks, children }: NavbarMobileProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const scrollDirection = useScrollDirection();

  const handleMobileLinkClick = (): void => {
    setIsOpen(false);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 max-w-7xl mx-auto px-4 
      font-manrope transition-transform duration-300 ${
      scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"
    }`}>
      <nav className="mt-6 relative">
        <div className="flex items-center justify-between gap-6 
          rounded-full border border-white/10 
          backdrop-blur-xl shadow-2xl px-8 py-4 
          transition-all duration-300 ease-in-out
          hover:shadow-3xl hover:border-white/20">
          
          {children}

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden relative p-2.5 rounded-full transition-all duration-300 
              hover:bg-white/10 active:scale-95 focus:outline-none focus:ring-2 
              focus:ring-white/20"
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isOpen}
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center">
              <span 
                className={`block h-0.5 w-6 bg-white/90 transition-all duration-300 ease-out ${
                  isOpen ? 'rotate-45 translate-y-0.5' : '-translate-y-1'
                }`} 
              />
              <span 
                className={`block h-0.5 w-6 bg-white/90 transition-all duration-300 ease-out ${
                  isOpen ? 'opacity-0' : 'opacity-100'
                }`} 
              />
              <span 
                className={`block h-0.5 w-6 bg-white/90 transition-all duration-300 ease-out ${
                  isOpen ? '-rotate-45 -translate-y-0.5' : 'translate-y-1'
                }`} 
              />
            </div>
          </button>
        </div>

        <div 
          className={`lg:hidden absolute top-full left-4 right-4 mt-4 
            transition-all duration-300 ease-out transform-gpu ${
            isOpen 
              ? 'opacity-100 translate-y-0 pointer-events-auto' 
              : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
        >
          <div className="rounded-2xl border border-white/10 
              bg-gradient-to-br from-white/20 to-white/5 
              backdrop-blur-xl shadow-2xl p-6">
            <nav aria-label="Mobile Navigation">
              <ul className="flex flex-col gap-4 justify-center items-center">
                {navLinks.map(({ name, href }, idx) => (
                   <li key={idx}>
                    <Link
                      href={href}
                      onClick={handleMobileLinkClick}
                      className="relative text-lg font-medium text-bg-lavender hover:text-white 
                        transition-all duration-300 ease-out text-center py-2 px-4 rounded-lg hover:bg-white/10"
                    >
                      {name}
                    </Link>
                   </li> 
                ))}
              </ul>
            </nav>
            <ul className="flex justify-center gap-4 mt-8 pt-6 border-t border-white-700/20 dark:border-white-700/50">
              {socialLinks.map((social, idx) => (
                <li key={`mobile-social-${idx}`}>
                  <Link
                    href={social.href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-0 mt-4 rounded-xl bg-gray-100/50 dark:bg-white/10 hover:bg-gray-200/50 dark:hover:bg-white/20 transition-all duration-200"
                    aria-label={`Visit ${social.name} profile`}
                  >
                    <Image 
                      src={social.icon} 
                      alt={`${social.name} icon`} 
                      width={20} 
                      height={20}
                      className="filter brightness-0 opacity-70 dark:brightness-0 dark:invert dark:opacity-80"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 -z-10 bg-black/20 backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
}
