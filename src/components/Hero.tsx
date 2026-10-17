'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
// Cross-page link: plain next/link with an explicit locale prefix. The static
// export has no i18n middleware, so a prefix-less `/platform/` would 404.
import NextLink from 'next/link';
import ScrollCue from '@/components/ScrollCue';
import Testimonial from '@/components/Testimonial';
import { goTo, prefersReducedMotion } from '@/lib/scrollNav';

gsap.registerPlugin(ScrollTrigger, SplitText);

export default function Hero() {
  const t = useTranslations();
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const kickerRef = useRef<HTMLParagraphElement>(null);
  const titleLineRef = useRef<HTMLSpanElement>(null);
  const rotatingLineRef = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const detailLinkRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const socialRef = useRef<HTMLElement>(null);
  const rotatingTextRef = useRef<HTMLSpanElement>(null);
  const underlineRef = useRef<HTMLSpanElement>(null);
  // The first rotation waits for the headline to finish unmasking
  const firstRotationRef = useRef(true);

  const rotatingItems = t.raw('hero.titleRotating') as string[];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Entrance ------------------------------------------------------------------
  // Reveals, not fades: the kicker and the rotating line wipe open, the headline
  // and the sub unmask line by line (SplitText, after the fonts are in), the CTAs
  // settle from 0.96, and the testimonial card wipes in from its right edge
  // with its quote and attribution cascading behind it.
  useEffect(() => {
    // Reduced motion: the markup already is the final state, so nothing moves.
    if (prefersReducedMotion()) return;

    const root = containerRef.current;
    if (!root) return;

    const all = (selector: string) => Array.from(root.querySelectorAll<HTMLElement>(selector));
    const ctas = all('[data-hero-cta]');
    const pills = all('[data-hero-pill]');
    const rows = all('[data-hero-row]');

    // A wipe that lands on inset(0 0 0 0) keeps clipping at the border box,
    // which would eat the card's shadow for good - so every wipe drops its
    // clip-path the moment it finishes.
    const dropClip = (targets: gsap.TweenTarget) => () => {
      gsap.set(targets, { clipPath: 'none' });
    };

    const splits: SplitText[] = [];
    let cancelled = false;
    let fontTimer: number | undefined;

    const ctx = gsap.context(() => {
      gsap.set(kickerRef.current, { opacity: 0, clipPath: 'inset(0% 100% 0% 0%)' });
      gsap.set([titleLineRef.current, subtitleRef.current], { opacity: 0 });
      gsap.set(rotatingLineRef.current, { opacity: 0, clipPath: 'inset(0% 100% 0% 0%)' });
      gsap.set(ctas, { opacity: 0, scale: 0.96, transformOrigin: 'left center' });
      gsap.set(detailLinkRef.current, { opacity: 0, x: -10 });
      gsap.set(pills, { opacity: 0, clipPath: 'inset(0% 0% 100% 0%)' });
      gsap.set(mockupRef.current, { opacity: 0, x: 20, clipPath: 'inset(0% 0% 0% 100%)' });
      gsap.set(rows, { opacity: 0, clipPath: 'inset(0% 100% 0% 0%)' });
    }, containerRef);

    // Lines can only be split once the text is laid out in its real font -
    // splitting earlier bakes the fallback font's line breaks into the markup.
    // The wait is raced against a timeout: the copy above is already at
    // opacity 0, so a font promise that never settles (a hung or blocked font
    // host) would otherwise leave the whole hero blank for good. Losing the
    // race just means the lines arrive whole instead of one by one.
    const fontsReady = Promise.race([
      Promise.resolve(document.fonts?.ready),
      new Promise((resolve) => {
        fontTimer = window.setTimeout(resolve, 1200);
      }),
    ]);

    void fontsReady.then(() => {
      if (cancelled) return;

      ctx.add(() => {
        // Never let a split failure leave the copy at opacity 0: the timeline
        // below fades both containers in either way, so a text that could not
        // be split simply arrives whole instead of line by line.
        const splitLines = (el: HTMLElement | null) => {
          if (!el) return null;
          try {
            return new SplitText(el, { type: 'lines', mask: 'lines', linesClass: 'hero-line' });
          } catch {
            return null;
          }
        };

        const title = splitLines(titleLineRef.current);
        const sub = splitLines(subtitleRef.current);
        [title, sub].forEach((split) => split && splits.push(split));

        const tl = gsap.timeline({
          defaults: { ease: 'power3.out' },
          // A split bakes today's line breaks into the markup, which would
          // survive a window resize, so the splits are undone the moment the
          // entrance is over and the copy goes back to re-wrapping by itself.
          // (Restoring the markup replaces its text node; the `key={locale}` on
          // both elements means React never has to update that node in place,
          // so a language switch cannot be stranded by it.)
          onComplete: () => {
            splits.forEach((split) => split.revert());
            splits.length = 0;
          },
        });

        tl.to(
          kickerRef.current,
          {
            opacity: 1,
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 0.5,
            onComplete: dropClip(kickerRef.current),
          },
          0,
        )
          // The masks hide the lines, so the containers only need to stop being
          // transparent - the movement is entirely in the lines themselves.
          .to([titleLineRef.current, subtitleRef.current], { opacity: 1, duration: 0.25 }, 0.06);

        if (title) {
          tl.from(title.lines, { yPercent: 115, duration: 0.7, stagger: 0.08 }, 0.08);
        }
        if (sub) {
          tl.from(sub.lines, { yPercent: 110, opacity: 0, duration: 0.55, stagger: 0.06 }, 0.36);
        }

        tl.to(
          rotatingLineRef.current,
          {
            opacity: 1,
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 0.5,
            onComplete: dropClip(rotatingLineRef.current),
          },
          0.3,
        )
          .to(
            mockupRef.current,
            {
              opacity: 1,
              x: 0,
              clipPath: 'inset(0% 0% 0% 0%)',
              duration: 0.75,
              onComplete: dropClip(mockupRef.current),
            },
            0.22,
          )
          .to(
            rows,
            {
              opacity: 1,
              clipPath: 'inset(0% 0% 0% 0%)',
              duration: 0.4,
              stagger: 0.04,
              onComplete: dropClip(rows),
            },
            0.5,
          )
          .to(ctas, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(1.4)' }, 0.5)
          .to(
            pills,
            {
              opacity: 1,
              clipPath: 'inset(0% 0% 0% 0%)',
              duration: 0.5,
              stagger: 0.07,
              onComplete: dropClip(pills),
            },
            0.58,
          )
          .to(detailLinkRef.current, { opacity: 1, x: 0, duration: 0.45 }, 0.64);
      });
    });

    return () => {
      cancelled = true;
      window.clearTimeout(fontTimer);
      // Order matters: the context first restores the inline styles it wrote,
      // then each split puts its original markup back.
      ctx.revert();
      splits.forEach((split) => split.revert());
    };
  }, [locale]);

  // Social proof strip: the tags wipe in one after the other as the strip enters
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const strip = socialRef.current;
    if (!strip) return;

    const line = strip.querySelector<HTMLElement>('[data-social-line]');
    const tags = Array.from(strip.querySelectorAll<HTMLElement>('[data-social-tag]'));

    // The strip plays its reveal once, in real time, when it is in view. On
    // desktop it closes the first screen, so it is in view from the start and
    // waits for the hero's own entrance; on phones it plays as it scrolls in.
    const inViewAtStart = strip.getBoundingClientRect().top < window.innerHeight;

    const ctx = gsap.context(() => {
      gsap
        .timeline({
          delay: inViewAtStart ? 1.1 : 0,
          scrollTrigger: { trigger: strip, start: 'top 100%', once: true },
        })
        .fromTo(line, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power2.out' }, 0)
        .fromTo(
          tags,
          { opacity: 0, clipPath: 'inset(0% 100% 0% 0%)' },
          {
            opacity: 1,
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 0.35,
            stagger: 0.06,
            ease: 'power2.out',
            onComplete: () => {
              gsap.set(tags, { clipPath: 'none' });
            },
          },
          0.12,
        );
    }, socialRef);

    return () => ctx.revert();
  }, [locale]);

  // Rotating headline: out, swap, in. Nothing here touches `width` - the box
  // is already as wide as the longest entry (see the hidden sizer in the
  // markup), so the loop is pure transform/opacity/filter and never reflows
  // the <h1> every three seconds for the life of the page.
  useEffect(() => {
    const el = rotatingTextRef.current;
    const underline = underlineRef.current;
    if (!el || !underline) return;
    // Rotating copy is motion too: reduced motion keeps the first item, static.
    if (prefersReducedMotion()) return;

    const interval = setInterval(() => {
      if (!el || !underline) return;

      // Animate out underline first
      gsap.to(underline, {
        scaleX: 0,
        opacity: 0,
        duration: 0.25,
        ease: 'power2.in',
      });

      // Animate out text
      gsap.to(el, {
        y: -30,
        opacity: 0,
        scale: 0.95,
        filter: 'blur(8px)',
        duration: 0.35,
        ease: 'power3.in',
        onComplete: () => {
          setCurrentIndex((prev) => {
            const next = (prev + 1) % rotatingItems.length;
            return next;
          });
        },
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [rotatingItems.length]);

  // Animate in when index changes
  useEffect(() => {
    const el = rotatingTextRef.current;
    const underline = underlineRef.current;
    if (!el || !underline) return;

    if (prefersReducedMotion()) {
      gsap.set(el, { y: 0, opacity: 1, scale: 1, filter: 'none' });
      gsap.set(underline, { scaleX: 1, opacity: 1 });
      return;
    }

    // Reset position
    gsap.set(el, { y: 30, opacity: 0, scale: 0.95, filter: 'blur(8px)' });
    gsap.set(underline, { scaleX: 0, opacity: 0 });

    // The very first word waits for the headline lines to finish unmasking, so
    // the two do not read as two unrelated entrances.
    const isFirst = firstRotationRef.current;
    firstRotationRef.current = false;

    // Animate text in with slight delay
    gsap.to(el, {
      y: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      duration: 0.5,
      ease: 'power2.out',
      delay: isFirst ? 0.5 : 0.1,
    });

    // Animate underline in after text
    gsap.to(underline, {
      scaleX: 1,
      opacity: 1,
      duration: 0.4,
      ease: 'power2.out',
      delay: isFirst ? 0.7 : 0.3,
    });

    // No orphan tweens writing to a detached word after an unmount or a
    // language switch (killTweensOf stops them without reverting any style).
    return () => {
      gsap.killTweensOf([el, underline]);
    };
  }, [currentIndex]);

  // On desktop the hero owns the first screen: it fills the viewport below the
  // 73px sticky header (content centred, social strip at the bottom), so the
  // next section's heading never shows before the reader scrolls.
  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative flex flex-col overflow-hidden bg-[#070A12] md:min-h-[calc(100vh-73px)]"
    >
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-28 right-[-140px] h-[420px] w-[620px] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl flex-1 content-center items-center gap-[2vh] px-5 pt-[4vh] pb-[4vh] md:grid-cols-2">
        {/* Content */}
        <div className="min-w-0">
          <p ref={kickerRef} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
            {t('meta.tagline')}
          </p>

          <h1 className="mt-[2vh] text-[clamp(1.75rem,8vw,2.25rem)] font-semibold leading-tight text-white md:text-5xl">
            {/* SplitText rewrites this element's markup, so it holds nothing but
                the static half of the headline and is keyed by locale: switching
                language hands React a brand new node instead of one the split
                has already taken apart. */}
            <span key={locale} ref={titleLineRef} className="block">
              {t('hero.titleStart')}
            </span>
            {/* The sizer below keeps every phrase on one line, so on phones the rotating
                line is set a notch smaller than the headline: the longest phrase must fit
                the viewport, or it widens the whole column past the screen edge. */}
            <span ref={rotatingLineRef} className="relative mt-1 inline-flex max-w-full items-center text-[0.8em] sm:text-[1em]">
              {/* Rotating text container. The invisible sizer below holds every
                  entry, so the box is already as wide as the longest one and
                  the visible word - taken out of flow - can be swapped without
                  animating `width`, a layout property, on a forever loop. */}
              <span className="relative inline-flex items-baseline overflow-hidden" style={{ height: '1.2em' }}>
                <span aria-hidden="true" className="pointer-events-none invisible flex flex-col">
                  {rotatingItems.map((item) => (
                    <span key={item} className="whitespace-nowrap">{item}</span>
                  ))}
                </span>
                <span
                  ref={rotatingTextRef}
                  className="absolute left-0 top-0 inline-block whitespace-nowrap bg-gradient-to-r from-brand-aqua via-brand-aqua-light to-brand-lavender bg-clip-text text-transparent"
                >
                  {rotatingItems[currentIndex]}
                  {/* Animated underline */}
                  <span
                    ref={underlineRef}
                    className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-brand-aqua/70 via-brand-lavender/50 to-transparent"
                  />
                </span>
              </span>
            </span>
          </h1>

          <p
            key={locale}
            ref={subtitleRef}
            className="mt-[1.5vh] text-base leading-relaxed text-white/75 md:text-lg"
          >
            {t('hero.sub')}
          </p>

          <div className="mt-[3vh] flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              data-hero-cta
              onClick={() => goTo('demo')}
              className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-5 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-brand-700"
            >
              {t('hero.ctaPrimary')}
            </button>
            {/* The detail page is the full product tour, so it gets the button: a
                real navigation with an explicit locale prefix, never goTo. */}
            <NextLink
              data-hero-cta
              href={`/${locale}/platform/`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 px-5 py-3 text-sm text-white/85 transition-colors hover:bg-white/10"
            >
              {t('hero.ctaDetail')}
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </NextLink>
          </div>

          {/* Quiet scroll link to the modules stage below */}
          <div ref={detailLinkRef} className="mt-[1.5vh]">
            <button
              type="button"
              onClick={() => goTo('features')}
              className="inline-flex items-center gap-1.5 text-sm text-white/60 transition hover:text-white"
            >
              {t('hero.ctaSecondary')}
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Pills */}
          <div className="mt-[2.5vh] grid grid-cols-3 gap-3 text-xs text-white/70">
            <div data-hero-pill className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-white">{t('hero.pill1Title')}</div>
              <div className="mt-1">{t('hero.pill1Sub')}</div>
            </div>
            <div data-hero-pill className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-white">{t('hero.pill2Title')}</div>
              <div className="mt-1">{t('hero.pill2Sub')}</div>
            </div>
            <div data-hero-pill className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-white">{t('hero.pill3Title')}</div>
              <div className="mt-1">{t('hero.pill3Sub')}</div>
            </div>
          </div>

          {/* Scroll cue (mobile): inside the first viewport, above the mockup */}
          <div className="mt-[3vh] flex justify-center md:hidden">
            <ScrollCue
              targetId="features"
              label={t('cues.keepScrolling')}
              ariaLabel={t('cues.keepScrollingTo', { section: t('nav.features') })}
            />
          </div>
        </div>

        {/* Testimonial: the one place that shows social proof before the reader
            scrolls. Its parts carry data-hero-row for the entrance cascade. */}
        <div ref={mockupRef}>
          <Testimonial />
        </div>
      </div>

      {/* Social proof */}
      <section ref={socialRef} className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-[3vh]">
          {/* On desktop the strip closes the first screen and its middle stays
              empty on purpose: the page's one fixed cue (FloatingCue) sits there
              at the top of the page and stays put while the strip scrolls away. */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
            {/* Capped so the line wraps before the tags do and the middle stays clear. */}
            <p data-social-line className="text-sm text-white/70 md:max-w-xs">{t('social.line')}</p>
            <div className="flex flex-wrap gap-2 md:justify-end">
              {(t.raw('social.tags') as string[]).map((tag: string) => (
                <span
                  key={tag}
                  data-social-tag
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
