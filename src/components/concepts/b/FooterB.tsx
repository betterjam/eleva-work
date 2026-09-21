'use client';

import Image from 'next/image';
import { useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { gsap } from '@/components/concepts/shared/gsapSetup';
import { useSmoothScroll } from '@/components/concepts/shared/SmoothScroll';
import { EASE, MQ, drawRule, useMotion, type MotionKit } from './motion';

type NavItem = { id: string; num: string; label: string };

/** Colophon-free footer: a 2px ink rule draws, four columns settle in. */
export default function FooterB() {
  const t = useTranslations('conceptB');
  const { scrollTo } = useSmoothScroll();
  const nav = t.raw('header.nav') as NavItem[];
  const root = useRef<HTMLElement>(null);
  const ruleRef = useRef<HTMLSpanElement>(null);

  const build = useCallback((kit: MotionKit) => {
    const { mm, q, root: el } = kit;
    mm.add(MQ.motion, () => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
      if (ruleRef.current) tl.add(drawRule(ruleRef.current, { duration: 0.9 }), 0);
      // Each column's first line slips out of its mask once the rule has drawn; the rest fades in beneath.
      const heads = q('.b-footer-col .b-mask > *');
      const rest = q('.b-footer-col .r-fade');
      if (heads.length) tl.fromTo(heads, { yPercent: 100, opacity: 1 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, stagger: 0.08, ease: EASE.reveal }, 0.35);
      if (rest.length) tl.fromTo(rest, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, stagger: 0.04, ease: EASE.settle }, 0.6);
    });
  }, []);

  useMotion(root, build);

  return (
    <footer id="footer" ref={root} className="b-footer" style={{ marginTop: 'var(--b-chapter-gap)' }}>
      <div className="b-container">
        <span ref={ruleRef} className="b-rule-heavy r-rule" aria-hidden="true" />
        <div className="b-footer-grid">
          <div className="b-footer-col">
            <span className="b-mask">
              <Image src="/images/eleva-logo-blue.png" alt={t('footer.logoAlt')} width={96} height={28} unoptimized className="b-footer-logo r-text" />
            </span>
            <p className="b-small r-fade" style={{ marginTop: 16, display: 'block' }}>
              {t('footer.identity')}
            </p>
            <p className="b-small r-fade" style={{ marginTop: 8, display: 'block' }}>
              {t('footer.description')}
            </p>
          </div>
          <div className="b-footer-col">
            <span className="b-mask">
              <p className="b-label r-text" style={{ margin: 0 }}>
                {t('footer.chaptersLabel')}
              </p>
            </span>
            <ul className="b-footer-links r-fade" style={{ marginTop: 12 }}>
              {nav.map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => scrollTo(`#${n.id}`, 80)}>
                    <span className="b-folio" style={{ marginRight: 8 }}>
                      {n.num}
                    </span>
                    {n.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="b-footer-col">
            <span className="b-mask">
              <p className="b-label r-text" style={{ margin: 0 }}>
                {t('footer.legalLabel')}
              </p>
            </span>
            <ul className="b-footer-links r-fade" style={{ marginTop: 12 }}>
              <li>
                <Link href="/privacy">{t('footer.links.privacy')}</Link>
              </li>
              <li>
                <Link href="/terms">{t('footer.links.terms')}</Link>
              </li>
            </ul>
          </div>
          <div className="b-footer-col">
            <span className="b-mask">
              <p className="b-label r-text" style={{ margin: 0 }}>
                {t('footer.supportedBy')}
              </p>
            </span>
            {/* Remote partner logo: plain <img> so a missing asset degrades silently. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="b-startupchile r-fade"
              src="https://startupchile.org/content/uploads/startupchileblanco185px.png"
              alt={t('footer.startupChileAlt')}
              width={185}
              height={40}
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <p className="b-folio r-fade" style={{ marginTop: 16 }}>
              {t('footer.copyright')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
