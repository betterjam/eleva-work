'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

type FeatureCard = {
  title: string;
  desc: string;
  image?: string;
};

export default function Features() {
  const t = useTranslations();
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const pairsRef = useRef<(HTMLDivElement | null)[]>([]);
  const lastSlideRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  const features = t.raw('features.cards') as FeatureCard[];
  const ctaText = locale === 'es' ? '¿Listo para empezar?' : 'Ready to start?';
  const ctaDesc = locale === 'es'
    ? 'Descubre cómo Eleva puede transformar tu institución.'
    : 'Discover how Eleva can transform your institution.';
  const scrollHint = locale === 'es' ? 'Desliza para explorar' : 'Scroll to explore';

  // Group features in pairs
  const pairs: Array<Array<FeatureCard>> = [];
  for (let i = 0; i < features.length; i += 2) {
    pairs.push(features.slice(i, i + 2));
  }

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    setMounted(true);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Skip carousel effect on mobile
    if (isMobile) return;

    const ctx = gsap.context(() => {
      const horizontal = horizontalRef.current;
      const pairElements = pairsRef.current.filter(Boolean) as HTMLDivElement[];
      const lastSlide = lastSlideRef.current;
      const contentScroll = contentScrollRef.current;
      const trigger = triggerRef.current;
      const scrollHint = scrollHintRef.current;

      if (!horizontal || !pairElements.length || !lastSlide || !contentScroll || !trigger) return;

      // Calculate horizontal scroll distance - responsive
      const screenWidth = window.innerWidth;
      const isLargeScreen = screenWidth >= 1024;
      const gapSize = isLargeScreen ? 32 : 16;

      const featureCardsWidth = pairElements.reduce((acc, el) => acc + el.offsetWidth + gapSize, 0);
      const startPadding = screenWidth * (isLargeScreen ? 0.1 : 0.06); // pl-[6vw] lg:pl-[10vw]
      const emptySlideWidth = screenWidth * (isLargeScreen ? 0.68 : 0.48) + gapSize; // w-[48vw] lg:w-[68vw]
      const actualCarouselDistance = featureCardsWidth + startPadding + emptySlideWidth;

      // CTA reveal pause duration (must match the value in onUpdate)
      const ctaRevealPause = 400;

      // Total horizontal scroll includes the pause for CTA reveal
      const totalHorizontalScroll = actualCarouselDistance + ctaRevealPause;

      // Content height for vertical scroll
      const contentHeight = contentScroll.scrollHeight - window.innerHeight;

      // Total scroll = horizontal (with pause) + vertical
      const totalScrollDistance = totalHorizontalScroll + contentHeight;

      // Single ScrollTrigger
      ScrollTrigger.create({
        trigger: trigger,
        start: 'top top',
        end: () => `+=${totalScrollDistance}`,
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const scrollY = self.progress * totalScrollDistance;
          const header = headerRef.current;

          // Animation constants - responsive to screen size
          const screenWidth = window.innerWidth;
          const isLarge = screenWidth >= 1024;

          // Responsive pair dimensions (must match CSS gap-4 lg:gap-8)
          const pairWidth = Math.min(340, Math.max(260, screenWidth * 0.20));
          const pairGap = isLarge ? 32 : 16; // gap-4 = 16px, gap-8 = 32px

          // Left margin where cards exit - responsive (smaller on small screens)
          const leftMargin = Math.max(40, screenWidth * 0.04);

          // Reveal timing - scales with screen size for consistent feel
          const baseRevealDuration = 250;
          const revealDuration = baseRevealDuration * (screenWidth / 1920 + 0.5); // Scale between 0.5x and 1.5x
          const staggerDelay = revealDuration + 80;

          const lastPairIndex = pairElements.length - 1;
          const allCardsRevealedAt = lastPairIndex * staggerDelay + revealDuration;
          const ctaRevealDuration = 600;

          // Calculate carousel speed so CTA's right border is at screen's right edge when fully revealed
          // CTA right position = ctaLeftPosition + ctaWidth (30vw)
          const lastSlideNegMargin = isLarge ? screenWidth * 0.05 : screenWidth * 0.03;
          const ctaLeftPosition = startPadding + emptySlideWidth + featureCardsWidth - lastSlideNegMargin;
          const ctaWidth = screenWidth * (isLarge ? 0.30 : 0.35);
          const ctaRightPosition = ctaLeftPosition + ctaWidth;
          // When CTA is revealed, we want its right border at screenWidth (right edge)
          const targetEffectiveScroll = ctaRightPosition - screenWidth;
          const carouselSpeedDuringReveal = Math.max(0.5, Math.min(1, targetEffectiveScroll / allCardsRevealedAt));

          // CTA appears right after all cards are revealed
          const ctaStartsAt = allCardsRevealedAt;

          // Calculate effective scroll - pause during CTA reveal
          let effectiveScroll: number;
          let ctaProgress: number;

          if (scrollY <= ctaStartsAt) {
            // Phase 1: Cards revealing, carousel moves SLOWLY
            effectiveScroll = scrollY * carouselSpeedDuringReveal;
            ctaProgress = 0;
          } else if (scrollY <= ctaStartsAt + ctaRevealDuration) {
            // Phase 2: CTA revealing, carousel PAUSED
            effectiveScroll = ctaStartsAt * carouselSpeedDuringReveal; // Freeze at slow position
            ctaProgress = (scrollY - ctaStartsAt) / ctaRevealDuration;
          } else {
            // Phase 3: CTA fully visible, carousel resumes at normal speed
            const phase1Distance = ctaStartsAt * carouselSpeedDuringReveal;
            const phase3Scroll = scrollY - ctaStartsAt - ctaRevealDuration;
            effectiveScroll = phase1Distance + phase3Scroll;
            ctaProgress = 1;
          }

          // Calculate the final position for smooth transition
          const lastSlideNegMarginCalc = isLarge ? screenWidth * 0.05 : screenWidth * 0.03;
          const finalCarouselPosition = startPadding + emptySlideWidth + featureCardsWidth - lastSlideNegMarginCalc;

          // Phase 1: Horizontal scroll
          if (scrollY <= totalHorizontalScroll) {
            const progress = scrollY / totalHorizontalScroll;

            // Title animation - fades out quickly once CTA starts moving left
            if (header) {
              if (progress > 0.85) {
                // CTA moving to left - hide header immediately
                const fadeProgress = Math.min(1, (progress - 0.85) / 0.05);
                gsap.set(header, {
                  opacity: 1 - fadeProgress,
                  x: -120 * fadeProgress,
                  filter: `blur(${fadeProgress * 8}px)`
                });
              } else if (progress < 0.1) {
                gsap.set(header, { opacity: progress / 0.1, x: 0, filter: 'blur(0px)' });
              } else {
                gsap.set(header, { opacity: 1, x: 0, filter: 'blur(0px)' });
              }
            }

            // Smooth transition to final position in the last 15% of horizontal scroll
            let carouselX: number;
            if (progress > 0.85) {
              const transitionProgress = (progress - 0.85) / 0.15;
              const eased = transitionProgress * transitionProgress * (3 - 2 * transitionProgress); // smoothstep
              carouselX = effectiveScroll + (finalCarouselPosition - effectiveScroll) * eased;
            } else {
              carouselX = effectiveScroll;
            }

            // Move carousel
            gsap.set(horizontal, { x: -carouselX });

            // Animate cards - reveal from top/bottom
            pairElements.forEach((pair, index) => {
              const topCard = pair.querySelector('.card-top');
              const bottomCard = pair.querySelector('.card-bottom');

              // Reveal pairs one by one
              const revealStart = index * staggerDelay;
              const revealProgress = Math.max(0, Math.min(1, (scrollY - revealStart) / revealDuration));

              gsap.set(topCard, {
                y: -60 * (1 - revealProgress),
                opacity: revealProgress,
                scale: 0.9 + 0.1 * revealProgress,
              });
              gsap.set(bottomCard, {
                y: 60 * (1 - revealProgress),
                opacity: revealProgress,
                scale: 0.9 + 0.1 * revealProgress,
              });

              // Calculate visual position using carouselX (includes smooth transition)
              const initialPosition = startPadding + emptySlideWidth + index * (pairWidth + pairGap);
              const visualX = initialPosition - carouselX;

              // Each pair fades ONLY when IT reaches the left border
              // IMPORTANT: Tiles only start exiting AFTER CTA is fully visible (ctaProgress >= 1)
              if (revealProgress >= 1 && ctaProgress >= 1 && visualX < leftMargin) {
                const exitProgress = Math.min(1, (leftMargin - visualX) / 200);
                gsap.set(pair, {
                  opacity: 1 - exitProgress,
                  scale: 1 - exitProgress * 0.3,
                  filter: `blur(${exitProgress * 6}px)`
                });
              } else if (revealProgress >= 1) {
                gsap.set(pair, { opacity: 1, scale: 1, filter: 'blur(0px)' });
              }
            });

            // CTA opacity
            gsap.set(lastSlide, { opacity: ctaProgress });

            // Scroll hint
            if (scrollHint) {
              gsap.set(scrollHint, { opacity: progress < 0.5 ? 1 : 1 - (progress - 0.5) / 0.3 });
            }

            // Reset content scroll
            gsap.set(contentScroll, { y: 0 });
          }
          // Phase 2: Vertical scroll
          else {
            const verticalProgress = (scrollY - totalHorizontalScroll) / contentHeight;

            // Position carousel at final position (CTA's left edge at screen left border)
            gsap.set(horizontal, { x: -finalCarouselPosition });

            // Title hidden
            if (header) {
              gsap.set(header, { opacity: 0 });
            }

            // Last slide visible
            gsap.set(lastSlide, { opacity: 1 });

            // Cards hidden
            pairElements.forEach((pair) => {
              gsap.set(pair, { opacity: 0 });
            });

            // Scroll content
            gsap.set(contentScroll, { y: -contentHeight * verticalProgress });

            // Hide scroll hint
            if (scrollHint) {
              gsap.set(scrollHint, { opacity: 0 });
            }

            // CTA scrolls up with the rest - no fade out needed
          }
        },
      });

    }, sectionRef);

    return () => ctx.revert();
  }, [isMobile]);

  // Mobile card render - simpler style
  const renderMobileCard = (feature: FeatureCard) => (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      {feature.image && (
        <div className="relative w-full h-20 mb-4 rounded-xl overflow-hidden">
          <Image src={feature.image} alt={feature.title} fill className="object-contain" />
        </div>
      )}
      <h3 className="font-semibold text-white text-base mb-2">{feature.title}</h3>
      <p className="text-white/70 text-sm leading-relaxed">{feature.desc}</p>
    </div>
  );

  const renderCard = (feature: FeatureCard, position: 'top' | 'bottom') => {
    // All cards start hidden, revealed after title
    // Responsive sizing: smaller on small screens, larger on big screens
    return (
      <div
        className={`card-${position} feature-card-3d relative w-[clamp(240px,18vw,320px)] h-[clamp(200px,16vw,280px)]`}
        style={{
          opacity: 0,
          transform: `translateY(${position === 'top' ? -60 : 60}px) scale(0.9)`
        }}
      >
        {feature.image && (
          <div className="absolute inset-0 overflow-hidden rounded-[1.25rem] lg:rounded-[1.5rem]">
            <Image src={feature.image} alt="" fill className="object-cover blur-2xl opacity-30 scale-150" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70" />
          </div>
        )}
        <div className="absolute inset-0 rounded-[1.25rem] lg:rounded-[1.5rem] p-[1px] bg-gradient-to-br from-white/20 via-white/5 to-white/10">
          <div className="absolute inset-[1px] rounded-[1.25rem] lg:rounded-[1.5rem] bg-black/40 backdrop-blur-sm" />
        </div>
        <div className="relative h-full rounded-[1.25rem] lg:rounded-[1.5rem] bg-transparent p-4 lg:p-6 flex flex-col overflow-hidden">
          {feature.image && (
            <div className="relative w-full mb-3 lg:mb-4 rounded-xl overflow-hidden h-16 lg:h-24">
              <Image src={feature.image} alt={feature.title} fill className="object-contain p-2" />
            </div>
          )}
          <div className="flex-1 flex flex-col">
            <h3 className="font-semibold text-white text-sm lg:text-base mb-1 lg:mb-2">{feature.title}</h3>
            <p className="text-white/70 leading-relaxed text-xs lg:text-sm">{feature.desc}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="features">
      {/* Mobile layout - simple vertical scroll */}
      <section className="md:hidden px-5 py-16">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white">{t('features.title')}</h2>
          <p className="mt-3 text-white/70">{t('features.sub')}</p>
        </div>

        {/* Feature cards grid */}
        <div className="grid gap-4">
          {features.map((feature) => (
            <div key={feature.title}>{renderMobileCard(feature)}</div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center py-12 border-t border-white/10">
          <Image
            src="/images/eleva-logo-blue.png"
            alt="Eleva"
            width={100}
            height={33}
            className="h-8 w-auto opacity-80 mx-auto mb-6"
          />
          <h2 className="text-2xl font-semibold text-white mb-3">{ctaText}</h2>
          <p className="text-base text-white/70 mb-6">{ctaDesc}</p>
          <a
            href="#demo"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-700 shadow-lg shadow-brand-600/25"
          >
            {t('nav.requestDemo')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
        </div>

        {/* How section */}
        <div id="how-mobile" className="py-12 border-t border-white/10">
          <h3 className="text-xl font-semibold text-white">{t('how.title')}</h3>
          <p className="mt-2 text-white/70">{t('how.sub')}</p>
          <div className="mt-6 grid gap-4">
            {(t.raw('how.steps') as Array<{ title: string; desc: string }>).map((step, i) => (
              <div key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600/20 text-sm font-medium text-brand-400">
                    {i + 1}
                  </span>
                  <div className="text-sm font-medium text-white">{step.title}</div>
                </div>
                <p className="text-sm text-white/60">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Security section */}
        <div id="security-mobile" className="py-12 border-t border-white/10">
          <h3 className="text-xl font-semibold text-white">{t('security.title')}</h3>
          <p className="mt-2 text-white/70">{t('security.sub')}</p>
          <div className="mt-6 grid gap-4">
            {(t.raw('security.cards') as Array<{ title: string; desc: string }>).map((card) => (
              <div key={card.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-medium text-white">{card.title}</div>
                <p className="mt-2 text-sm text-white/60">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing section */}
        <div id="pricing-mobile" className="py-12 border-t border-white/10">
          <h3 className="text-xl font-semibold text-white">{t('pricing.title')}</h3>
          <p className="mt-2 text-white/70">{t('pricing.sub')}</p>
          <div className="mt-6 grid gap-4">
            {(t.raw('pricing.plans') as Array<{ name: string; price: string; note: string; bullets: string[]; cta: string; highlight?: string }>).map((plan) => (
              <div key={plan.name} className={`rounded-2xl border p-5 ${plan.highlight ? 'border-brand-500/50 bg-brand-500/10' : 'border-white/10 bg-white/5'}`}>
                <div className="flex items-baseline justify-between mb-3">
                  <div className="text-sm font-medium text-white">{plan.name}</div>
                  {plan.highlight && (
                    <span className="text-xs text-brand-400 bg-brand-500/20 px-2 py-1 rounded-full">{plan.highlight}</span>
                  )}
                </div>
                <div className="text-2xl font-semibold text-white">{plan.price}</div>
                <p className="text-xs text-white/50 mt-1">{plan.note}</p>
                <ul className="mt-4 space-y-2">
                  {plan.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2 text-sm text-white/70">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                      {bullet}
                    </li>
                  ))}
                </ul>
                <a href="#demo" className={`mt-5 block text-center rounded-xl px-4 py-2.5 text-sm font-medium transition ${plan.highlight ? 'bg-brand-600 text-white hover:bg-brand-700' : 'border border-white/15 text-white/85 hover:bg-white/10'}`}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ section */}
        <div id="faq-mobile" className="py-12 border-t border-white/10">
          <h3 className="text-xl font-semibold text-white">{t('faq.title')}</h3>
          <p className="mt-2 text-white/70">{t('faq.sub')}</p>
          <div className="mt-6 grid gap-4">
            {(t.raw('faq.items') as Array<{ q: string; a: string }>).map((item) => (
              <div key={item.q} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-medium text-white">{item.q}</div>
                <p className="mt-2 text-sm text-white/60">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Desktop layout - horizontal carousel with effects */}
      <section ref={sectionRef} className="relative hidden md:block">
      {/* Pinned scroll container */}
      <div ref={triggerRef} className="relative h-screen overflow-hidden">
        {/* Title header - on top, visible during cards phase */}
        <div ref={headerRef} className="absolute top-0 left-0 right-0 z-10 pt-24 pb-6 px-8" style={{ opacity: 0 }}>
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-semibold text-white">{t('features.title')}</h2>
            <p className="mt-3 text-white/70 max-w-2xl">{t('features.sub')}</p>
          </div>
        </div>

        <div className="h-full flex items-center pt-36 pb-12">
          {/* Horizontal carousel container */}
          <div
            ref={horizontalRef}
            className="flex items-stretch gap-4 lg:gap-8 pl-[6vw] lg:pl-[10vw]"
            style={{ willChange: 'transform' }}
          >
            {/* Initial empty slide for spacing - responsive */}
            <div className="flex-shrink-0 w-[48vw] lg:w-[68vw]" />

            {/* Feature card pairs - responsive width */}
            {pairs.map((pair, pairIndex) => (
              <div
                key={pairIndex}
                ref={(el) => { pairsRef.current[pairIndex] = el; }}
                className="flex-shrink-0 flex flex-col gap-3 lg:gap-5 items-center justify-center w-[clamp(260px,20vw,340px)]"
              >
                {pair.map((feature, cardIndex) => (
                  <div key={feature.title}>
                    {renderCard(feature, cardIndex === 0 ? 'top' : 'bottom')}
                  </div>
                ))}
              </div>
            ))}

            {/* Last slide - Two column layout: CTA left (30vw) + Content right (70vw) */}
            <div
              ref={lastSlideRef}
              className="flex-shrink-0 flex h-screen -ml-[3vw] lg:-ml-[5vw]"
              style={{ width: '100vw', opacity: 0 }}
            >
              {/* Left: CTA - responsive width */}
              <div className="cta-sticky flex w-[35vw] lg:w-[30vw] flex-shrink-0 h-full flex-col items-center justify-center px-4 lg:px-8 py-8 border-r border-white/10">
                <Image
                  src="/images/eleva-logo-blue.png"
                  alt="Eleva"
                  width={120}
                  height={40}
                  className="h-10 w-auto opacity-80 mb-8"
                />
                <h2 className="text-3xl font-semibold text-white text-center mb-4">{ctaText}</h2>
                <p className="text-base text-white/70 text-center mb-8 max-w-[280px]">{ctaDesc}</p>
                <a
                  href="#demo"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-700 shadow-lg shadow-brand-600/25"
                >
                  {t('nav.requestDemo')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </a>
              </div>

              {/* Right: Content - 70% */}
              <div className="flex-1 lg:w-[70vw] h-full overflow-hidden relative">
                <div ref={contentScrollRef} className="absolute w-full" style={{ willChange: 'transform' }}>
                  {/* How section */}
                  <div id="how" className="min-h-screen flex flex-col justify-center border-l border-white/10 p-8 lg:p-12">
                    <h3 className="text-2xl font-semibold text-white">{t('how.title')}</h3>
                    <p className="mt-2 text-white/70">{t('how.sub')}</p>
                    <div className="mt-8 grid gap-4 md:grid-cols-2">
                      {(t.raw('how.steps') as Array<{ title: string; desc: string }>).map((step, i) => (
                        <div key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600/20 text-sm font-medium text-brand-400">
                              {i + 1}
                            </span>
                            <div className="text-base font-medium text-white">{step.title}</div>
                          </div>
                          <p className="text-sm text-white/60">{step.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Security section */}
                  <div id="security" className="min-h-screen flex flex-col justify-center border-l border-t border-white/10 p-8 lg:p-12">
                    <h3 className="text-2xl font-semibold text-white">{t('security.title')}</h3>
                    <p className="mt-2 text-white/70">{t('security.sub')}</p>
                    <div className="mt-8 grid gap-4">
                      {(t.raw('security.cards') as Array<{ title: string; desc: string }>).map((card) => (
                        <div key={card.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                          <div className="text-base font-medium text-white">{card.title}</div>
                          <p className="mt-2 text-sm text-white/60">{card.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing section */}
                  <div id="pricing" className="min-h-screen flex flex-col justify-center border-l border-t border-white/10 p-8 lg:p-12">
                    <h3 className="text-2xl font-semibold text-white">{t('pricing.title')}</h3>
                    <p className="mt-2 text-white/70">{t('pricing.sub')}</p>
                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                      {(t.raw('pricing.plans') as Array<{ name: string; price: string; note: string; bullets: string[]; cta: string; highlight?: string }>).map((plan) => (
                        <div key={plan.name} className={`rounded-2xl border p-6 ${plan.highlight ? 'border-brand-500/50 bg-brand-500/10' : 'border-white/10 bg-white/5'}`}>
                          <div className="flex items-baseline justify-between mb-4">
                            <div className="text-base font-medium text-white">{plan.name}</div>
                            {plan.highlight && (
                              <span className="text-xs text-brand-400 bg-brand-500/20 px-2 py-1 rounded-full">{plan.highlight}</span>
                            )}
                          </div>
                          <div className="text-3xl font-semibold text-white">{plan.price}</div>
                          <p className="text-xs text-white/50 mt-1">{plan.note}</p>
                          <ul className="mt-4 space-y-2">
                            {plan.bullets.map((bullet) => (
                              <li key={bullet} className="flex items-start gap-2 text-sm text-white/70">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                                {bullet}
                              </li>
                            ))}
                          </ul>
                          <a href="#demo" className={`mt-6 block text-center rounded-xl px-4 py-2.5 text-sm font-medium transition ${plan.highlight ? 'bg-brand-600 text-white hover:bg-brand-700' : 'border border-white/15 text-white/85 hover:bg-white/10'}`}>
                            {plan.cta}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FAQ section */}
                  <div id="faq" className="min-h-screen flex flex-col justify-center border-l border-t border-white/10 p-8 lg:p-12">
                    <h3 className="text-2xl font-semibold text-white">{t('faq.title')}</h3>
                    <p className="mt-2 text-white/70">{t('faq.sub')}</p>
                    <div className="mt-8 grid gap-4 md:grid-cols-2">
                      {(t.raw('faq.items') as Array<{ q: string; a: string }>).map((item) => (
                        <div key={item.q} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                          <div className="text-base font-medium text-white">{item.q}</div>
                          <p className="mt-2 text-sm text-white/60">{item.a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div ref={scrollHintRef} className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 text-white/50 z-10" style={{ willChange: 'transform' }}>
          <div className="flex items-center gap-1">
            <div className="w-8 h-0.5 rounded-full bg-white/40 animate-pulse" />
            <div className="w-4 h-0.5 rounded-full bg-white/20" />
            <div className="w-4 h-0.5 rounded-full bg-white/20" />
          </div>
          <span className="text-xs">{scrollHint}</span>
        </div>
      </div>
      </section>
    </div>
  );
}
