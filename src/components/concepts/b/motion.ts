'use client';

import { useEffect, useState, type RefObject } from 'react';
import { gsap, ScrollSmoother, ScrollTrigger, SplitText } from '@/components/concepts/shared/gsapSetup';

/** Shared easing vocabulary (registered in gsapSetup). */
export const EASE = { reveal: 'reveal', snap: 'snap', settle: 'settle' } as const;

/** Media conditions for gsap.matchMedia(). Motion never runs under reduced motion. */
export const MQ = {
  motion: '(prefers-reduced-motion: no-preference)',
  desktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
  md: '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
  mobile: '(max-width: 767.98px) and (prefers-reduced-motion: no-preference)',
  stacked: '(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)',
  /** Cap. 02 pinned assembly: the stage is a full viewport, so it needs width AND height. */
  pin: '(min-width: 1024px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)',
  /** Everything that is not the pinned assembly (narrow OR short), with motion. */
  stack:
    '(max-width: 1023.98px) and (prefers-reduced-motion: no-preference), (min-width: 1024px) and (max-height: 759.98px) and (prefers-reduced-motion: no-preference)',
  reduced: '(prefers-reduced-motion: reduce)',
} as const;

/** Flips to true once the concept's web fonts are ready (with a safety timeout). */
export function useFontsReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    const done = () => {
      if (alive) setReady(true);
    };
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(done, done);
    } else {
      done();
    }
    // Short safety timeout: fonts are self-hosted and preloaded, so a late `ready` means
    // something is wrong; better to reveal with fallback metrics than to keep the page blank.
    const t = window.setTimeout(done, 1200);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, []);
  return ready;
}

export type SplitTween = (self: SplitText) => gsap.core.Tween | gsap.core.Timeline;

/**
 * Elements whose split reveal has already started. `autoSplit` re-splits on
 * every resize that changes the line count; a re-split of a played element
 * restores the final state instead of replaying the reveal in place.
 */
const played = new WeakSet<Element>();

function maskedSplit(el: Element, type: 'lines' | 'words', tween: SplitTween): SplitText {
  const lines = type === 'lines';
  return SplitText.create(el, {
    type,
    mask: type,
    ...(lines ? { linesClass: 'b-line' } : { wordsClass: 'b-word' }),
    autoSplit: true,
    onSplit: (self) => {
      gsap.set(self.masks, { paddingBottom: '0.14em', marginBottom: '-0.14em' });
      gsap.set(el, { opacity: 1 });
      if (played.has(el)) return gsap.set(lines ? self.lines : self.words, { yPercent: 0, autoAlpha: 1 });
      const tw = tween(self);
      tw.eventCallback('onStart', () => {
        played.add(el);
      });
      return tw;
    },
  });
}

/**
 * Masked line split. The mask gets 0.14em of padding so Fraunces descenders and
 * italics are never clipped. The element's `r-text` start state (opacity 0)
 * is lifted here; the lines themselves wait inside their masks.
 */
export function splitLines(el: Element, tween: SplitTween): SplitText {
  return maskedSplit(el, 'lines', tween);
}

/** Masked word split (same contract as splitLines). */
export function splitWords(el: Element, tween: SplitTween): SplitText {
  return maskedSplit(el, 'words', tween);
}

type DrawOpts = { duration?: number; delay?: number; axis?: 'x' | 'y'; ease?: string };

/** Draws a hairline from its origin. Lifts the `.r-rule` / `.r-rule-v` start state (autoAlpha 1). */
export function drawRule(el: gsap.TweenTarget, opts: DrawOpts = {}): gsap.core.Tween {
  const { duration = 0.8, delay = 0, axis = 'x', ease = EASE.reveal } = opts;
  const from = axis === 'x' ? { scaleX: 0, autoAlpha: 1 } : { scaleY: 0, autoAlpha: 1 };
  const to = axis === 'x' ? { scaleX: 1, duration, delay, ease } : { scaleY: 1, duration, delay, ease };
  return gsap.fromTo(el, from, to);
}

type CountOpts = {
  from?: number;
  duration?: number;
  decimals?: number;
  ease?: string;
  suffix?: string;
  prefix?: string;
};

/**
 * Mechanical counter. Writes the "from" value immediately (and un-hides
 * `.r-count`) so scrubbed timelines start from a legible state.
 */
export function countTo(el: HTMLElement, to: number, opts: CountOpts = {}): gsap.core.Tween {
  const { from = 0, duration = 1.2, decimals = 0, ease = EASE.settle, suffix = '', prefix = '' } = opts;
  const proxy = { v: from };
  const fmt = (v: number) => `${prefix}${v.toFixed(decimals)}${suffix}`;
  el.textContent = fmt(from);
  gsap.set(el, { opacity: 1 });
  return gsap.to(proxy, {
    v: to,
    duration,
    ease,
    snap: { v: 1 / Math.pow(10, decimals) },
    onUpdate: () => {
      el.textContent = fmt(proxy.v);
    },
  });
}

/** Smooth scroll to an anchor from OUTSIDE <SmoothScroll> (the fixed masthead). */
export function scrollToId(id: string, offset = 80): void {
  const el = document.querySelector(id);
  if (!el) return;
  const s = ScrollSmoother.get();
  if (s) {
    s.scrollTo(el, true, `top ${offset}px`);
  } else {
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
  }
}

/**
 * Keyboard users: when focus lands inside a section, every once-trigger of that
 * section that has not fired yet jumps to its end (animation complete, batch
 * callback run) so the focused control and the content around it are readable
 * at once, instead of waiting for ScrollSmoother to carry the trigger past its
 * start. Scrubbed and pinned triggers are left alone.
 */
function revealOnFocus(root: HTMLElement): () => void {
  const onFocusIn = () => {
    ScrollTrigger.getAll().forEach((st) => {
      const trigger = st.trigger;
      if (!st.vars.once || !(trigger instanceof Element) || !root.contains(trigger) || st.isActive || st.progress > 0) return;
      if (st.animation) st.animation.progress(1);
      else if (typeof st.vars.onEnter === 'function') st.vars.onEnter(st);
      // Spent: drop the trigger, keep the (finished) animation.
      st.kill(false, true);
    });
  };
  root.addEventListener('focusin', onFocusIn);
  return () => root.removeEventListener('focusin', onFocusIn);
}

/** Motion contexts alive on the page (for the <html> reveal stamps). */
let liveContexts = 0;

let refreshRaf = 0;
/** rAF-debounced ScrollTrigger.refresh() for image loads and layout changes. */
export function refreshSoon(): void {
  if (typeof window === 'undefined' || refreshRaf) return;
  refreshRaf = window.requestAnimationFrame(() => {
    refreshRaf = 0;
    ScrollTrigger.refresh();
  });
}

export type MotionKit = {
  root: HTMLElement;
  mm: gsap.MatchMedia;
  q: <T extends Element = HTMLElement>(selector: string, scope?: Element | null) => T[];
  splitLines: (el: Element, tween: SplitTween) => SplitText;
  splitWords: (el: Element, tween: SplitTween) => SplitText;
  isMobile: () => boolean;
};

/**
 * One gsap.context per component, built once fonts are ready, reverted on
 * unmount (tweens, ScrollTriggers, matchMedia and SplitText instances).
 * `build` must be referentially stable (useCallback with []), reading its
 * inputs from refs and data-* attributes.
 */
export function useMotion(ref: RefObject<HTMLElement | null>, build: (kit: MotionKit) => void): void {
  const fontsReady = useFontsReady();
  useEffect(() => {
    const root = ref.current;
    if (!root || !fontsReady) return;
    // The bundle has reported in: keep (or restore) the CSS start states that the
    // layout's gate script stamps before first paint, and cancel its no-bundle fallback.
    const html = document.documentElement;
    html.setAttribute('data-b-js', '');
    html.setAttribute('data-b-motion', '');
    liveContexts += 1;
    const splits: SplitText[] = [];
    let mm: gsap.MatchMedia | null = null;
    const ctx = gsap.context(() => {
      mm = gsap.matchMedia();
      build({
        root,
        mm,
        q: <T extends Element = HTMLElement>(selector: string, scope?: Element | null) =>
          gsap.utils.toArray<T>(selector, scope ?? root),
        splitLines: (el, tween) => {
          const s = splitLines(el, tween);
          splits.push(s);
          return s;
        },
        splitWords: (el, tween) => {
          const s = splitWords(el, tween);
          splits.push(s);
          return s;
        },
        isMobile: () => window.matchMedia('(max-width: 767.98px)').matches,
      });
    }, root);
    const offFocus = revealOnFocus(root);
    return () => {
      offFocus();
      mm?.revert();
      ctx.revert();
      splits.forEach((s) => s.revert());
      liveContexts -= 1;
      if (liveContexts === 0) {
        html.removeAttribute('data-b-motion');
        html.removeAttribute('data-b-js');
      }
    };
  }, [ref, build, fontsReady]);
}
