'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import NextLink from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { trialUrl } from '@/lib/trial';

type Props = {
  /** Where the language switch lands: the same article in the other language when it exists, else that language's blog. */
  otherLocaleHref: string;
};

/**
 * The bar of the blog's pages: the site's own (logo, sections, theme, language, demo) without the home page's
 * scroll choreography. It belongs to the navy masthead, so it is navy in both themes (globals.css, .blog-header).
 */
export default function BlogHeader({ otherLocaleHref }: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    // The inline script in the root layout already applied the theme; read it after the first paint.
    const frame = requestAnimationFrame(() => {
      setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <header className="blog-header">
      <div className="blog-header__in">
        <NextLink href={`/${locale}/`} className="blog-header__logo" aria-label="eleva 360°">
          <Image src="/brand/logo/eleva-360-horizontal-reverse.svg" alt="eleva 360°" width={1303} height={370} />
        </NextLink>

        <nav className="blog-header__nav">
          <NextLink href={`/${locale}/`}>{t('blog.home')}</NextLink>
          <NextLink href={`/${locale}/blog/`} aria-current="page">{t('nav.blog')}</NextLink>
        </nav>

        <div className="blog-header__side">
          <button type="button" onClick={toggleTheme} aria-label={t('nav.toggleTheme')} className="blog-header__ghost">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <NextLink href={otherLocaleHref} aria-label={t('nav.toggleLanguage')} className="blog-header__ghost">
            {locale === 'es' ? 'EN' : 'ES'}
          </NextLink>
          <a href={trialUrl(locale)} className="blog-cta">
            {t('nav.requestDemo')}
          </a>
        </div>
      </div>
    </header>
  );
}
