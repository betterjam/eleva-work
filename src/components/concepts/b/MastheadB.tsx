'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { gsap, ScrollTrigger } from '@/components/concepts/shared/gsapSetup';
import { useLocaleSwitch, useTheme } from '@/components/concepts/shared/hooks';
import { EASE, MQ, scrollToId, useFontsReady } from './motion';

type NavItem = { id: string; num: string; label: string };

/**
 * Fixed masthead (outside <SmoothScroll>): 2px accent progress rule, logo,
 * chapter nav, running head (masked vertical slip), theme / language toggles,
 * primary CTA, and the mobile index overlay.
 */
export default function MastheadB() {
  const t = useTranslations('conceptB');
  const nav = t.raw('header.nav') as NavItem[];
  const { theme, toggle: toggleTheme, mounted } = useTheme();
  const { other, toggle: toggleLocale } = useLocaleSwitch();
  const fontsReady = useFontsReady();

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  const headerRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const spanA = useRef<HTMLSpanElement>(null);
  const spanB = useRef<HTMLSpanElement>(null);
  const currentRef = useRef<0 | 1>(0);
  const labelRef = useRef<string>('');
  const reducedRef = useRef(false);
  const ctxRef = useRef<gsap.Context | null>(null);
  const defaultLabel = t('header.runningHeadDefault');

  /** Masked vertical slip of the running head. */
  const setLabel = useCallback((next: string) => {
    if (!next || next === labelRef.current) return;
    labelRef.current = next;
    const spans = [spanA.current, spanB.current];
    const cur = spans[currentRef.current];
    const inc = spans[1 - currentRef.current];
    if (!cur || !inc) return;
    if (reducedRef.current || !ctxRef.current) {
      cur.textContent = next;
      return;
    }
    inc.textContent = next;
    ctxRef.current.add(() => {
      gsap.killTweensOf([cur, inc]);
      // `y: 0` clears the pixel offset GSAP parses from the stylesheet's translateY(100%);
      // without it the incoming label keeps a 16px shift and both labels end up overlapping.
      gsap.to(cur, { y: 0, yPercent: -100, duration: 0.35, ease: EASE.snap });
      gsap.fromTo(inc, { y: 0, yPercent: 100 }, { y: 0, yPercent: 0, duration: 0.45, ease: EASE.reveal });
    });
    currentRef.current = currentRef.current === 0 ? 1 : 0;
  }, []);

  // Scroll-linked: progress rule, bar background, running head + active chapter.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    labelRef.current = defaultLabel;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        if (progressRef.current) {
          gsap.to(progressRef.current, {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: { trigger: '#smooth-content', start: 'top top', end: 'bottom bottom', scrub: 0.3 },
          });
        }
      });
      // Not toggleClass: with `end: 'max'` the trigger "leaves" at the very bottom of the
      // page and would strip the class, leaving the masthead transparent over the footer.
      ScrollTrigger.create({
        trigger: '#smooth-content',
        start: 'top -80px',
        end: 'max',
        onEnter: () => header.classList.add('is-scrolled'),
        onLeaveBack: () => header.classList.remove('is-scrolled'),
      });
    });
    ctxRef.current = ctx;
    // Chapter triggers after the context exists so the first slip can animate.
    ctx.add(() => {
      const chapters = gsap.utils.toArray<HTMLElement>('[data-concept="b"] [data-chapter]');
      chapters.forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 50%',
          end: 'bottom 50%',
          onToggle: (self) => {
            if (self.isActive) {
              setLabel(el.dataset.chapter ?? '');
              setActive(el.id || null);
            }
          },
        });
      });
    });
    return () => {
      ctxRef.current = null;
      ctx.revert();
      document.body.style.overflow = '';
    };
  }, [defaultLabel, setLabel]);

  // Initial load: logo, nav slips, running head.
  useEffect(() => {
    const header = headerRef.current;
    if (!header || !fontsReady) return;
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const logo = header.querySelector('.b-header-logo-wrap');
        const masks = gsap.utils.toArray<HTMLElement>('.b-nav-mask', header);
        const buttons = masks.map((m) => m.firstElementChild).filter(Boolean) as Element[];
        const running = header.querySelector('.b-running');
        const tl = gsap.timeline({ defaults: { ease: EASE.reveal } });
        if (logo) tl.fromTo(logo, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 0);
        if (masks.length) tl.set(masks, { autoAlpha: 1 }, 0);
        if (buttons.length) tl.fromTo(buttons, { yPercent: 100 }, { yPercent: 0, duration: 0.7, stagger: 0.05 }, 0.1);
        if (running) tl.fromTo(running, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0.5);
      });
    }, header);
    return () => ctx.revert();
  }, [fontsReady]);

  // Overlay open / close.
  useEffect(() => {
    const overlay = overlayRef.current;
    const ctx = ctxRef.current;
    if (!overlay) return;
    document.body.style.overflow = open ? 'hidden' : '';
    if (reducedRef.current || !ctx) return; // CSS handles [data-open] under reduced motion
    ctx.add(() => {
      gsap.killTweensOf(overlay);
      if (open) {
        const lines = overlay.querySelectorAll('.b-overlay-line > span');
        gsap
          .timeline()
          .set(overlay, { visibility: 'visible' })
          .fromTo(overlay, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, ease: EASE.reveal })
          .from(lines, { yPercent: 110, duration: 0.6, stagger: 0.06, ease: EASE.reveal }, '-=0.3');
      } else {
        gsap.to(overlay, {
          clipPath: 'inset(0% 0% 100% 0%)',
          duration: 0.35,
          ease: EASE.snap,
          onComplete: () => {
            gsap.set(overlay, { visibility: 'hidden' });
          },
        });
      }
    });
  }, [open]);

  // Modal behaviour while the index is open: everything beneath it is inert, Escape closes,
  // and Tab / Shift+Tab loop through the masthead controls and the index entries.
  useEffect(() => {
    if (!open) return;
    const header = headerRef.current;
    const overlay = overlayRef.current;
    const inerted: Element[] = [];
    const rootEl = header?.closest('.concept-root');
    if (rootEl) {
      Array.from(rootEl.children).forEach((c) => {
        if (c === header || c === overlay || c.hasAttribute('inert')) return;
        c.setAttribute('inert', '');
        inerted.push(c);
      });
    }
    const focusables = () => {
      const sel = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const list = [...(header?.querySelectorAll<HTMLElement>(sel) ?? []), ...(overlay?.querySelectorAll<HTMLElement>(sel) ?? [])];
      return list.filter((el) => !el.classList.contains('b-skip') && el.getClientRects().length > 0);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        menuBtnRef.current?.focus();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) return;
      const idx = items.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && idx <= 0) {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (!e.shiftKey && (idx === -1 || idx === items.length - 1)) {
        e.preventDefault();
        items[0].focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      inerted.forEach((c) => c.removeAttribute('inert'));
    };
  }, [open]);

  // Move focus into the index once it is revealed (immediately under reduced motion).
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(
      () => {
        overlayRef.current?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
      },
      reducedRef.current ? 0 : 450
    );
    return () => window.clearTimeout(id);
  }, [open]);

  const go = (id: string) => scrollToId(`#${id}`, 80);
  const goFromOverlay = (id: string) => {
    setOpen(false);
    // Return focus before the entry becomes visibility:hidden, so it never drops to <body>.
    menuBtnRef.current?.focus({ preventScroll: true });
    window.setTimeout(() => go(id), 350);
  };

  const themeLabel = mounted ? (theme === 'dark' ? t('header.theme.toLight') : t('header.theme.toDark')) : '';

  return (
    <>
      <header ref={headerRef} className="b-header">
        <a
          className="b-skip"
          href="#b-main"
          onClick={(e) => {
            // Native hash jumps land wrong under ScrollSmoother; scroll the smoother instead.
            e.preventDefault();
            scrollToId('#b-main', 0);
            document.getElementById('b-main')?.focus({ preventScroll: true });
          }}
        >
          {t('a11y.skipToContent')}
        </a>
        <span ref={progressRef} className="b-progress" aria-hidden="true" />
        <div className="b-container b-header-inner">
          <button
            type="button"
            className="b-header-logo-wrap r-fade"
            onClick={() => scrollToId('#hero', 0)}
            aria-label={t('header.logoAlt')}
            style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
          >
            <Image
              src="/images/eleva-logo-blue.png"
              alt={t('header.logoAlt')}
              width={96}
              height={28}
              unoptimized
              priority
              className="b-header-logo"
            />
          </button>

          <nav className="b-nav" aria-label={t('header.menu.title')}>
            {nav.map((item) => (
              <span key={item.id} className="b-nav-mask r-fade">
                <button
                  type="button"
                  className="b-btn-mono"
                  onClick={() => go(item.id)}
                  aria-current={active === item.id ? 'true' : undefined}
                >
                  <span className="b-num">{item.num}</span>
                  {item.label}
                </button>
              </span>
            ))}
          </nav>

          <div className="b-header-tools">
            {/* Decorative: the nav's aria-current already exposes the active chapter. */}
            <div className="b-running r-fade" aria-hidden="true">
              <span ref={spanA}>{defaultLabel}</span>
              <span ref={spanB} />
            </div>
            <button
              type="button"
              className="b-btn-mono b-theme-btn"
              onClick={toggleTheme}
              aria-label={themeLabel ? `${t('a11y.toggleTheme')} · ${themeLabel}` : t('a11y.toggleTheme')}
            >
              <span className="b-theme-label" aria-hidden={!mounted}>
                {themeLabel}
              </span>
              {/* Below 768px the label yields to an icon of the theme you switch to. */}
              {mounted && (
                <svg
                  className="b-theme-icon"
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  {theme === 'dark' ? (
                    <>
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
                    </>
                  ) : (
                    <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z" />
                  )}
                </svg>
              )}
            </button>
            <button
              type="button"
              className="b-btn-mono"
              onClick={toggleLocale}
              aria-label={`${t('a11y.toggleLanguage')} · ${t(`header.lang.${other}`)}`}
            >
              <span lang={other}>{t(`header.lang.${other}`)}</span>
            </button>
            <button type="button" className="b-btn b-btn-sm" onClick={() => go('request-demo')} style={{ marginLeft: 8 }}>
              <span className="b-xl-hide">{t('header.ctaShort')}</span>
              <span className="b-xl-only">{t('header.cta')}</span>
            </button>
            {/* The chapter nav only fits from 1280px; below that the index overlay serves. */}
            <button
              ref={menuBtnRef}
              type="button"
              className="b-btn-mono b-xl-hide"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="b-overlay"
              aria-label={open ? t('a11y.closeIndex') : t('a11y.openIndex')}
            >
              {open ? t('header.menu.close') : t('header.menu.open')}
            </button>
          </div>
        </div>
      </header>

      <div
        id="b-overlay"
        ref={overlayRef}
        className="b-overlay b-xl-hide"
        role="dialog"
        aria-modal={open ? 'true' : undefined}
        aria-labelledby="b-overlay-title"
        data-open={open ? 'true' : 'false'}
        aria-hidden={!open}
      >
        <p id="b-overlay-title" className="b-label">
          {t('header.menu.title')}
        </p>
        <ol style={{ marginTop: 16 }}>
          {nav.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => goFromOverlay(item.id)} tabIndex={open ? 0 : -1}>
                <span className="b-folio">{item.num}</span>
                <span className="b-overlay-line">
                  <span style={{ display: 'block' }}>{item.label}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
