'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
// Cross-page link: plain next/link with an explicit locale prefix (the static
// export has no i18n middleware). In-page jumps keep using goTo/navClick.
import NextLink from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ScrollCue from '@/components/ScrollCue';
import {
  navClick,
  prefersReducedMotion,
  registerAnchor,
  setActiveSection,
  unregisterAnchor,
} from '@/lib/scrollNav';

gsap.registerPlugin(ScrollTrigger);

type FeatureCard = {
  title: string;
  desc: string;
  image?: string;
};

/** What a `data-fx` element does when its reveal progress moves 0 -> 1. */
type RevealKind = 'title' | 'text' | 'rule' | 'card';

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);

/** Shared by every reveal here, so the pinned column and the mobile stack move alike. */
const revealEase = gsap.parseEase('power2.out');

const revealFrom: Record<RevealKind, gsap.TweenVars> = {
  title: { clipPath: 'inset(0% 100% 0% 0%)', y: 8 },
  text: { opacity: 0, y: 12 },
  rule: { scaleX: 0, transformOrigin: 'left center' },
  card: { clipPath: 'inset(0% 0% 100% 0%)', y: 22, opacity: 0 },
};

const revealTo: Record<RevealKind, gsap.TweenVars> = {
  title: { clipPath: 'inset(0% 0% 0% 0%)', y: 0 },
  text: { opacity: 1, y: 0 },
  rule: { scaleX: 1, transformOrigin: 'left center' },
  card: { clipPath: 'inset(0% 0% 0% 0%)', y: 0, opacity: 1 },
};

const kindOf = (el: HTMLElement): RevealKind => (el.dataset.fx as RevealKind) || 'card';

/**
 * A scrubbed reveal must never un-reveal itself when the reader scrolls back:
 * once its window is behind us the animation is snapped to its end and the
 * trigger stops listening (the tween stays alive, so gsap.context can still
 * revert it on unmount).
 */
function lockAtEnd(self: ScrollTrigger) {
  self.getTween()?.kill();
  self.animation?.progress(1);
  self.disable(false, true);
}

export default function Features() {
  const t = useTranslations();
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const mobileRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const horizontalRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const pairsRef = useRef<(HTMLDivElement | null)[]>([]);
  const lastSlideRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  // `null` until the first client measurement. The effect that sets it and the
  // motion effects below are committed in the same React pass, so a two-state
  // `false` default lets the desktop stage build itself once against the
  // `hidden md:block` markup on a phone: inside `display:none` every offset is
  // 0, `contentScroll.scrollHeight - innerHeight` goes negative and the trigger
  // is created with `pin: true` and an `end` before its `start`, only to be
  // reverted on the next commit - a pin-spacer insertion and a full
  // ScrollTrigger.refresh() paid on every mobile load.
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  // Destination of the "next" cue inside the pinned stage - it follows the phase
  const [nextCueId, setNextCueId] = useState('features-pair-0');
  const nextCueIdRef = useRef(nextCueId);

  const features = t.raw('features.cards') as FeatureCard[];
  const ctaText = t('features.ctaTitle');
  const ctaDesc = t('features.ctaDesc');
  const platformHref = `/${locale}/platform/`;

  // Cue label: "Siguiente" while the cards reveal, "Siguiente: <section>" later
  const cueSections: Record<string, string> = {
    how: t('nav.how'),
    security: t('nav.security'),
    pricing: t('nav.pricing'),
    faq: t('nav.faq'),
    demo: t('nav.requestDemo'),
  };
  const cueLabel = cueSections[nextCueId]
    ? t('cues.nextTo', { section: cueSections[nextCueId] })
    : t('cues.next');
  // The visible label stays a short "Siguiente" while the cards reveal; the
  // accessible name always names where the button goes.
  const cueAriaLabel = cueSections[nextCueId]
    ? cueLabel
    : t('cues.nextTo', { section: t('nav.features') });
  // Phase 2 parks the CTA column at the left edge, so the cue moves into it and
  // stops sitting on top of the #how/#security/#pricing/#faq column.
  const cueInVerticalPhase = ['how', 'security', 'pricing', 'faq', 'demo'].includes(nextCueId);

  // Group features in pairs
  const pairs: Array<Array<FeatureCard>> = [];
  for (let i = 0; i < features.length; i += 2) {
    pairs.push(features.slice(i, i + 2));
  }

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Skip the carousel effect on mobile and before the breakpoint is known
    if (isMobile !== false) return;

    const registeredIds: string[] = [];
    // Reduced motion keeps the pinned stage (it is the page's only route to
    // #how/#security/#pricing/#faq) but every reveal renders finished.
    const reduce = prefersReducedMotion();

    const ctx = gsap.context(() => {
      const horizontal = horizontalRef.current;
      const pairElements = pairsRef.current.filter(Boolean) as HTMLDivElement[];
      const lastSlide = lastSlideRef.current;
      const contentScroll = contentScrollRef.current;
      const trigger = triggerRef.current;

      if (!horizontal || !pairElements.length || !lastSlide || !contentScroll || !trigger) return;

      // Nothing on this stage is hidden by the server markup: if GSAP never
      // gets this far (guard above, a chunk that failed to load, JS off) a
      // desktop visitor must still read the cards, the CTA and the column
      // instead of an empty 100vh. These sets live inside gsap.context, so
      // ctx.revert() puts every element back the way it shipped.
      pairElements.forEach((pair) => {
        const top = pair.querySelector<HTMLElement>('.card-top');
        const bottom = pair.querySelector<HTMLElement>('.card-bottom');
        if (top) gsap.set(top, { opacity: 0, scale: 0.9, y: -60 });
        if (bottom) gsap.set(bottom, { opacity: 0, scale: 0.9, y: 60 });
      });
      const headerEl = headerRef.current;
      gsap.set(headerEl ? [headerEl, lastSlide] : [lastSlide], { opacity: 0 });

      // CTA reveal pause duration (part of the horizontal leg)
      const ctaRevealPause = 400;

      // Every viewport-dependent length lives in one snapshot, re-taken on each
      // ScrollTrigger refresh (see `end` below). The pin length, the onUpdate
      // math and the anchor resolvers all read that same snapshot, so a resize
      // can never leave them disagreeing about where a block sits.
      const measure = () => {
        const screenWidth = window.innerWidth;
        const isLargeScreen = screenWidth >= 1024;
        const gapSize = isLargeScreen ? 32 : 16;

        const featureCardsWidth = pairElements.reduce((acc, el) => acc + el.offsetWidth + gapSize, 0);
        const startPadding = screenWidth * (isLargeScreen ? 0.1 : 0.06); // pl-[6vw] lg:pl-[10vw]
        const emptySlideWidth = screenWidth * (isLargeScreen ? 0.68 : 0.48) + gapSize; // w-[48vw] lg:w-[68vw]

        // Horizontal scroll includes the pause that reveals the CTA
        const totalHorizontalScroll =
          featureCardsWidth + startPadding + emptySlideWidth + ctaRevealPause;
        // Content height for the vertical leg
        const contentHeight = contentScroll.scrollHeight - window.innerHeight;

        return {
          featureCardsWidth,
          startPadding,
          emptySlideWidth,
          totalHorizontalScroll,
          contentHeight,
          totalScrollDistance: totalHorizontalScroll + contentHeight,
        };
      };

      let m = measure();

      // How long the CTA takes to fade in once every card is revealed
      const ctaRevealDuration = 600;

      // Reveal timings, read live (they scale with the viewport width).
      // onUpdate AND the anchor resolvers share them, so a nav click lands
      // exactly where scrolling by hand would.
      const timings = () => {
        const baseRevealDuration = 250;
        const revealDuration = baseRevealDuration * (window.innerWidth / 1920 + 0.5); // 0.5x - 1.5x
        const staggerDelay = revealDuration + 80;
        return {
          revealDuration,
          staggerDelay,
          allCardsRevealedAt: (pairElements.length - 1) * staggerDelay + revealDuration,
        };
      };

      // Sub-sections that live inside the scrubbed content column
      const blocks: Array<{ id: string; el: HTMLElement }> = [];
      ['how', 'security', 'pricing', 'faq'].forEach((id) => {
        const el = contentScroll.querySelector<HTMLElement>(`#${id}`);
        if (el) blocks.push({ id, el });
      });

      // --- Phase-2 reveals ------------------------------------------------
      // The how/security/pricing/faq column has no scroll position of its own:
      // it is dragged by the same onUpdate below. So its reveals are computed
      // from that one number - the column offset (verticalProgress *
      // contentHeight) against each block's offsetTop - instead of from their
      // own ScrollTriggers, which is what makes a goTo('how') arrival play the
      // reveal instead of teleporting into a finished block.
      //
      // Every item of a block finishes inside that block's single window, and
      // the window closes while the block's top is still 30% down the stage, so
      // a centred block is never caught half-revealed.
      type RevealItem = { el: HTMLElement; kind: RevealKind; applied: number };
      type RevealGroup = { el: HTMLElement; top: number; items: RevealItem[] };

      const revealGroups: RevealGroup[] = blocks.map(({ el }) => ({
        el,
        top: el.offsetTop,
        items: Array.from(el.querySelectorAll<HTMLElement>('[data-fx]')).map((node) => ({
          el: node,
          kind: kindOf(node),
          applied: -1,
        })),
      }));

      // offsetTop is read from the same layout snapshot as `measure()` (both run
      // from ScrollTrigger's `end`), never per frame.
      const remeasureReveals = () => {
        revealGroups.forEach((group) => {
          group.top = group.el.offsetTop;
        });
      };

      const applyReveal = (item: RevealItem, progress: number) => {
        // This runs for every item on every scroll frame: skip invisible deltas,
        // but always write the exact 0 and 1 so nothing is left part-way.
        if (progress === item.applied) return;
        if (progress > 0 && progress < 1 && Math.abs(progress - item.applied) < 0.004) return;
        item.applied = progress;

        const eased = revealEase(progress);
        // A finished wipe drops its clip-path rather than resting on
        // inset(0 0 0 0): that still clips at the border box and would swallow
        // a card's shadow and its focus ring for good.
        const done = progress >= 1;
        switch (item.kind) {
          case 'title':
            gsap.set(item.el, {
              clipPath: done ? 'none' : `inset(0% ${(1 - eased) * 100}% 0% 0%)`,
              y: (1 - eased) * 8,
            });
            break;
          case 'text':
            gsap.set(item.el, { opacity: eased, y: (1 - eased) * 12 });
            break;
          case 'rule':
            gsap.set(item.el, { scaleX: eased, transformOrigin: 'left center' });
            break;
          default:
            gsap.set(item.el, {
              clipPath: done ? 'none' : `inset(0% 0% ${(1 - eased) * 100}% 0%)`,
              y: (1 - eased) * 22,
              opacity: Math.min(1, eased * 1.6),
            });
        }
      };

      // `gate` is the CTA reveal during the horizontal leg: the first block sits
      // in the stage from the moment the CTA slide fades in, so it wipes in with
      // it rather than arriving pre-assembled.
      const updateReveals = (columnScroll: number, gate: number) => {
        if (reduce) return;
        const viewport = window.innerHeight;
        const enterAt = viewport * 0.92;
        const band = viewport * 0.62;

        revealGroups.forEach((group) => {
          const groupProgress = clamp01((enterAt - (group.top - columnScroll)) / band) * gate;
          const count = group.items.length;
          // Each item owns 55% of the block's window, so the last one still
          // completes exactly when the block does.
          const span = 0.55;
          const step = count > 1 ? (1 - span) / (count - 1) : 0;
          group.items.forEach((item, index) => {
            applyReveal(item, clamp01((groupProgress - index * step) / span));
          });
        });
      };

      // The animated background cannot put a ScrollTrigger on #how/#security/
      // #pricing/#faq: they ride inside `contentScroll`, an absolutely
      // positioned column this stage translates, so their document offsets are
      // nowhere near where they appear. The stage publishes instead, from the
      // same cached tops the reveals use - no per-frame layout read.
      const publishActiveBlock = (columnScroll: number) => {
        if (!revealGroups.length) {
          setActiveSection('features');
          return;
        }
        const marker = columnScroll + window.innerHeight * 0.5;
        let current = blocks[0].id;
        revealGroups.forEach((group, index) => {
          if (group.top <= marker) current = blocks[index].id;
        });
        setActiveSection(current);
      };

      // Hidden start state, written before the trigger exists so the first
      // onUpdate (which may arrive on a deep link) always wins.
      updateReveals(0, 0);

      // The carousel cards unroll behind a clip while they slide in. The clip is
      // dropped once a pair is fully revealed, so the long tail of the pin does
      // not keep re-writing clip-path on twelve cards every frame.
      const pairClipCleared = pairElements.map(() => false);

      // Where the "next" cue points, given how far into the pin we are. The
      // scrub pacing is left alone, so consecutive pair reveals can be closer
      // together than a click should travel: prefer the first stop a clear
      // jump (400px) ahead and only fall back to the very next one at the end.
      const MIN_CUE_JUMP = 400;
      const nextStopId = (scrollY: number) => {
        const { staggerDelay, revealDuration, allCardsRevealedAt } = timings();
        const stops = [
          ...pairElements.map((_, index) => ({
            id: `features-pair-${index}`,
            at: index * staggerDelay + revealDuration,
          })),
          { id: 'features-cta', at: allCardsRevealedAt + ctaRevealDuration },
          ...blocks.map((block) => ({ id: block.id, at: m.totalHorizontalScroll + block.el.offsetTop })),
        ];
        return (
          stops.find((stop) => stop.at > scrollY + MIN_CUE_JUMP)?.id ??
          stops.find((stop) => stop.at > scrollY + 8)?.id ??
          'demo'
        );
      };

      // Single ScrollTrigger
      const st = ScrollTrigger.create({
        trigger: trigger,
        start: 'top top',
        // Re-measured here on every refresh (invalidateOnRefresh re-invokes
        // the function), which is what keeps `m` live for onUpdate and for the
        // anchor resolvers below.
        end: () => {
          m = measure();
          remeasureReveals();
          return `+=${m.totalScrollDistance}`;
        },
        pin: true,
        scrub: 0.5,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const scrollY = self.progress * m.totalScrollDistance;
          const header = headerRef.current;

          // Keep the cue pointing at whatever comes next
          const nextId = nextStopId(scrollY);
          if (nextId !== nextCueIdRef.current) {
            nextCueIdRef.current = nextId;
            setNextCueId(nextId);
          }

          // Animation constants - responsive to screen size
          const screenWidth = window.innerWidth;
          const isLarge = screenWidth >= 1024;
          const { featureCardsWidth, startPadding, emptySlideWidth, totalHorizontalScroll, contentHeight } = m;

          // Responsive pair dimensions (must match CSS gap-4 lg:gap-8)
          const pairWidth = Math.min(340, Math.max(260, screenWidth * 0.20));
          const pairGap = isLarge ? 32 : 16; // gap-4 = 16px, gap-8 = 32px

          // Left margin where cards exit - responsive (smaller on small screens)
          const leftMargin = Math.max(40, screenWidth * 0.04);

          // Reveal timing - scales with screen size for consistent feel
          const { revealDuration, staggerDelay, allCardsRevealedAt } = timings();

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
              // Eased for the eye only: every measurement above and every anchor
              // below still reads the raw, linear revealProgress. Reduced motion
              // keeps the plain linear ramp this stage always had.
              const eased = reduce ? revealProgress : revealEase(revealProgress);
              const revealing = !reduce && revealProgress < 1;

              gsap.set(topCard, {
                y: -60 * (1 - eased),
                opacity: eased,
                scale: 0.9 + 0.1 * eased,
                // The top card drops in and unrolls downward, the bottom one
                // rises and unrolls upward: a reveal, not a fade.
                ...(revealing ? { clipPath: `inset(0% 0% ${(1 - eased) * 100}% 0%)` } : null),
              });
              gsap.set(bottomCard, {
                y: 60 * (1 - eased),
                opacity: eased,
                scale: 0.9 + 0.1 * eased,
                ...(revealing ? { clipPath: `inset(${(1 - eased) * 100}% 0% 0% 0%)` } : null),
              });

              if (revealing) {
                pairClipCleared[index] = false;
              } else if (!pairClipCleared[index]) {
                gsap.set([topCard, bottomCard], { clipPath: 'none' });
                pairClipCleared[index] = true;
              }

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

            // CTA opacity (eased, so the slide arrives instead of cross-fading)
            const ctaEased = reduce ? ctaProgress : revealEase(ctaProgress);
            gsap.set(lastSlide, { opacity: ctaEased });

            // Reset content scroll
            gsap.set(contentScroll, { y: 0 });

            // The first block is already in the stage behind the CTA: it wipes
            // in with it, gated by the very same progress.
            updateReveals(0, ctaEased);
            setActiveSection('features');
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
            const columnScroll = contentHeight * verticalProgress;
            gsap.set(contentScroll, { y: -columnScroll });

            // Same number drives the column and its reveals, so a block can
            // never be centred while its cards are still on their way in.
            updateReveals(columnScroll, 1);
            publishActiveBlock(columnScroll);

            // CTA scrolls up with the rest - no fade out needed
          }
        },
      });

      // --- Anchors -------------------------------------------------------
      // `st.start` is the live pin start (ScrollTrigger recomputes it on every
      // refresh/resize) and the resolvers are functions, so these stay correct.
      const addAnchor = (id: string, resolver: () => number) => {
        registerAnchor(id, resolver);
        registeredIds.push(id);
      };

      // Small cushion so a tween settles just past a reveal, never just short
      const settle = 16;

      addAnchor('features', () => st.start);
      addAnchor('features-revealed', () => st.start + timings().allCardsRevealedAt + settle);
      pairElements.forEach((_, index) => {
        addAnchor(`features-pair-${index}`, () => {
          const { staggerDelay, revealDuration } = timings();
          return st.start + index * staggerDelay + revealDuration + settle;
        });
      });
      addAnchor('features-cta', () => st.start + timings().allCardsRevealedAt + ctaRevealDuration);
      // Phase 2 moves the column by exactly (scroll - totalHorizontalScroll)
      blocks.forEach(({ id, el }) => {
        addAnchor(id, () => st.start + m.totalHorizontalScroll + el.offsetTop);
      });
    }, sectionRef);

    return () => {
      registeredIds.forEach(unregisterAnchor);
      ctx.revert();
    };
  }, [isMobile]);

  // Mobile: nothing here is pinned, so each element gets its own short scrubbed
  // window (90% -> 55% of the viewport) and locks once the window is behind it.
  // The window closes well above the fold, so a card is never still arriving by
  // the time the reader is reading it.
  useEffect(() => {
    if (isMobile !== true || prefersReducedMotion()) return;

    const root = mobileRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>('[data-fx]').forEach((el) => {
        const kind = kindOf(el);
        gsap.fromTo(el, { ...revealFrom[kind] }, {
          ...revealTo[kind],
          ease: 'power2.out',
          // A finished wipe drops its clip-path: resting on inset(0 0 0 0) keeps
          // clipping at the border box and would swallow the CTA's shadow.
          onComplete: () => {
            gsap.set(el, { clipPath: 'none' });
          },
          scrollTrigger: {
            trigger: el,
            start: 'top 90%',
            end: 'top 55%',
            scrub: 0.3,
            onLeave: lockAtEnd,
          },
        });
      });
    }, mobileRef);

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
      <div className={`card-${position} feature-card-3d relative w-[clamp(240px,18vw,320px)] h-[clamp(200px,16vw,280px)]`}>
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
            /* shrink-0: the illustration is a flex item next to the description. Without it the
               longer copy squeezes this box from 64px down to ~16px and the artboard renders as
               a sliver. Fixed, smaller heights leave the text room inside the card. */
            <div className="relative w-full mb-2 lg:mb-3 rounded-xl overflow-hidden h-12 lg:h-16 shrink-0">
              <Image src={feature.image} alt="" fill sizes="260px" className="object-contain p-1" />
            </div>
          )}
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="font-semibold text-white text-sm lg:text-base mb-1 lg:mb-2">{feature.title}</h3>
            <p className="text-white/70 leading-relaxed text-xs lg:text-sm line-clamp-5">{feature.desc}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="features">
      {/* Mobile layout - simple vertical scroll */}
      <section ref={mobileRef} className="md:hidden px-5 py-16">
        {/* Header */}
        <div className="mb-8">
          <h2 data-fx="title" className="text-2xl font-semibold text-white">{t('features.title')}</h2>
          <p data-fx="text" className="mt-3 text-white/70">{t('features.sub')}</p>
          <div data-fx="rule" className="mt-5 h-px w-16 bg-gradient-to-r from-brand-400/70 to-brand-400/0" />
        </div>

        {/* Feature cards grid */}
        <div className="grid gap-4">
          {features.map((feature) => (
            <div data-fx="card" key={feature.title}>{renderMobileCard(feature)}</div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <ScrollCue targetId="how" label={t('cues.nextTo', { section: t('nav.how') })} />
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
          <h2 data-fx="title" className="text-2xl font-semibold text-white mb-3">{ctaText}</h2>
          <p data-fx="text" className="text-base text-white/70 mb-6">{ctaDesc}</p>
          {/* transition-colors, not `transition`: this link is also a scrubbed
              data-fx target, and Tailwind's bare `transition` re-interpolates
              the opacity and transform the scrub writes every frame. */}
          <a
            data-fx="card"
            href="#demo"
            onClick={navClick('demo')}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-700 shadow-lg shadow-brand-600/25"
          >
            {t('nav.requestDemo')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
          <NextLink
            href={platformHref}
            className="mt-4 flex items-center justify-center gap-1.5 text-sm text-white/60 transition hover:text-white"
          >
            {t('features.detailCta')}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </NextLink>
        </div>

        {/* How section */}
        <div id="how-mobile" className="py-12 border-t border-white/10">
          <h3 data-fx="title" className="text-xl font-semibold text-white">{t('how.title')}</h3>
          <p data-fx="text" className="mt-2 text-white/70">{t('how.sub')}</p>
          <div data-fx="rule" className="mt-4 h-px w-16 bg-gradient-to-r from-brand-400/70 to-brand-400/0" />
          <div className="mt-6 grid gap-4">
            {(t.raw('how.steps') as Array<{ title: string; desc: string }>).map((step, i) => (
              <div data-fx="card" key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
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
          <h3 data-fx="title" className="text-xl font-semibold text-white">{t('security.title')}</h3>
          <p data-fx="text" className="mt-2 text-white/70">{t('security.sub')}</p>
          <div data-fx="rule" className="mt-4 h-px w-16 bg-gradient-to-r from-brand-400/70 to-brand-400/0" />
          <div className="mt-6 grid gap-4">
            {(t.raw('security.cards') as Array<{ title: string; desc: string }>).map((card) => (
              <div data-fx="card" key={card.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-medium text-white">{card.title}</div>
                <p className="mt-2 text-sm text-white/60">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing section */}
        <div id="pricing-mobile" className="py-12 border-t border-white/10">
          <h3 data-fx="title" className="text-xl font-semibold text-white">{t('pricing.title')}</h3>
          <p data-fx="text" className="mt-2 text-white/70">{t('pricing.sub')}</p>
          <div data-fx="rule" className="mt-4 h-px w-16 bg-gradient-to-r from-brand-400/70 to-brand-400/0" />
          <div className="mt-6 grid gap-4">
            {(t.raw('pricing.plans') as Array<{ name: string; price: string; note: string; bullets: string[]; cta: string; highlight?: string }>).map((plan) => (
              <div data-fx="card" key={plan.name} className={`rounded-2xl border p-5 ${plan.highlight ? 'border-brand-500/50 bg-brand-500/10' : 'border-white/10 bg-white/5'}`}>
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
                <a href="#demo" onClick={navClick('demo')} className={`mt-5 block text-center rounded-xl px-4 py-2.5 text-sm font-medium transition ${plan.highlight ? 'bg-brand-600 text-white hover:bg-brand-700' : 'border border-white/15 text-white/85 hover:bg-white/10'}`}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ section */}
        <div id="faq-mobile" className="py-12 border-t border-white/10">
          <h3 data-fx="title" className="text-xl font-semibold text-white">{t('faq.title')}</h3>
          <p data-fx="text" className="mt-2 text-white/70">{t('faq.sub')}</p>
          <div data-fx="rule" className="mt-4 h-px w-16 bg-gradient-to-r from-brand-400/70 to-brand-400/0" />
          <div className="mt-6 grid gap-4">
            {(t.raw('faq.items') as Array<{ q: string; a: string }>).map((item) => (
              <div data-fx="card" key={item.q} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-medium text-white">{item.q}</div>
                <p className="mt-2 text-sm text-white/60">{item.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <ScrollCue targetId="demo" label={t('cues.nextTo', { section: t('nav.requestDemo') })} />
          </div>
        </div>
      </section>

      {/* Desktop layout - horizontal carousel with effects */}
      <section ref={sectionRef} className="relative hidden md:block">
      {/* Pinned scroll container */}
      <div ref={triggerRef} className="relative h-screen overflow-hidden">
        {/* Title header - on top, visible during cards phase */}
        <div ref={headerRef} className="absolute top-0 left-0 right-0 z-10 pt-24 pb-6 px-8">
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
              style={{ width: '100vw' }}
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
                  onClick={navClick('demo')}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-700 shadow-lg shadow-brand-600/25"
                >
                  {t('nav.requestDemo')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </a>
                <NextLink
                  href={platformHref}
                  className="mt-5 flex items-center justify-center gap-1.5 text-center text-sm text-white/60 transition hover:text-white"
                >
                  {t('features.detailCta')}
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </NextLink>
              </div>

              {/* Right: Content - 70% */}
              <div className="flex-1 lg:w-[70vw] h-full overflow-hidden relative">
                <div ref={contentScrollRef} className="absolute w-full" style={{ willChange: 'transform' }}>
                  {/* How section */}
                  <div id="how" className="min-h-screen flex flex-col justify-center border-l border-white/10 p-8 lg:p-12">
                    <h3 data-fx="title" className="text-2xl font-semibold text-white">{t('how.title')}</h3>
                    <p data-fx="text" className="mt-2 text-white/70">{t('how.sub')}</p>
                    <div data-fx="rule" className="mt-5 h-px w-24 bg-gradient-to-r from-brand-400/70 to-brand-400/0" />
                    <div className="mt-8 grid gap-4 md:grid-cols-2">
                      {(t.raw('how.steps') as Array<{ title: string; desc: string }>).map((step, i) => (
                        <div data-fx="card" key={step.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
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
                    <h3 data-fx="title" className="text-2xl font-semibold text-white">{t('security.title')}</h3>
                    <p data-fx="text" className="mt-2 text-white/70">{t('security.sub')}</p>
                    <div data-fx="rule" className="mt-5 h-px w-24 bg-gradient-to-r from-brand-400/70 to-brand-400/0" />
                    <div className="mt-8 grid gap-4">
                      {(t.raw('security.cards') as Array<{ title: string; desc: string }>).map((card) => (
                        <div data-fx="card" key={card.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                          <div className="text-base font-medium text-white">{card.title}</div>
                          <p className="mt-2 text-sm text-white/60">{card.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing section */}
                  <div id="pricing" className="min-h-screen flex flex-col justify-center border-l border-t border-white/10 p-8 lg:p-12">
                    <h3 data-fx="title" className="text-2xl font-semibold text-white">{t('pricing.title')}</h3>
                    <p data-fx="text" className="mt-2 text-white/70">{t('pricing.sub')}</p>
                    <div data-fx="rule" className="mt-5 h-px w-24 bg-gradient-to-r from-brand-400/70 to-brand-400/0" />
                    <div className="mt-8 grid gap-4 md:grid-cols-3">
                      {(t.raw('pricing.plans') as Array<{ name: string; price: string; note: string; bullets: string[]; cta: string; highlight?: string }>).map((plan) => (
                        <div data-fx="card" key={plan.name} className={`rounded-2xl border p-6 ${plan.highlight ? 'border-brand-500/50 bg-brand-500/10' : 'border-white/10 bg-white/5'}`}>
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
                          <a href="#demo" onClick={navClick('demo')} className={`mt-6 block text-center rounded-xl px-4 py-2.5 text-sm font-medium transition ${plan.highlight ? 'bg-brand-600 text-white hover:bg-brand-700' : 'border border-white/15 text-white/85 hover:bg-white/10'}`}>
                            {plan.cta}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FAQ section */}
                  <div id="faq" className="min-h-screen flex flex-col justify-center border-l border-t border-white/10 p-8 lg:p-12">
                    <h3 data-fx="title" className="text-2xl font-semibold text-white">{t('faq.title')}</h3>
                    <p data-fx="text" className="mt-2 text-white/70">{t('faq.sub')}</p>
                    <div data-fx="rule" className="mt-5 h-px w-24 bg-gradient-to-r from-brand-400/70 to-brand-400/0" />
                    <div className="mt-8 grid gap-4 md:grid-cols-2">
                      {(t.raw('faq.items') as Array<{ q: string; a: string }>).map((item) => (
                        <div data-fx="card" key={item.q} className="rounded-2xl border border-white/10 bg-white/5 p-6">
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

        {/* "Next" cue - stays visible for the whole pin, follows the phase.
            bottom-36 keeps it clear of the cookie banner on a first visit. */}
        <div
          className={`absolute bottom-36 left-1/2 z-20 transition-transform duration-500 ${
            cueInVerticalPhase ? '-translate-x-[calc(50%+35vw)]' : '-translate-x-1/2'
          }`}
        >
          <ScrollCue
            targetId={nextCueId}
            label={cueLabel}
            ariaLabel={cueAriaLabel}
            direction="next"
          />
        </div>
      </div>
      </section>
    </div>
  );
}
