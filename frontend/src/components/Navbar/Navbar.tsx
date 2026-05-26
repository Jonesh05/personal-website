"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "@/i18n";
import { useTheme } from "@/components/providers/ThemeProvider";
import {
  House,
  Buildings,
  Suitcase,
  Article,
  EnvelopeSimple,
  Globe,
  Moon,
  Sun,
} from "@phosphor-icons/react";

/* Types */
type NavKey = "home" | "projects" | "timeline" | "blog" | "contact";
interface NavLinkItem { key: NavKey; name: string; href: string; }
interface SocialLinkItem { name: string; href: string; iconPath: string; }

/* Icon map */
const NAV_ICONS: Record<NavKey, React.ComponentType<any>> = {
  home: House,
  projects: Buildings,
  timeline: Suitcase,
  blog: Article,
  contact: EnvelopeSimple,
};

const IconBtn: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }
> = ({ label, children, className = "", ...rest }) => (
  <button
    {...rest}
    aria-label={label}
    title={label}
    className={`icon-btn ${className}`}
  >
    {children}
  </button>
);

/* Hook para detectar scroll */
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

/* Navbar Component */
const Navbar: React.FC = () => {
  const t              = useTranslations('Navbar');
  const { locale, toggleLocale } = useLocale();
  const { theme, toggleTheme }   = useTheme();
  const scrollDirection          = useScrollDirection();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && mobileOpen) setMobileOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileOpen]);

  const navLinks: NavLinkItem[] = [
    { key: 'home',     name: t('Home'),     href: '/'          },
    { key: 'projects', name: t('Projects'), href: '/#projects'  },
    { key: 'timeline', name: t('Timeline'), href: '/#timeline'  },
    { key: 'blog',     name: t('Blog'),     href: '/blog'      },
    { key: 'contact',  name: t('Contact'),  href: '/#contact'   },
  ];

  const socialLinks: SocialLinkItem[] = [
    { name: 'GitHub',   href: 'https://github.com/jonesh05',             iconPath: '/icons/github.svg'   },
    { name: 'LinkedIn', href: 'https://linkedin.com/in/jhonny-pimiento', iconPath: '/icons/linkedin.svg' },
  ];

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
          
          <div className="shrink-0 w-[260px] h-[50px] flex items-center">
            <Link href="/" aria-label="Jonesh Logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo.svg"
                alt="Jonesh Logo"
                width={260}
                height={50}
                className="cursor-pointer object-contain w-full h-full
                  drop-shadow-md transition-all duration-300
                  hover:scale-105"
              />
            </Link>
          </div>

          {/* Desktop navigation */}
          <ul className="hidden lg:flex items-center gap-8">
            {navLinks.map(({ name, href }, idx) => (
              <li key={idx}>
                <Link href={href} className="relative text-lg font-medium text-slate-900 dark:text-bg-lavender hover:text-slate-700 dark:hover:text-white transition-all duration-300 ease-out">
                  {name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop controls */}
          <div className="hidden lg:flex items-center gap-4">
            {socialLinks.map((s) => (
              <Link key={s.name} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${s.name}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.iconPath}
                  alt={`${s.name} icon`}
                  width={20}
                  height={20}
                  className="dark:invert-0 invert opacity-80 hover:opacity-100 transition-all duration-300"
                />
              </Link>
            ))}
            <IconBtn
              label={`Switch language (current: ${locale})`}
              onClick={toggleLocale}
              className="flex items-center gap-1.5"
            >
              <span
                className="text-slate-900 dark:text-white transition-colors"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {locale}
              </span>
            </IconBtn>
            <IconBtn label={`Toggle theme (current: ${theme})`} onClick={toggleTheme} className="text-slate-900 dark:text-white transition-colors">
              {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
            </IconBtn>
          </div>

          {/* Mobile controls */}
          <div className="lg:hidden flex items-center gap-3">
                          
          <IconBtn
            label={`Switch language (current: ${locale})`}
            onClick={toggleLocale}
            className="flex items-center gap-1 text-slate-900 dark:text-white transition-colors"
          >
            <span
              className="text-slate-900 dark:text-white"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {locale}
            </span>
          </IconBtn>
            
          <IconBtn
            label="Toggle theme"
            onClick={toggleTheme}
            className="text-slate-900 dark:text-white transition-colors"
          >
            {theme === "dark"
              ? <Moon size={16} />
              : <Sun size={16} />
            }
          </IconBtn>
          
          <button
            onClick={() => setMobileOpen((s) => !s)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
          >
            <span
              className={`block h-0.5 w-6 bg-slate-900 dark:bg-white/90 transition-all duration-300 ${
                mobileOpen ? 'rotate-45 translate-y-1.5' : '-translate-y-1'
              }`}
            />
          
            <span
              className={`block h-0.5 w-6 bg-slate-900 dark:bg-white/90 transition-all duration-300 ${
                mobileOpen ? 'opacity-0' : 'opacity-100'
              }`}
            />
          
            <span
              className={`block h-0.5 w-6 bg-slate-900 dark:bg-white/90 transition-all duration-300 ${
                mobileOpen ? '-rotate-45 -translate-y-1.5' : 'translate-y-1'
              }`}
            />
          </button>
          
          </div>
        </div>

        {/* Mobile menu */}
        <div 
          className={`lg:hidden absolute top-full left-4 right-4 mt-4 
            transition-all duration-300 ease-out transform-gpu ${
            mobileOpen 
              ? 'opacity-100 translate-y-0 pointer-events-auto' 
              : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}>
          <div className="rounded-2xl border border-white/10 
            bg-white/5 backdrop-blur-xl shadow-2xl p-6">
            <ul className="flex flex-col gap-4 justify-center items-center">
              {navLinks.map(({ name, href }, idx) => (
                <li key={idx}>
                  <Link href={href} onClick={() => setMobileOpen(false)} className="text-center py-2 px-4 rounded-lg hover:bg-white/10">
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="flex justify-center gap-4 mt-8 pt-6 border-t border-white/20">
              {socialLinks.map((s) => (
                <li key={`mobile-${s.name}`}>
                  <Link href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${s.name}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={s.iconPath}
                      alt={`${s.name} icon`}
                      width={20}
                      height={20}
                      className="bg-black/80 dark:bg-white/10 rounded-full transition-colors"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 -z-10 bg-black/20 backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
};

export default Navbar;