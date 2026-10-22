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
import HowIllustration from '@/components/HowIllustration';
import {
  navClick,
  prefersReducedMotion,
  registerAnchor,
  setCue,
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

  const features = t.raw('features.cards') as FeatureCard[];
  const ctaText = t('features.ctaTitle');
  const ctaDesc = t('features.ctaDesc');
  const platformHref = `/${locale}/platform/`;

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
    // #how/#security/#faq) but every reveal renders finished.
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
      // The title is visible from the moment the stage scrolls into view (it
      // used to fade in over the first 10% of the pin, which left a blank
      // screen between the hero and the first card); only the CTA slide hides.
      gsap.set(lastSlide, { opacity: 0 });

      // CTA reveal pause duration (part of the horizontal leg)
      const ctaRevealPause = 400;
      // Resting plateau once the sixth card is in and the CTA column has faded
      // in: nothing moves for this much scroll, so a wheel or trackpad stops on
      // the finished grid with its CTA (the cue is the only motion) instead of
      // blowing straight into the carousel's exit. Without it that state existed
      // for a handful of pixels, which no hand scroll ever lands on.
      const gridHold = 480;

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
          featureCardsWidth + startPadding + emptySlideWidth + gridHold + ctaRevealPause;
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
        // The first pair reveals during the approach (the section travelling up
        // to its pin, see the approach trigger below), so the pinned timeline
        // starts one reveal ahead: the title is never on screen alone.
        const lead = revealDuration;
        return {
          revealDuration,
          staggerDelay,
          lead,
          revealStartOf: (index: number) => index * staggerDelay - lead,
          allCardsRevealedAt: (pairElements.length - 1) * staggerDelay + revealDuration - lead,
        };
      };

      // Carousel speed during the reveal phase: the CTA's right edge must reach
      // the screen's right edge exactly when the last card is revealed. The
      // reveal clock runs `lead` ahead of the pin (pair 0 reveals on the
      // approach), so that distance is spread over allCardsRevealedAt + lead:
      // the approach trigger covers lead's share, the pinned timeline the rest.
      const carouselSpeed = () => {
        const { allCardsRevealedAt, lead } = timings();
        const screenWidth = window.innerWidth;
        const isLarge = screenWidth >= 1024;
        const lastSlideNegMargin = isLarge ? screenWidth * 0.05 : screenWidth * 0.03;
        const ctaWidth = screenWidth * (isLarge ? 0.3 : 0.35);
        const ctaRight = m.startPadding + m.emptySlideWidth + m.featureCardsWidth - lastSlideNegMargin + ctaWidth;
        return Math.max(0.5, Math.min(1, (ctaRight - screenWidth) / (allCardsRevealedAt + lead)));
      };

      // Sub-sections that live inside the scrubbed content column
      const blocks: Array<{ id: string; el: HTMLElement }> = [];
      ['how', 'security', 'faq'].forEach((id) => {
        const el = contentScroll.querySelector<HTMLElement>(`#${id}`);
        if (el) blocks.push({ id, el });
      });

      // --- Phase-2 reveals ------------------------------------------------
      // The how/security/faq column has no scroll position of its own:
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
      // #faq: they ride inside `contentScroll`, an absolutely
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

      // One pair's reveal at a raw 0..1 progress. Shared by the approach trigger
      // (pair 0, before the pin) and the pinned timeline (every pair).
      const applyPairReveal = (index: number, revealProgress: number) => {
        const pair = pairElements[index];
        const topCard = pair.querySelector('.card-top');
        const bottomCard = pair.querySelector('.card-bottom');
        // Eased for the eye only: every measurement and every anchor still
        // reads the raw, linear revealProgress. Reduced motion keeps the plain
        // linear ramp this stage always had.
        const eased = reduce ? revealProgress : revealEase(revealProgress);
        const revealing = !reduce && revealProgress < 1;

        gsap.set(topCard, {
          y: -60 * (1 - eased),
          opacity: eased,
          scale: 0.9 + 0.1 * eased,
          // The top card drops in and unrolls downward, the bottom one rises
          // and unrolls upward: a reveal, not a fade.
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
      };

      // Where the "next" cue points, given how far into the pin we are. The
      // scrub pacing is left alone, so consecutive pair reveals can be closer
      // together than a click should travel: prefer the first stop a clear
      // jump (400px) ahead and only fall back to the very next one at the end.
      // The CTA column is not a stop of its own: from the last card the next
      // destination is "Cómo funciona", and the CTA reveals on the way there.
      const MIN_CUE_JUMP = 400;
      const nextStopId = (scrollY: number) => {
        const { revealStartOf, revealDuration } = timings();
        const stops = [
          ...pairElements.map((_, index) => ({
            id: `features-pair-${index}`,
            at: revealStartOf(index) + revealDuration,
          })),
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
        // Outside the pin the cue points at the stage itself or at the demo form.
        onLeave: () => setCue({ target: 'demo', parked: false }),
        onLeaveBack: () => setCue({ target: 'features', parked: false }),
        onUpdate: (self) => {
          const scrollY = self.progress * m.totalScrollDistance;
          const header = headerRef.current;

          // The page's floating cue points at whatever comes next; once the CTA
          // column is parked on the left the cue moves into it.
          setCue({
            target: nextStopId(scrollY),
            parked: scrollY >= timings().allCardsRevealedAt + ctaRevealDuration + gridHold,
          });

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
          const { revealDuration, revealStartOf, allCardsRevealedAt, lead } = timings();

          const carouselSpeedDuringReveal = carouselSpeed();
          // Distance the carousel has covered by the time the last card is in:
          // lead's share on the approach plus allCardsRevealedAt here.
          const revealTravel = (allCardsRevealedAt + lead) * carouselSpeedDuringReveal;

          // CTA appears right after the last card; the rest comes after it
          const ctaStartsAt = allCardsRevealedAt;
          const holdEndsAt = ctaStartsAt + ctaRevealDuration + gridHold;

          // Calculate effective scroll - pause during CTA reveal
          let effectiveScroll: number;
          let ctaProgress: number;

          if (scrollY <= allCardsRevealedAt) {
            // Phase 1: Cards revealing, carousel moves SLOWLY (already lead's share in)
            effectiveScroll = (scrollY + lead) * carouselSpeedDuringReveal;
            ctaProgress = 0;
          } else if (scrollY <= ctaStartsAt + ctaRevealDuration) {
            // Phase 2: CTA revealing, carousel PAUSED
            effectiveScroll = revealTravel; // Freeze at slow position
            ctaProgress = (scrollY - ctaStartsAt) / ctaRevealDuration;
          } else if (scrollY <= holdEndsAt) {
            // Hold: grid and CTA rest together, nothing moves
            effectiveScroll = revealTravel;
            ctaProgress = 1;
          } else {
            // Phase 3: CTA fully visible, carousel resumes at normal speed
            const phase3Scroll = scrollY - holdEndsAt;
            effectiveScroll = revealTravel + phase3Scroll;
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

            // Animate cards - reveal from top/bottom, pairs one by one
            pairElements.forEach((pair, index) => {
              const revealProgress = Math.max(0, Math.min(1, (scrollY - revealStartOf(index)) / revealDuration));
              applyPairReveal(index, revealProgress);

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

      // --- Approach ------------------------------------------------------
      // While the section travels up to its pin the first pair already reveals
      // and the carousel covers lead's share of its reveal-phase travel, both
      // scrubbed over that travel, so the reader never sees the title alone.
      // It ends where the pinned timeline starts, which treats pair 0 as done
      // and the carousel as lead * speed along (`lead` in timings), so the two
      // hand over without a jump.
      if (!reduce) {
        ScrollTrigger.create({
          trigger: trigger,
          start: 'top 85%',
          end: 'top top',
          scrub: 0.3,
          onUpdate: (self) => {
            applyPairReveal(0, self.progress);
            gsap.set(horizontal, { x: -(self.progress * timings().lead * carouselSpeed()) });
          },
        });
      }

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
      // "Módulos" lands in the middle of the resting plateau: six cards and the CTA.
      addAnchor('features-revealed', () => st.start + timings().allCardsRevealedAt + ctaRevealDuration + gridHold / 2);
      pairElements.forEach((_, index) => {
        addAnchor(`features-pair-${index}`, () => {
          const { revealStartOf, revealDuration } = timings();
          return st.start + revealStartOf(index) + revealDuration + settle;
        });
      });
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

  // Mobile: nothing here is pinned, and a thumb flick crosses a scrubbed window
  // in a fraction of a second, so a scroll-tied reveal would never actually be
  // seen. Each element plays its reveal once, in real time, as it enters the
  // viewport; a short index stagger keeps neighbours that arrive together from
  // popping in unison.
  useEffect(() => {
    if (isMobile !== true || prefersReducedMotion()) return;

    const root = mobileRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      root.querySelectorAll<HTMLElement>('[data-fx]').forEach((el, i) => {
        const kind = kindOf(el);
        gsap.fromTo(el, { ...revealFrom[kind] }, {
          ...revealTo[kind],
          duration: kind === 'card' ? 0.7 : 0.5,
          delay: (i % 4) * 0.06,
          ease: 'power2.out',
          // A finished wipe drops its clip-path: resting on inset(0 0 0 0) keeps
          // clipping at the border box and would swallow the CTA's shadow.
          onComplete: () => {
            gsap.set(el, { clipPath: 'none' });
          },
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          },
        });
      });
    }, mobileRef);

    return () => ctx.revert();
  }, [isMobile]);

  const cardIndex = (index: number) => String(index + 1).padStart(2, '0');

  // Mobile card: stacked, the illustration on top at a size where it reads.
  const renderMobileCard = (feature: FeatureCard, index: number) => (
    <div className="feature-card relative overflow-hidden rounded-3xl p-5">
      {feature.image && (
        <div className="relative mb-4 h-32 w-full">
          <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-20 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-400/15 blur-2xl" />
          <Image src={feature.image} alt="" fill sizes="(max-width: 768px) 90vw, 320px" className="object-contain" />
        </div>
      )}
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-400">{cardIndex(index)}</div>
      <h3 className="text-base font-semibold tracking-tight text-white">{feature.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-white/70">{feature.desc}</p>
    </div>
  );

  // Carousel card. The outer element is what the stage animates (transform,
  // opacity, clip-path via gsap.set), so everything visual lives one level in.
  // The illustration takes whatever height the copy leaves it, and the copy is
  // pinned to the bottom so titles line up across a pair.
  const renderCard = (feature: FeatureCard, position: 'top' | 'bottom', index: number) => (
    <div className={`card-${position} feature-card-3d relative w-[clamp(240px,18vw,320px)] [@media(max-height:820px)]:w-[clamp(250px,20vw,320px)] h-[clamp(180px,min(18vw,calc((100vh-300px)/2)),300px)]`}>
      <div className="feature-card group relative flex h-full flex-col overflow-hidden rounded-3xl">
        <div className="relative min-h-0 flex-1 px-5 pt-5 [@media(max-height:820px)]:pt-3">
          <div aria-hidden="true" className="absolute left-1/2 top-1/2 h-24 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-400/15 blur-2xl" />
          {feature.image && (
            <div className="relative h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.04]">
              <Image src={feature.image} alt="" fill sizes="320px" className="object-contain" />
            </div>
          )}
        </div>
        <div className="shrink-0 px-5 pb-5 pt-3 lg:px-6 lg:pb-6 [@media(max-height:820px)]:lg:px-5 [@media(max-height:820px)]:pb-4 [@media(max-height:820px)]:pt-2">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-400">{cardIndex(index)}</div>
          <h3 className="text-sm font-semibold tracking-tight text-white lg:text-base [@media(max-height:820px)]:lg:text-sm">{feature.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-white/70 lg:text-[13px]">{feature.desc}</p>
        </div>
      </div>
    </div>
  );

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
          {features.map((feature, index) => (
            <div data-fx="card" key={feature.title}>{renderMobileCard(feature, index)}</div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <ScrollCue targetId="how" label={t('cues.nextTo', { section: t('nav.how') })} />
        </div>

        {/* CTA */}
        <div className="mt-12 text-center py-12 border-t border-white/10">
          <Image
            src="/brand/logo/eleva-360-stacked-color.svg"
            alt="eleva 360°"
            width={877}
            height={906}
            className="logo-light mx-auto mb-6 h-auto w-24"
          />
          <Image
            src="/brand/logo/eleva-360-stacked-reverse.svg"
            alt=""
            width={877}
            height={906}
            className="logo-dark mx-auto mb-6 h-auto w-24"
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
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-medium text-on-accent transition-colors hover:bg-brand-700"
          >
            {t('nav.requestDemo')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
          <NextLink
            href={platformHref}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm text-white/85 transition hover:bg-white/10"
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
          <div data-fx="card" className="mt-6">
            <HowIllustration className="mx-auto h-auto w-full max-w-sm" />
          </div>
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
        <div ref={headerRef} className="absolute top-0 left-0 right-0 z-10 pt-[clamp(4.75rem,11vh,6rem)] pb-6 px-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-[clamp(1.5rem,3.8vh,1.875rem)] font-semibold text-white">{t('features.title')}</h2>
            <p className="mt-3 text-white/70 max-w-2xl [@media(max-height:820px)]:mt-2 [@media(max-height:820px)]:text-sm">{t('features.sub')}</p>
          </div>
        </div>

        <div className="h-full flex items-center pt-[clamp(10rem,25vh,12rem)] pb-[clamp(4.5rem,11vh,6rem)]">
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
                className="flex-shrink-0 flex flex-col gap-3 lg:gap-5 [@media(max-height:820px)]:lg:gap-3 items-center justify-center w-[clamp(260px,20vw,340px)]"
              >
                {pair.map((feature, cardIndex) => (
                  <div key={feature.title}>
                    {renderCard(feature, cardIndex === 0 ? 'top' : 'bottom', pairIndex * 2 + cardIndex)}
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
                  src="/brand/logo/eleva-360-stacked-color.svg"
                  alt="eleva 360°"
                  width={877}
                  height={906}
                  className="logo-light mb-8 h-auto w-28"
                />
                <Image
                  src="/brand/logo/eleva-360-stacked-reverse.svg"
                  alt=""
                  width={877}
                  height={906}
                  className="logo-dark mb-8 h-auto w-28"
                />
                <h2 className="text-3xl font-semibold text-white text-center mb-4">{ctaText}</h2>
                <p className="text-base text-white/70 text-center mb-8 max-w-[280px]">{ctaDesc}</p>
                <a
                  href="#demo"
                  onClick={navClick('demo')}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-medium text-on-accent transition hover:bg-brand-700"
                >
                  {t('nav.requestDemo')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </a>
                <NextLink
                  href={platformHref}
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm text-white/85 transition hover:bg-white/10"
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
                    {/* Steps on the left, the schematic of the three steps on the right */}
                    <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-center">
                      <div className="grid gap-4">
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
                      <div data-fx="card" className="flex justify-center lg:justify-end">
                        <HowIllustration className="h-auto w-full max-w-[520px]" />
                      </div>
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

      </div>
      </section>
    </div>
  );
}
