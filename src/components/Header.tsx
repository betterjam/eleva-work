'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Get theme from localStorage or system preference
    const stored = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (stored) {
      setTheme(stored);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const toggleLocale = () => {
    const newLocale = locale === 'es' ? 'en' : 'es';
    router.replace(pathname, { locale: newLocale });
  };

  const navLinks = [
    { label: t('nav.features'), href: '#features' },
    { label: t('nav.how'), href: '#how' },
    { label: t('nav.security'), href: '#security' },
    { label: t('nav.pricing'), href: '#pricing' },
    { label: t('nav.faq'), href: '#faq' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 border-b border-white/10 transition-all duration-300 ${
        isScrolled ? 'bg-black/20 backdrop-blur-xl' : 'bg-transparent backdrop-blur-sm'
      }`}
    >
      {/* Desktop Header */}
      <div className="mx-auto hidden max-w-6xl items-center justify-between px-5 py-4 md:flex">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/eleva-logo-blue.png"
            alt="Eleva"
            width={140}
            height={44}
            className="h-11 w-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="flex items-center gap-5">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-white/75 transition hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/15 bg-white/5 transition hover:bg-white/10"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg className="h-4 w-4 text-white/85" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-white/85" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <button
            onClick={toggleLocale}
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/15 bg-white/5 transition hover:bg-white/10"
            aria-label="Toggle language"
          >
            <span className={`fi fi-${locale === 'es' ? 'gb' : 'es'} text-lg rounded-sm`} />
          </button>
          <a
            href="#pricing"
            className="rounded-2xl border border-white/15 px-4 py-2 text-sm text-white/85 transition hover:bg-white/10"
          >
            {t('nav.viewPricing')}
          </a>
          <a
            href="#demo"
            className="header-cta rounded-2xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            {t('nav.requestDemo')}
          </a>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="flex items-center justify-between px-4 py-3 md:hidden">
        {/* Left: Menu + Theme */}
        <div className="flex items-center gap-2">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-white/10"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <svg className="h-5 w-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 transition hover:bg-white/10"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg className="h-4 w-4 text-white/85" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-white/85" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        {/* Center: Logo */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <Image
            src="/images/eleva-logo-blue.png"
            alt="Eleva"
            width={100}
            height={32}
            className="h-8 w-auto"
          />
        </Link>

        {/* Right: Language */}
        <button
          onClick={toggleLocale}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 transition hover:bg-white/10"
          aria-label="Toggle language"
        >
          <span className={`fi fi-${locale === 'es' ? 'gb' : 'es'} text-lg rounded-sm`} />
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`overflow-hidden transition-all duration-300 md:hidden ${isMobileMenuOpen ? 'max-h-[400px]' : 'max-h-0'}`}>
        <div className="border-t border-white/10 px-4 pb-4 pt-3">
          <nav className="flex flex-col gap-1">
            {navLinks.map((l) => (
              <button
                key={l.href}
                className="rounded-xl px-4 py-3 text-left text-sm text-white/70 transition-all hover:bg-white/5 hover:text-white"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  document.getElementById(l.href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {l.label}
              </button>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            <button
              className="rounded-xl border border-white/15 px-4 py-3 text-center text-sm text-white/85 transition hover:bg-white/10"
              onClick={() => {
                setIsMobileMenuOpen(false);
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {t('nav.viewPricing')}
            </button>
            <button
              className="header-cta rounded-xl bg-brand-600 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-brand-700"
              onClick={() => {
                setIsMobileMenuOpen(false);
                document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {t('nav.requestDemo')}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
