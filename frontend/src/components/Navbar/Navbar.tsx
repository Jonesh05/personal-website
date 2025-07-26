"use client"

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import Logo from '@/assets/logotest.svg'
import { useTranslations } from '@/i18n/utils'

// Types
interface NavLinkItem {
  name: string;
  href: string;
}

interface SocialLinkItem {
  name: string;
  href: string;
  icon: string;
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

interface SocialLinkProps {
  href: string;
  icon: string;
  name: string;
}

interface MenuToggleProps {
  isOpen: boolean;
  onClick: () => void;
}

interface MobileMenuProps {
  isOpen: boolean;
  navLinks: NavLinkItem[];
  socialLinks: SocialLinkItem[];
  onLinkClick: () => void;
}

// Hook para detectar scroll y mejorar UX
const useScrollDirection = () => {
  const [scrollDirection, setScrollDirection] = useState<string | null>(null)
  const [lastScrollY, setLastScrollY] = useState<number>(0)

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset
      const direction = scrollY > lastScrollY ? "down" : "up"
      if (direction !== scrollDirection && (scrollY - lastScrollY > 10 || scrollY - lastScrollY < -10)) {
        setScrollDirection(direction)
      }
      setLastScrollY(scrollY > 0 ? scrollY : 0)
    }
    window.addEventListener("scroll", updateScrollDirection)
    return () => window.removeEventListener("scroll", updateScrollDirection)
  }, [scrollDirection, lastScrollY])

  return scrollDirection
}

// Componente para los enlaces de navegación
const NavLink: React.FC<NavLinkProps> = ({ href, children, onClick, className = "" }) => (
  <Link
    href={href}
    onClick={onClick}
    className={`relative text-lg font-medium text-bg-lavender hover:text-white 
      transition-all duration-300 ease-out
        after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-0 
      after:bg-linear-to-r after:from-primary-400 after:to-primary-600 
      after:transition-all after:duration-300 after:ease-out
      hover:after:left-0 hover:after:w-full
      active:scale-95 ${className}`}
  >
    {children}
  </Link>
)

// Componente para enlaces sociales
const SocialLink: React.FC<SocialLinkProps> = ({ href, icon, name }) => (
  <Link 
    href={href} 
    target="_blank" 
    rel="noopener noreferrer"
    className="group relative p-0 mt-4 rounded-full transition-all duration-300 
      hover:bg-white/10 hover:scale-110 active:scale-95"
    aria-label={name}
  >
    <Image 
      src={icon} 
      alt={name} 
      width={20} 
      height={20} 
      className="transition-all duration-300 filter brightness-90 contrast-100 
        group-hover:brightness-110 group-hover:drop-shadow-xs"
    />
  </Link>
)

// Componente para el botón del menú móvil
const MenuToggle: React.FC<MenuToggleProps> = ({ isOpen, onClick }) => (
  <button
    onClick={onClick}
    className="lg:hidden relative p-2.5 rounded-full transition-all duration-300 
      hover:bg-white/10 active:scale-95 focus:outline-hidden focus:ring-2 
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
)

// Componente del menú móvil
const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, navLinks, socialLinks, onLinkClick }) => (
  <div 
    className={`lg:hidden absolute top-full left-4 right-4 mt-4 
      transition-all duration-300 ease-out transform-gpu ${
      isOpen 
        ? 'opacity-100 translate-y-0 pointer-events-auto' 
        : 'opacity-0 -translate-y-4 pointer-events-none'
    }`}
  >
    <div className="rounded-2xl border border-white/10 
        bg-linear-to-br from-white/20 to-white/5 
        backdrop-blur-xl shadow-2xl p-6">
      <nav aria-label="Mobile Navigation">
        <ul className="flex flex-col gap-4 justify-center items-center">
          {navLinks.map(({ name, href }, idx) => (
             <li key={idx}>
              <NavLink
                href={href}
                onClick={onLinkClick}
                className="text-center py-2 px-4 rounded-lg hover:bg-white/10"
              >
                {name}
              </NavLink>
             </li> 
          ))}
        </ul>
      </nav>
      {/* Mobile Social Links */}
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
)

/**
 * Componente de la barra de navegación optimizado
 * Implementa patrones de diseño modulares y UX mejorada
 */
const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const scrollDirection = useScrollDirection()
  const t = useTranslations('en')

  // Configuración de navegación
  const navLinks: NavLinkItem[] = [
    { name: t('Home'), href: '/' },
    { name: t('Projects'), href: '/projects' },
    { name: t('Timeline'), href: '/timeline' },
    { name: t('Blog'), href: '/blog' },
    { name: t('Contact'), href: '/contact' },
  ]

  const socialLinks: SocialLinkItem[] = [
    {
      name: 'GitHub',
      href: 'https://github.com/jonesh05',
      icon: '/icons/github.svg',
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/in/jhonny-pimiento',
      icon: '/icons/linkedin.svg',
    },
  ]

  // Cerrar menú móvil al hacer clic en un enlace
  const handleMobileLinkClick = (): void => {
    setIsOpen(false)
  }

  // Cerrar menú móvil con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  return (
    <header className={`fixed inset-x-0 top-0 z-50 max-w-7xl mx-auto px-4 
      font-manrope transition-transform duration-300 ${
      scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"
    }`}>
      <nav className="mt-6 relative">
        {/* Navbar principal */}
        <div className="flex items-center justify-between gap-6 
          rounded-full border border-white/10 
          backdrop-blur-xl shadow-2xl px-8 py-4 
          transition-all duration-300 ease-in-out
          hover:shadow-3xl hover:border-white/20">
          
          {/* Logo */}
          <div className="shrink-0 w-[150px] h-[50px] flex items-center">
            <Link href="/" aria-label="Jonesh Logo">
              <Logo className="cursor-pointer object-contain w-full h-full 
                drop-shadow-md transition-all duration-300 
                brightness-100 dark:brightness-150 contrast-100 
                text-black dark:text-white hover:scale-105" />
            </Link>
          </div>

          {/* Navegación desktop */}
          <ul className="hidden lg:flex items-center gap-8">
            {navLinks.map(({ name, href }, idx) => (
              <li key={idx}>
                <NavLink href={href}>
                  {name}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Enlaces sociales desktop */}
          <ul className="hidden lg:flex items-center gap-2">
            {socialLinks.map(({ name, href, icon }, idx) => (
              <li key={idx}>
                <SocialLink href={href} icon={icon} name={name} />
              </li>
            ))}
          </ul>

          {/* Toggle menú móvil */}
          <MenuToggle isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
        </div>

        {/* Menú móvil */}
        <MobileMenu 
          isOpen={isOpen} 
          navLinks={navLinks} 
          socialLinks={socialLinks}
          onLinkClick={handleMobileLinkClick} 
        />
      </nav>

      {/* Overlay para cerrar menú móvil */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 -z-10 bg-black/20 backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  )
}

export default Navbar