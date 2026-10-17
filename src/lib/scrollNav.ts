/**
 * Page navigation for the live landing page.
 *
 * The Features stage (desktop) is pinned and scrubbed, so its content has no
 * stable document position: `scrollIntoView()` cannot land on `#how`,
 * `#security`, ... at all. Instead the stage registers a *resolver* for each
 * anchor - a function, so it re-reads live values (ScrollTrigger `start`,
 * `offsetTop`, ...) after every resize / refresh - and `goTo()` tweens the
 * window scroll position to it. Because the pin is scrubbed, travelling
 * through it plays the reveal animations on the way in. Plain sections such
 * as `#demo` register nothing: `resolveY` falls back to their element.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

type Resolver = () => number;

const anchors = new Map<string, Resolver>();

/** Anchors that keep animating after arrival: land, then play the reveal. */
const AUTO_REVEAL: Record<string, string> = { features: 'features-revealed' };

const PROGRAMMATIC_CLASS = 'is-programmatic-scroll';
const MOBILE_BREAKPOINT = 768;
const REVEAL_DURATION = 1.4;

let activeTween: gsap.core.Tween | null = null;

const clamp = (min: number, value: number, max: number) => Math.max(min, Math.min(value, max));

/** A pinned section tells the page where one of its sub-sections becomes visible. */
export function registerAnchor(id: string, resolver: Resolver) {
  anchors.set(id, resolver);
}

export function unregisterAnchor(id: string) {
  anchors.delete(id);
}

/**
 * Shared by the landing's reveal animations: when it is true they render their
 * final state and create no scrubbed windows at all.
 */
export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function headerOffset() {
  const header = document.querySelector('header');
  return (header ? header.getBoundingClientRect().height : 0) + 8;
}

function clampToPage(y: number) {
  return clamp(0, y, Math.max(0, document.documentElement.scrollHeight - window.innerHeight));
}

/** Under 768px the mobile twin of a section (`how-mobile`) is the real target. */
function candidateIds(id: string) {
  return window.innerWidth < MOBILE_BREAKPOINT ? [`${id}-mobile`, id] : [id];
}

/** Absolute window scroll position that shows `id`, or null when unknown. */
function resolveY(id: string): number | null {
  for (const key of candidateIds(id)) {
    const resolver = anchors.get(key);
    if (resolver) return clampToPage(resolver());

    const el = document.getElementById(key);
    // getClientRects() is empty for the hidden desktop twin of a mobile section
    if (el && el.getClientRects().length > 0) {
      return clampToPage(el.getBoundingClientRect().top + window.scrollY - headerOffset());
    }
  }
  return null;
}

function tweenTo(y: number, duration: number, ease: string, onArrive?: () => void) {
  const root = document.documentElement;
  activeTween?.kill();
  root.classList.add(PROGRAMMATIC_CLASS);

  const release = () => root.classList.remove(PROGRAMMATIC_CLASS);

  activeTween = gsap.to(window, {
    duration,
    ease,
    overwrite: 'auto',
    // autoKill lets a wheel/touch gesture take the scroll back at any moment
    scrollTo: { y, autoKill: true },
    onInterrupt: release,
    onComplete: () => {
      release();
      onArrive?.();
    },
  });
}

/** Scroll to a section, playing every scrubbed reveal on the way. */
export function goTo(id: string) {
  if (typeof window === 'undefined') return;

  const y = resolveY(id);
  if (y === null) return;

  // Deep links keep working without the browser jumping anywhere. Internal
  // waypoints (`features-pair-2`, ...) have no element, so they stay out of the URL.
  if (document.getElementById(id)) {
    const { pathname, search } = window.location;
    history.replaceState(null, '', `${pathname}${search}#${id}`);
  }

  const revealId = AUTO_REVEAL[id];

  // The layout can move while we travel: on a deep-link load the pinned stage
  // inserts its spacer a moment after the first measurement, and the page
  // grows by several screens. So the target is resolved again on arrival and
  // corrected once when it has moved.
  const CORRECTION_TOLERANCE = 8;

  if (prefersReducedMotion()) {
    window.scrollTo(0, y);
    requestAnimationFrame(() => {
      const settled = resolveY(id);
      if (settled !== null && Math.abs(settled - window.scrollY) > CORRECTION_TOLERANCE) {
        window.scrollTo(0, settled);
      }
    });
    return;
  }

  const distance = Math.abs(y - window.scrollY);
  const duration = clamp(0.8, distance / 2500, 2.2);

  const afterArrival = () => {
    if (!revealId) return;
    // Keep scrolling on the user's behalf so the cards reveal themselves.
    const revealY = resolveY(revealId);
    if (revealY !== null && revealY > window.scrollY) {
      tweenTo(revealY, REVEAL_DURATION, 'power1.out');
    }
  };

  tweenTo(y, duration, 'power2.inOut', () => {
    const settled = resolveY(id);
    if (settled !== null && Math.abs(settled - window.scrollY) > CORRECTION_TOLERANCE) {
      const remaining = Math.abs(settled - window.scrollY);
      tweenTo(settled, clamp(0.5, remaining / 2500, 1.6), 'power2.inOut', afterArrival);
      return;
    }
    afterArrival();
  });
}

/**
 * Which block the pinned Features stage is currently showing.
 *
 * The how/security/faq blocks live inside a GSAP-translated column, so
 * their document offsets are meaningless to ScrollTrigger: anything that wants
 * to react to them (the animated background palette) subscribes here and the
 * stage's own onUpdate is what publishes.
 */
type SectionListener = (id: string) => void;

const sectionListeners = new Set<SectionListener>();
let activeSection = 'hero';

export function setActiveSection(id: string) {
  if (id === activeSection) return;
  activeSection = id;
  sectionListeners.forEach((listener) => listener(id));
}

/** Subscribe to `setActiveSection`; returns the unsubscribe. */
export function onActiveSection(listener: SectionListener) {
  sectionListeners.add(listener);
  return () => {
    sectionListeners.delete(listener);
  };
}

/**
 * The page's one floating cue (src/components/FloatingCue.tsx) is fixed to the
 * bottom of the viewport and travels with the reader; whoever knows what comes
 * next publishes it here. `target` is the anchor the cue goes to (null hides
 * it); `parked` is true while the pinned stage has its CTA column on the left,
 * so the cue moves into that column instead of sitting on the content.
 */
export type CueState = { target: string | null; parked: boolean };

type CueListener = (state: CueState) => void;

const cueListeners = new Set<CueListener>();
let cueState: CueState = { target: 'features', parked: false };

export function setCue(next: Partial<CueState>) {
  const merged = { ...cueState, ...next };
  if (merged.target === cueState.target && merged.parked === cueState.parked) return;
  cueState = merged;
  cueListeners.forEach((listener) => listener(cueState));
}

/** Subscribe to `setCue` (called once with the current state); returns the unsubscribe. */
export function onCue(listener: CueListener) {
  cueListeners.add(listener);
  listener(cueState);
  return () => {
    cueListeners.delete(listener);
  };
}

/** `onClick` for a real <a href="#id">: keeps the anchor, hijacks the jump. */
export function navClick(id: string) {
  return (event: { preventDefault: () => void }) => {
    event.preventDefault();
    goTo(id);
  };
}

/**
 * Deep link on arrival: settle the layout, then travel (and reveal).
 *
 * Called once per landing *mount*, not once per page load: a client-side
 * navigation from `/platform` back to `/#demo` keeps the same JS runtime, so a
 * module-level one-shot flag would swallow every cross-page CTA. Header owns
 * the per-mount guard.
 */
export function initHashNavigation() {
  if (typeof window === 'undefined') return;

  const id = decodeURIComponent(window.location.hash.slice(1));
  if (!id) return;

  void Promise.resolve(document.fonts?.ready).then(() => {
    requestAnimationFrame(() => {
      // The browser already jumped to the raw anchor; travel from the top instead.
      window.scrollTo(0, 0);
      ScrollTrigger.refresh();
      requestAnimationFrame(() => goTo(id));
    });
  });
}
