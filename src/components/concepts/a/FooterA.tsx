'use client';

import { useRef } from 'react';
import Image from 'next/image';
import NextLink from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useReveal } from './useReveal';
import { useScrollTo } from './scrollTo';

type FooterLink = { id: string; label: string };

const WHATSAPP = '56979591791';

/**
 * Colophon: logo + description, the landing link + the §01…§07 product anchors, legal
 * links, contact, "Apoyado por…". No year, no Date. "Inicio" is a real cross-page link
 * with an explicit locale prefix (no i18n middleware in this static export); the section
 * links scroll inside the page.
 * `data-section="footer"` lets the Section Director give it a window that settles at 80 %
 * (it can never reach the 48 % line); it is not tracked by the header counter.
 */
export default function FooterA() {
  const t = useTranslations('conceptA');
  const locale = useLocale();
  const ref = useRef<HTMLElement>(null);
  const scrollTo = useScrollTo();
  useReveal(ref, { start: 'top 90%' });

  const links = t.raw('footer.product.links') as FooterLink[];

  return (
    <footer ref={ref} className="a-footer" data-section="footer">
      <div className="a-container" data-rv-group data-rv-start="top 90%">
        <span className="a-footer-rule rv-rule-x" aria-hidden="true" />
        <div className="a-cols a-footer-grid">
          <div className="col-span-4 md:col-span-4 rv-mask">
            <div className="a-footer-col a-mask-inner">
              <Image src="/brand/logo/eleva-360-compact-color.svg" alt="eleva 360°" width={1303} height={370} className="logo-light h-7 w-auto" />
              <Image src="/brand/logo/eleva-360-compact-reverse.svg" alt="" width={1303} height={370} className="logo-dark h-7 w-auto" />
              <p className="a-body-sm">{t('footer.description')}</p>
            </div>
          </div>
          <div className="col-span-2 md:col-start-5 md:col-span-3 rv-mask">
            <div className="a-footer-col a-mask-inner">
              <span className="a-label">{t('footer.product.label')}</span>
              <NextLink href={`/${locale}/`} className="a-footer-link">
                {t('footer.home')}
              </NextLink>
              {links.map((l) => (
                <button key={l.id} type="button" className="a-footer-link" onClick={() => scrollTo(`#${l.id}`, 72)}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <div className="col-span-2 md:col-start-8 md:col-span-2 rv-mask">
            <div className="a-footer-col a-mask-inner">
              <span className="a-label">{t('footer.legal.label')}</span>
              <Link href="/privacy" className="a-footer-link">
                {t('footer.legal.privacy')}
              </Link>
              <Link href="/terms" className="a-footer-link">
                {t('footer.legal.terms')}
              </Link>
            </div>
          </div>
          <div className="col-span-4 md:col-start-10 md:col-span-3 rv-mask">
            <div className="a-footer-col a-mask-inner">
              <span className="a-label">{t('footer.contact.label')}</span>
              <a className="a-footer-link" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer">
                {t('footer.contact.whatsapp')}
              </a>
              <span className="a-body-sm">{t('footer.contact.supportedBy')}</span>
              <span className="a-dark-plate">
                {/* Remote host is not configured for next/image on the static export. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://startupchile.org/content/uploads/startupchileblanco185px.png"
                  alt={t('footer.contact.startupChileAlt')}
                  height={24}
                  decoding="async"
                />
              </span>
            </div>
          </div>
        </div>
        <div className="a-footer-bottom">
          <span className="a-code">{t('footer.copyright')}</span>
          <button type="button" className="a-footer-link" onClick={() => scrollTo('#intro', 0)}>
            {t('footer.backToTop')}
          </button>
        </div>
      </div>
    </footer>
  );
}
