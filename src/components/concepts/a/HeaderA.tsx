'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { gsap, ScrollTrigger, ScrollSmoother } from '@/components/concepts/shared/gsapSetup';
import { useLocaleSwitch, useTheme } from '@/components/concepts/shared/hooks';
import { SECTION_CODES, useActiveSection } from './ActiveSection';
import { useScrollTo } from './scrollTo';

type NavItem = { id: string; num: string; label: string };

/**
 * Fixed 56px header (outside <SmoothScroll>): logo, §NN section counter (≥1440),
 * nav (§01…§07), theme + locale switches, an "Inicio" link and the demo CTA, hairline
 * rule and the 2px reading-progress rule. Logo, "Inicio" and CTA are real cross-page
 * links to the landing (`/<locale>/`, `/<locale>/#demo`) with an explicit locale prefix:
 * this static export has no i18n middleware, so a prefix-less URL would 404.
 * Under 1280px: burger + full-screen sheet (`.a-menu`, z 59) that pauses the smoother,
 * makes everything outside it inert and moves focus in (and back to the burger on close).
 */
export default function HeaderA() {
  const t = useTranslations('conceptA');
  const nav = t.raw('header.nav') as NavItem[];
  const { active } = useActiveSection();
  const { theme, toggle: toggleTheme, mounted } = useTheme();
  const { locale, toggle: toggleLocale } = useLocaleSwitch();
  const scrollTo = useScrollTo();

  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const codeRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const menuTl = useRef<ReturnType<typeof gsap.timeline> | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // The counter line is rendered once (initial section) and then driven imperatively by the flip.
  const [initialSection] = useState(active);

  // SSR renders the dark state; `mounted` only decides which switch cell is on.
  const currentTheme = mounted ? theme : 'dark';

  /* Mount choreography, reading progress, scrolled state. Runs in a passive effect so the
     ScrollSmoother (created in SmoothScroll's layout effect) already owns the scroller proxy. */
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      const rule = header.querySelector('.a-hdr-rule');
      const links = header.querySelectorAll('.a-nav-link');
      const cta = header.querySelector('.a-hdr-cta');
      const progress = header.querySelector('.a-progress');

      if (reduce) {
        gsap.set(rule, { scaleX: 1 });
        gsap.set(links, { clipPath: 'none' });
        gsap.set(cta, { autoAlpha: 1 });
      } else {
        gsap.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'reveal' });
        gsap.fromTo(
          links,
          { clipPath: 'inset(0% 0% 0% 100%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 0.5,
            stagger: 0.05,
            ease: 'reveal',
            delay: 0.3,
            // A residual clip-path would clip the focus ring; drop it once the wipe is done.
            onComplete: () => {
              gsap.set(links, { clipPath: 'none' });
            },
          }
        );
        gsap.fromTo(
          cta,
          { autoAlpha: 0, scale: 0.96 },
          { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'settle', delay: 0.7 }
        );
      }

      // `end: 'max'` is re-evaluated after pins are applied on refresh, so the pinned
      // System sheet's 260vh spacer is included (a 'bottom …' end would be measured without it).
      const content = document.querySelector('#smooth-content');
      if (content && progress) {
        gsap.to(progress, {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { trigger: content, start: 'top top', end: 'max', scrub: 0.3 },
        });
        // Not toggleClass: with `end: 'max'` the trigger "leaves" at the very bottom of the
        // page and would strip the class, leaving the header transparent over the footer.
        ScrollTrigger.create({
          trigger: content,
          start: 'top -64px',
          end: 'max',
          onEnter: () => header.classList.add('is-scrolled'),
          onLeaveBack: () => header.classList.remove('is-scrolled'),
        });
      }
    }, header);

    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, []);

  /* Section counter: masked line flip (old line up and out, text swap, new line up and in). */
  useEffect(() => {
    const line = lineRef.current;
    const code = codeRef.current;
    const name = nameRef.current;
    if (!line || !code || !name) return;
    const nextCode = `${t('common.section')}${SECTION_CODES[active] ?? '00'}`;
    const nextName = t(`header.counter.${active}`);
    if (code.textContent === nextCode && name.textContent === nextName) return;
    const swap = () => {
      code.textContent = nextCode;
      name.textContent = nextName;
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      swap();
      return;
    }
    const tl = gsap.timeline();
    tl.to(line, { yPercent: -100, duration: 0.25, ease: 'snap' })
      .call(swap)
      .fromTo(line, { yPercent: 100 }, { yPercent: 0, duration: 0.35, ease: 'snap' });
    return () => {
      tl.kill();
    };
  }, [active, t]);

  /* Mobile sheet: clip wipe down + masked rows; pauses the smoother while open. Everything
     outside the header + sheet (the scrolling page, fixed chrome, skip link) is made inert,
     focus moves to the first row, and returns to the burger on close. */
  useEffect(() => {
    const sheet = menuRef.current;
    if (!sheet) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const smoother = ScrollSmoother.get();
    const outside = Array.from(document.querySelectorAll<HTMLElement>('#smooth-wrapper, [data-a-chrome]'));
    const masks = Array.from(sheet.querySelectorAll<HTMLElement>('.rv-mask'));
    menuTl.current?.kill();

    if (menuOpen) {
      smoother?.paused(true);
      sheet.setAttribute('data-open', 'true');
      outside.forEach((el) => el.setAttribute('inert', ''));
      masks.forEach((m) => m.classList.remove('is-revealed'));
      const rows = sheet.querySelectorAll('.rv-mask > *');
      const tl = gsap.timeline({ onComplete: () => masks.forEach((m) => m.classList.add('is-revealed')) });
      tl.fromTo(
        sheet,
        { clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', duration: reduce ? 0 : 0.5, ease: 'reveal' }
      ).fromTo(
        rows,
        { y: 0, yPercent: 110 },
        { yPercent: 0, duration: reduce ? 0 : 0.5, stagger: reduce ? 0 : 0.06, ease: 'reveal' },
        reduce ? 0 : '-=0.25'
      );
      menuTl.current = tl;
      sheet.querySelector<HTMLElement>('.a-menu-row')?.focus({ preventScroll: true });

      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMenuOpen(false);
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }

    smoother?.paused(false);
    outside.forEach((el) => el.removeAttribute('inert'));
    if (sheet.getAttribute('data-open') !== 'true') return;
    masks.forEach((m) => m.classList.remove('is-revealed'));
    const tl = gsap.timeline({ onComplete: () => sheet.setAttribute('data-open', 'false') });
    tl.to(sheet, { clipPath: 'inset(0 0 100% 0)', duration: reduce ? 0 : 0.35, ease: 'snap' });
    menuTl.current = tl;
    if (sheet.contains(document.activeElement) || document.activeElement === document.body) {
      burgerRef.current?.focus({ preventScroll: true });
    }
  }, [menuOpen]);

  useEffect(
    () => () => {
      menuTl.current?.kill();
      ScrollSmoother.get()?.paused(false);
      document.querySelectorAll('#smooth-wrapper, [data-a-chrome]').forEach((el) => el.removeAttribute('inert'));
    },
    []
  );

  const go = (id: string, offset: number) => {
    setMenuOpen(false);
    scrollTo(`#${id}`, offset);
  };

  const themeSwitch = (
    <div className="a-switch" role="group" aria-label={t('header.theme.label')}>
      <button
        type="button"
        className={currentTheme === 'dark' ? 'is-on' : undefined}
        aria-pressed={currentTheme === 'dark'}
        onClick={() => currentTheme !== 'dark' && toggleTheme()}
      >
        {t('header.theme.dark')}
      </button>
      <button
        type="button"
        className={currentTheme === 'light' ? 'is-on' : undefined}
        aria-pressed={currentTheme === 'light'}
        onClick={() => currentTheme !== 'light' && toggleTheme()}
      >
        {t('header.theme.light')}
      </button>
    </div>
  );

  const localeSwitch = (
    <div className="a-switch" role="group" aria-label={t('header.locale.label')}>
      <button
        type="button"
        className={locale === 'es' ? 'is-on' : undefined}
        aria-pressed={locale === 'es'}
        onClick={() => {
          if (locale === 'es') return;
          setMenuOpen(false);
          toggleLocale();
        }}
      >
        {t('header.locale.es')}
      </button>
      <button
        type="button"
        className={locale === 'en' ? 'is-on' : undefined}
        aria-pressed={locale === 'en'}
        onClick={() => {
          if (locale === 'en') return;
          setMenuOpen(false);
          toggleLocale();
        }}
      >
        {t('header.locale.en')}
      </button>
    </div>
  );

  return (
    <>
      <header ref={headerRef} className="a-header">
        <div className="a-container a-hdr-inner">
          <Link href={`/${locale}/`} className="a-hdr-logo" aria-label="eleva 360°" onClick={() => setMenuOpen(false)}>
            <Image src="/brand/logo/eleva-360-compact-color.svg" alt="eleva 360°" width={1303} height={370} className="logo-light h-7 w-auto" priority />
            <Image src="/brand/logo/eleva-360-compact-reverse.svg" alt="" width={1303} height={370} className="logo-dark h-7 w-auto" priority />
          </Link>

          {/* Decorative for AT: the nav's aria-current already carries the position. */}
          <div className="a-counter" aria-hidden="true">
            <span ref={lineRef} className="a-counter-line">
              <span ref={codeRef} className="a-counter-code">
                {`${t('common.section')}${SECTION_CODES[initialSection] ?? '00'}`}
              </span>
              <span ref={nameRef}>{t(`header.counter.${initialSection}`)}</span>
            </span>
          </div>

          <nav className="a-hdr-nav">
            {nav.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`a-nav-link${active === item.id ? ' is-active' : ''}`}
                aria-current={active === item.id ? 'true' : undefined}
                onClick={() => go(item.id, 72)}
              >
                <span className="a-nav-num">{item.num}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="a-hdr-right">
            <Link href={`/${locale}/`} className="a-hdr-home">
              {t('header.home')}
            </Link>
            {themeSwitch}
            {localeSwitch}
            <Link href={`/${locale}/#demo`} className="a-btn a-btn-primary a-btn-sm a-hdr-cta rv-fade">
              {t('header.cta')}
            </Link>
          </div>

          <button
            ref={burgerRef}
            type="button"
            className="a-burger a-hdr-burger"
            aria-expanded={menuOpen}
            aria-controls="a-menu"
            aria-label={menuOpen ? t('header.menuClose') : t('header.menuOpen')}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <i />
            <i />
          </button>
        </div>
        <span className="a-hdr-rule" aria-hidden="true" />
        <span className="a-progress" role="img" aria-label={t('header.progressLabel')} />
      </header>

      <div id="a-menu" ref={menuRef} className="a-menu" data-open="false" aria-hidden={!menuOpen}>
        <div className="a-menu-body">
          {nav.map((item) => (
            <button key={item.id} type="button" className="a-menu-row" onClick={() => go(item.id, 64)}>
              <span className="a-nav-num">{item.num}</span>
              <span className="rv-mask">
                <span>{item.label}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="a-menu-foot">
          <Link href={`/${locale}/`} className="a-hdr-home a-menu-home" onClick={() => setMenuOpen(false)}>
            {t('header.home')}
          </Link>
          {themeSwitch}
          {localeSwitch}
          <Link href={`/${locale}/#demo`} className="a-btn a-btn-primary" onClick={() => setMenuOpen(false)}>
            {t('header.cta')}
          </Link>
        </div>
      </div>
    </>
  );
}
