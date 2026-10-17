'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
// Cross-page link: plain next/link with an explicit locale prefix, since the
// static export has no i18n middleware and a prefix-less URL would 404.
import NextLink from 'next/link';
import Image from 'next/image';
import ScrollCue from '@/components/ScrollCue';
import { navClick } from '@/lib/scrollNav';

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();

  const fundedText = t.raw('footer.funded') || 'Funded by';

  return (
    <footer className="border-t border-white/10 bg-[#070A12]">
      {/* footer-inner: globals.css reserves room under the links and the
          "back to top" cue while the cookie banner is on screen (it is fixed to
          the bottom of a phone viewport and would otherwise cover both). */}
      <div className="footer-inner mx-auto max-w-6xl px-5 py-10">
        {/* Startup Chile Award Section */}
        <div className="mb-8 flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-5 sm:flex-row sm:gap-4">
          <span className="text-sm text-white/50">{fundedText}</span>
          <a
            href="https://startupchile.org"
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:opacity-80"
          >
            <Image
              src="https://startupchile.org/content/uploads/startupchileblanco185px.png"
              alt="Startup Chile"
              width={140}
              height={40}
              className="startup-chile-logo h-8 w-auto"
              unoptimized
            />
          </a>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/brand/logo/eleva-360-compact-color.svg"
              alt="eleva 360°"
              width={1303}
              height={370}
              className="logo-light h-7 w-auto"
            />
            <Image
              src="/brand/logo/eleva-360-compact-reverse.svg"
              alt=""
              width={1303}
              height={370}
              className="logo-dark h-7 w-auto"
            />
            <span className="text-sm text-white/50">
              &copy; {new Date().getFullYear()} &bull; {t('footer.line')}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-white/60">
            <NextLink className="transition hover:text-white" href={`/${locale}/platform/`}>{t('footer.platform')}</NextLink>
            <a className="transition hover:text-white" href="#security" onClick={navClick('security')}>{t('footer.security')}</a>
            <a className="transition hover:text-white" href="#faq" onClick={navClick('faq')}>{t('footer.faq')}</a>
            <a className="transition hover:text-white" href="#demo" onClick={navClick('demo')}>{t('footer.contact')}</a>
            <span className="text-white/20">|</span>
            <Link className="transition hover:text-white" href="/privacy">{t('legal.privacy')}</Link>
            <Link className="transition hover:text-white" href="/terms">{t('legal.terms')}</Link>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <ScrollCue targetId="hero" direction="up" label={t('cues.backToTop')} />
        </div>
      </div>
    </footer>
  );
}
