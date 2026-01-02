'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';

export default function Footer() {
  const t = useTranslations();

  const fundedText = t.raw('footer.funded') || 'Funded by';

  return (
    <footer className="border-t border-white/10 bg-[#070A12]">
      <div className="mx-auto max-w-6xl px-5 py-10">
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
              className="h-8 w-auto"
              unoptimized
            />
          </a>
        </div>

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/images/eleva-logo-blue.png"
              alt="Eleva"
              width={80}
              height={26}
              className="h-6 w-auto opacity-70"
            />
            <span className="text-sm text-white/50">
              &copy; {new Date().getFullYear()} &bull; {t('footer.line')}
            </span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-white/60">
            <a className="transition hover:text-white" href="#security">{t('footer.security')}</a>
            <a className="transition hover:text-white" href="#faq">{t('footer.faq')}</a>
            <a className="transition hover:text-white" href="#demo">{t('footer.contact')}</a>
            <span className="text-white/20">|</span>
            <Link className="transition hover:text-white" href="/privacy">{t('legal.privacy')}</Link>
            <Link className="transition hover:text-white" href="/terms">{t('legal.terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
