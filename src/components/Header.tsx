'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
// Cross-page links use plain next/link with an explicit locale prefix: this
// static export has no i18n middleware, so a prefix-less URL would 404.
import NextLink from 'next/link';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { goTo, initHashNavigation, navClick } from '@/lib/scrollNav';

export default function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  // Pending "close the menu, then travel" timer, cleared if we unmount first
  // (switching locale replaces the route and remounts the whole tree).
  const pendingScrollRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Read the theme the inline script in layout.tsx already applied. The read
    // happens in a frame callback rather than in the effect body, so hydration
    // stays consistent and no cascading render is queued synchronously.
    const frame = requestAnimationFrame(() => {
      const stored = localStorage.getItem('theme') as 'dark' | 'light' | null;
      if (stored) {
        setTheme(stored);
        return;
      }
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // The menu collapses over 300ms and it sits in the flow, so every offset
  // below it moves: wait for the collapse before resolving the target.
  const closeMenuAndGo = (id: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    setIsMobileMenuOpen(false);
    window.clearTimeout(pendingScrollRef.current);
    pendingScrollRef.current = window.setTimeout(() => goTo(id), 320);
  };

  useEffect(() => () => window.clearTimeout(pendingScrollRef.current), []);

  const toggleLocale = () => {
    const newLocale = locale === 'es' ? 'en' : 'es';
    router.replace(pathname, { locale: newLocale });
  };

  // Deep link on arrival: travel to the section (playing its reveal). The
  // guard is per-mount, not per page load, so a client-side return from
  // /platform to /#demo still travels - React 18 StrictMode's double effect
  // is what the ref absorbs.
  const hashDone = useRef(false);
  useEffect(() => {
    if (hashDone.current) return;
    hashDone.current = true;
    initHashNavigation();
  }, []);

  // ids are resolved by scrollNav: under 768px it picks the `-mobile` twin
  const navLinks = [
    { id: 'features', label: t('nav.features') },
    { id: 'how', label: t('nav.how') },
    { id: 'security', label: t('nav.security') },
    { id: 'pricing', label: t('nav.pricing') },
    { id: 'faq', label: t('nav.faq') },
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
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={navClick(l.id)}
              className="text-sm text-white/75 transition hover:text-white"
            >
              {l.label}
            </a>
          ))}
          {/* Detail page: a real navigation, so it never goes through goTo */}
          <NextLink
            href={`/${locale}/platform/`}
            className="text-sm text-white/75 transition hover:text-white"
          >
            {t('nav.platform')}
          </NextLink>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/15 bg-white/5 transition hover:bg-white/10"
            aria-label={t('nav.toggleTheme')}
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
            aria-label={t('nav.toggleLanguage')}
          >
            <span className={`fi fi-${locale === 'es' ? 'gb' : 'es'} text-lg rounded-sm`} />
          </button>
          <a
            href="#pricing"
            onClick={navClick('pricing')}
            className="rounded-2xl border border-white/15 px-4 py-2 text-sm text-white/85 transition hover:bg-white/10"
          >
            {t('nav.viewPricing')}
          </a>
          <a
            href="#demo"
            onClick={navClick('demo')}
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
            aria-label={t('nav.menu')}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
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
            aria-label={t('nav.toggleTheme')}
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
          aria-label={t('nav.toggleLanguage')}
        >
          <span className={`fi fi-${locale === 'es' ? 'gb' : 'es'} text-lg rounded-sm`} />
        </button>
      </div>

      {/* Mobile Menu - `inert` while collapsed, so the links it hides with
          max-height:0 leave the tab order and the accessibility tree too
          (otherwise focus disappears into a clipped, off-screen menu). */}
      <div
        id="mobile-menu"
        inert={!isMobileMenuOpen}
        className={`overflow-hidden transition-all duration-300 md:hidden ${isMobileMenuOpen ? 'max-h-[480px]' : 'max-h-0'}`}
      >
        <div className="border-t border-white/10 px-4 pb-4 pt-3">
          <nav className="flex flex-col gap-1">
            {navLinks.map((l) => (
              <a
                key={l.id}
                href={`#${l.id}`}
                className="rounded-xl px-4 py-3 text-left text-sm text-white/70 transition-all hover:bg-white/5 hover:text-white"
                onClick={closeMenuAndGo(l.id)}
              >
                {l.label}
              </a>
            ))}
            <NextLink
              href={`/${locale}/platform/`}
              className="rounded-xl px-4 py-3 text-left text-sm text-white/70 transition-all hover:bg-white/5 hover:text-white"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {t('nav.platform')}
            </NextLink>
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            <a
              href="#pricing"
              className="rounded-xl border border-white/15 px-4 py-3 text-center text-sm text-white/85 transition hover:bg-white/10"
              onClick={closeMenuAndGo('pricing')}
            >
              {t('nav.viewPricing')}
            </a>
            <a
              href="#demo"
              className="header-cta rounded-xl bg-brand-600 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-brand-700"
              onClick={closeMenuAndGo('demo')}
            >
              {t('nav.requestDemo')}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
