'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';

export default function Hero() {
  const t = useTranslations();
  const containerRef = useRef<HTMLDivElement>(null);
  const kickerRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const rotatingTextRef = useRef<HTMLSpanElement>(null);
  const underlineRef = useRef<HTMLSpanElement>(null);

  const rotatingItems = t.raw('hero.titleRotating') as string[];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Initial entrance animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      tl.fromTo(kickerRef.current, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 })
        .fromTo(titleRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.5')
        .fromTo(subtitleRef.current, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, '-=0.5')
        .fromTo(ctaRef.current, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.4')
        .fromTo(pillsRef.current, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.3')
        .fromTo(mockupRef.current, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.4');
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Rotating text animation with smooth width transition
  useEffect(() => {
    const container = rotatingTextRef.current?.parentElement;
    const el = rotatingTextRef.current;
    const underline = underlineRef.current;
    if (!container || !el || !underline) return;

    // Set initial width
    const updateWidth = () => {
      const currentWidth = el.offsetWidth;
      gsap.to(container, { width: currentWidth, duration: 0.4, ease: 'power2.out' });
    };
    updateWidth();

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
    const container = rotatingTextRef.current?.parentElement;
    const el = rotatingTextRef.current;
    const underline = underlineRef.current;
    if (!container || !el || !underline) return;

    // Reset position
    gsap.set(el, { y: 30, opacity: 0, scale: 0.95, filter: 'blur(8px)' });
    gsap.set(underline, { scaleX: 0, opacity: 0 });

    // Animate container width first, then text
    const targetWidth = el.scrollWidth;
    gsap.to(container, {
      width: targetWidth,
      duration: 0.4,
      ease: 'power2.out',
    });

    // Animate text in with slight delay
    gsap.to(el, {
      y: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      duration: 0.5,
      ease: 'power2.out',
      delay: 0.1,
    });

    // Animate underline in after text
    gsap.to(underline, {
      scaleX: 1,
      opacity: 1,
      duration: 0.4,
      ease: 'power2.out',
      delay: 0.3,
    });
  }, [currentIndex]);

  return (
    <section id="hero" ref={containerRef} className="relative overflow-hidden bg-[#070A12]">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-28 right-[-140px] h-[420px] w-[620px] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-[2vh] px-5 pt-[4vh] pb-[4vh] md:grid-cols-2">
        {/* Content */}
        <div>
          <p ref={kickerRef} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-white/70" />
            {t('meta.tagline')}
          </p>

          <h1
            ref={titleRef}
            className="mt-[2vh] text-4xl font-semibold leading-tight text-white md:text-5xl"
          >
            {t('hero.titleStart')}
            <br />
            <span className="relative inline-flex items-center mt-1">
              {/* Rotating text container */}
              <span className="relative inline-flex items-baseline overflow-hidden" style={{ height: '1.2em' }}>
                <span
                  ref={rotatingTextRef}
                  className="inline-block whitespace-nowrap bg-gradient-to-r from-brand-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent"
                >
                  {rotatingItems[currentIndex]}
                </span>
                {/* Animated underline */}
                <span
                  ref={underlineRef}
                  className="absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-brand-500/70 via-cyan-400/50 to-transparent"
                />
              </span>
            </span>
          </h1>

          <p ref={subtitleRef} className="mt-[1.5vh] text-base leading-relaxed text-white/75 md:text-lg">
            {t('hero.sub')}
          </p>

          <div ref={ctaRef} className="mt-[3vh] flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center rounded-2xl bg-brand-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-brand-700 shadow-lg shadow-brand-600/25"
            >
              {t('hero.ctaPrimary')}
            </button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 text-sm text-white/85 transition hover:bg-white/10"
            >
              {t('hero.ctaSecondary')}
            </button>
          </div>

          {/* Pills */}
          <div ref={pillsRef} className="mt-[2.5vh] grid grid-cols-3 gap-3 text-xs text-white/70">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-white">{t('hero.pill1Title')}</div>
              <div className="mt-1">{t('hero.pill1Sub')}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-white">{t('hero.pill2Title')}</div>
              <div className="mt-1">{t('hero.pill2Sub')}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="text-white">{t('hero.pill3Title')}</div>
              <div className="mt-1">{t('hero.pill3Sub')}</div>
            </div>
          </div>
        </div>

        {/* Mock UI */}
        <div ref={mockupRef}>
          <div className="rounded-[28px] border border-white/12 bg-white/5 p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-white/90">{t('mock.title')}</div>
              <div className="text-xs text-white/60">{t('mock.org')}</div>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{t('mock.cardTitle')}</div>
                  <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/75">
                    {t('mock.status')}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 text-xs text-white/70">
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                    <span>{t('mock.d1')}</span>
                    <span>3.2</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                    <span>{t('mock.d2')}</span>
                    <span>3.6</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                    <span>{t('mock.d3')}</span>
                    <span>3.4</span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/10 p-3">
                    <span>{t('mock.evidence')}</span>
                    <span className="text-white/85">{t('mock.files')}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/10 p-3">
                    <span>{t('mock.approval')}</span>
                    <span className="text-white/85">{t('mock.pending')}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs text-white/70">{t('mock.equityLabel')}</div>
                <div className="mt-2 text-sm font-medium">{t('mock.equityTitle')}</div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[62%] rounded-full bg-white/70" />
                </div>
                <div className="mt-2 text-xs text-white/60">{t('mock.equityNote')}</div>
              </div>
            </div>
          </div>

          <p className="mt-3 text-center text-xs text-white/50">{t('mock.mockNote')}</p>
        </div>
      </div>

      {/* Social proof */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-[3vh]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-white/70">{t('social.line')}</p>
            <div className="flex flex-wrap gap-2">
              {(t.raw('social.tags') as string[]).map((tag: string) => (
                <span
                  key={tag}
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
