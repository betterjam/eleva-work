'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode, type RefObject } from 'react';
import { gsap, ScrollTrigger } from '@/components/concepts/shared/gsapSetup';
import { ActiveSectionContext } from '../ActiveSection';
import DirectorDebug from './DirectorDebug';
import {
  ACTIVE_LINE,
  CONTINUE_ENTER_AT,
  EXIT,
  HOLD_DWELL,
  HOLD_MIN_WIDTH,
  HOLD_TOP,
  MIN_WINDOW,
  RULE_SPANS,
  SCRUB,
  SECTIONS,
  resolveSpec,
  specFor,
  type ResolvedSpec,
  type SectionMode,
  type Transition,
} from './sections';

/* ------------------------------------------------------------------ */
/* Public types                                                         */
/* ------------------------------------------------------------------ */

export type BeatOptions = {
  /** Window start for this beat (% of the viewport height); default: the section's `enterAt`. */
  enterAt?: number;
  /** Window end for this beat; default: the section's `settleAt`. */
  settleAt?: number;
  /** Un-reveal on scroll up; default: the section's `reversible`. */
  reversible?: boolean;
  /** Debug label (default: the element id, else `<section>#<n>`). */
  id?: string;
};

/**
 * How the director drives a beat:
 * - pending: registered, not built yet (fonts not ready) — or released between two builds.
 * - window: its own scrubbed ScrollTrigger (`clamp(top enterAt%)` → `clamp(top settleAt%)`).
 * - hold: appended to its section's pinned intro timeline.
 * - self: inside the `[data-rv-manual]` stage of a `self` section — ignored, the section drives it.
 * - static: completed at once (reduced motion, hidden variant, empty timeline, or focus-locked
 *   before the build).
 */
export type BeatDriver = 'pending' | 'window' | 'hold' | 'self' | 'static';

export type BeatSnapshot = {
  id: string;
  section: string | null;
  mode: BeatDriver;
  /** Current `getBoundingClientRect().top` of the beat element. */
  top: number;
  /** The beat timeline's progress, 0–1. */
  progress: number;
  locked: boolean;
  /** True while the beat's hold pin is active (the block is parked under the header, drawing). */
  held: boolean;
};

export type SectionSnapshot = {
  id: string;
  /** Configured mode. */
  mode: SectionMode;
  /** Mode in force after the last build (a hold degrades to flow under 768px, reduced motion, no `[data-hold]`). */
  effective: SectionMode;
  next: Transition;
  tracked: boolean;
};

export type DirectorSurface = {
  sections: SectionSnapshot[];
  /** Ids of the sections whose hold pin exists right now. */
  holds: string[];
  beats: () => BeatSnapshot[];
  refresh: () => void;
};

declare global {
  interface Window {
    __elevaDirector?: DirectorSurface;
  }
}

export type DirectorApi = {
  /**
   * Hand a reveal timeline to the director. Returns the unregister function.
   * The timeline must be paused and self-contained (no scrollTrigger of its own); its total
   * duration is irrelevant — the driver maps 0→1 across it — so durations are proportions.
   */
  registerBeat: (el: HTMLElement, tl: gsap.core.Timeline, opts?: BeatOptions) => () => void;
  /** Resolved configuration of a section id (defaults for unknown ids). */
  spec: (sectionId: string) => ResolvedSpec;
};

/* ------------------------------------------------------------------ */
/* Engine                                                               */
/* ------------------------------------------------------------------ */

type Beat = {
  el: HTMLElement;
  tl: gsap.core.Timeline;
  opts: BeatOptions;
  label: string;
  section: SectionState | null;
  driver: BeatDriver;
  trigger: ScrollTrigger | null;
  locked: boolean;
  offFocus: () => void;
};

type RuleState = { el: HTMLElement; trigger: ScrollTrigger | null; reversible: boolean; lock: () => void };

type SectionState = {
  spec: ResolvedSpec;
  el: HTMLElement;
  index: number;
  effective: SectionMode;
  holdEl: HTMLElement | null;
  holdTl: gsap.core.Timeline | null;
  holdDriver: gsap.core.Tween | null;
  holdTrigger: ScrollTrigger | null;
  /** Monotonic progress of the hold (never decreases unless the section is reversible). */
  holdFloor: number;
  exitTween: gsap.core.Tween | null;
  exitBeat: Beat | null;
  rules: RuleState[];
};

const IS_DEV = process.env.NODE_ENV !== 'production';
const warn = (...args: unknown[]) => {
  if (IS_DEV) console.warn('[director]', ...args);
};

const domOrder = (a: Element, b: Element) =>
  a === b ? 0 : a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;

const visible = (el: Element) => el.getClientRects().length > 0;

const headerHeight = () => document.querySelector<HTMLElement>('.a-header')?.offsetHeight || 56;

function toPx(distance: string | number): number {
  if (typeof distance === 'number') return distance;
  const n = parseFloat(distance);
  if (Number.isNaN(n)) return window.innerHeight * 0.6;
  if (distance.endsWith('vh')) return (n / 100) * window.innerHeight;
  if (distance.endsWith('vw')) return (n / 100) * window.innerWidth;
  return n;
}

/** Kill a trigger without reverting or killing its animation (the beat keeps its rendered state). */
function dropTrigger(st: ScrollTrigger) {
  st.getTween()?.kill();
  st.kill(false, true);
}

/**
 * The director proper. Created once per page (in a React state initialiser: no window
 * access until `mount`). Beats can register at any time: before the build they queue,
 * after it they are placed on the next microtask.
 *
 * Lifecycle is explicit on purpose: nothing here is created inside a `gsap.context` or a
 * `gsap.matchMedia`, because both revert every ScrollTrigger they recorded with
 * `kill(true)`, which also reverts AND kills the trigger's animation — and a window's
 * animation is the beat's own timeline, which must survive a media-change rebuild.
 * Late work runs on a microtask for the same reason: `registerBeat` is usually called
 * from inside a component's own context.
 */
export class DirectorEngine {
  private beats: Beat[] = [];
  private sections: SectionState[] = [];
  private byEl = new Map<Element, SectionState>();
  private lockedRules = new WeakSet<HTMLElement>();
  private activeTriggers: ScrollTrigger[] = [];
  private mqs: MediaQueryList[] = [];
  private main: HTMLElement | null = null;
  private setActive: (id: string) => void = () => {};
  private mounted = false;
  /** True while a motion build is in place (windows, holds, transitions exist). */
  private live = false;
  private motion = true;
  private holdsOn = false;
  private raf = 0;
  private counter = 0;

  /* ---------- registry ---------- */

  register(el: HTMLElement, tl: gsap.core.Timeline, opts: BeatOptions = {}): () => void {
    const sectionId = (el.closest('[data-section]') as HTMLElement | null)?.dataset.section ?? 'page';
    const beat: Beat = {
      el,
      tl,
      opts,
      label: opts.id ?? (el.id || `${sectionId}#${++this.counter}`),
      section: null,
      driver: 'pending',
      trigger: null,
      locked: false,
      offFocus: () => {},
    };
    // Keyboard: focus inside a beat locks it (progress 1) so the focused control is visible.
    const onFocus = () => this.lock(beat);
    el.addEventListener('focusin', onFocus);
    beat.offFocus = () => el.removeEventListener('focusin', onFocus);
    this.beats.push(beat);

    if (this.live) {
      queueMicrotask(() => {
        if (!this.live || !this.beats.includes(beat) || beat.driver !== 'pending') return;
        this.place(beat);
        const s = beat.section;
        if (s && s.spec.next === 'cut') this.buildExit(s);
        this.refreshSoon();
      });
    } else if (this.mounted && !this.motion) {
      this.settle(beat);
    }
    return () => this.unregister(beat);
  }

  private unregister(beat: Beat) {
    const i = this.beats.indexOf(beat);
    if (i < 0) return;
    this.beats.splice(i, 1);
    beat.offFocus();
    this.release(beat);
    const s = beat.section;
    if (s && s.exitBeat === beat) queueMicrotask(() => this.buildExit(s));
  }

  /** Drop a beat's driver (window trigger or hold membership) without touching its rendered state. */
  private release(beat: Beat) {
    if (beat.trigger) {
      const st = beat.trigger;
      beat.trigger = null;
      dropTrigger(st);
    }
    if (beat.driver === 'hold' && beat.section?.holdTl) {
      beat.section.holdTl.remove(beat.tl);
      beat.tl.pause();
    }
    beat.driver = 'pending';
  }

  /* ---------- lifecycle ---------- */

  mount(main: HTMLElement, setActive: (id: string) => void) {
    this.main = main;
    this.setActive = setActive;
    this.mounted = true;
    this.readSections();
    // Crossing 768px or toggling reduced motion tears the build down and rebuilds it from
    // the registry; locked beats stay locked.
    this.mqs = [
      window.matchMedia(`(min-width: ${HOLD_MIN_WIDTH}px)`),
      window.matchMedia('(prefers-reduced-motion: no-preference)'),
    ];
    this.mqs.forEach((mq) => mq.addEventListener('change', this.onMedia));
    this.onMedia();
  }

  unmount() {
    this.mounted = false;
    if (this.raf) {
      window.cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    this.mqs.forEach((mq) => mq.removeEventListener('change', this.onMedia));
    this.mqs = [];
    this.teardown();
    this.beats.forEach((b) => this.release(b));
    this.sections.forEach((s) => delete s.el.dataset.mode);
    this.sections = [];
    this.byEl.clear();
    delete window.__elevaDirector;
    this.main = null;
  }

  private onMedia = () => {
    if (!this.mounted) return;
    this.teardown();
    this.holdsOn = this.mqs[0].matches && this.mqs[1].matches;
    this.motion = this.mqs[1].matches;
    this.build();
  };

  private readSections() {
    const main = this.main;
    if (!main) return;
    const els = Array.from(main.querySelectorAll<HTMLElement>('[data-section]'));
    this.sections = els.map((el, index) => {
      const id = el.dataset.section ?? '';
      const known = SECTIONS.find((s) => s.id === id);
      if (!known) warn(`section "${id}" is not in SECTIONS; using defaults (flow, cut)`);
      const spec = resolveSpec(known ?? { id });
      el.dataset.mode = spec.mode;
      return {
        spec,
        el,
        index,
        effective: spec.mode,
        holdEl: null,
        holdTl: null,
        holdDriver: null,
        holdTrigger: null,
        holdFloor: 0,
        exitTween: null,
        exitBeat: null,
        rules: [],
      };
    });
    this.byEl = new Map(this.sections.map((s) => [s.el, s]));
    const dom = this.sections.map((s) => s.spec.id);
    const configured = SECTIONS.map((s) => s.id).filter((id) => dom.includes(id));
    if (configured.join() !== dom.filter((id) => configured.includes(id)).join()) {
      warn('SECTIONS order differs from the DOM order; the DOM order decides adjacency');
    }
  }

  /* ---------- build / teardown ---------- */

  private build() {
    if (!this.main) return;

    /* Active section (header counter + nav): not motion, always on. Refreshed after every
       pin (priority −1) so a section's end includes the pin spacers inside it. */
    this.activeTriggers = this.sections
      .filter((s) => s.spec.track)
      .map((s) =>
        ScrollTrigger.create({
          trigger: s.el,
          start: `top ${ACTIVE_LINE}`,
          end: `bottom ${ACTIVE_LINE}`,
          refreshPriority: -1,
          onToggle: (self) => {
            if (self.isActive) this.setActive(s.spec.id);
          },
        })
      );

    if (!this.motion) {
      // Reduced motion: no windows, no holds, no exits. CSS renders the final states; beats
      // that were registered anyway (custom timelines) are completed.
      this.sections.forEach((s) => {
        s.effective = s.spec.mode === 'hold' ? 'flow' : s.spec.mode;
        s.el.querySelectorAll('.a-rule[data-rule-pending]').forEach((r) => r.removeAttribute('data-rule-pending'));
      });
      this.beats.forEach((b) => this.settle(b));
      this.live = false;
      ScrollTrigger.refresh();
      this.expose();
      return;
    }

    // 1. Hold timelines (so beats inside a [data-hold] block can join them).
    this.sections.forEach((s) => this.prepareHold(s));
    // 2. Beats, in DOM order.
    [...this.beats].sort((a, b) => domOrder(a.el, b.el)).forEach((b) => this.place(b));
    // 3. Hold pins, in DOM order (pin spacers are measured in creation order).
    this.sections.forEach((s) => this.finishHold(s));
    // 4. Transitions: rule draws into each section, exits out of `cut` sections.
    // The engine must already be live here: `buildExit` refuses to build while it is not,
    // and nothing in `register()` runs synchronously during build (its late path is a
    // queued microtask), so flipping the flag early has no other effect.
    this.live = true;
    this.sections.forEach((s) => {
      this.buildRules(s);
      this.buildExit(s);
    });

    ScrollTrigger.addEventListener('refresh', this.sweep);
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    this.expose();
  }

  private teardown() {
    this.live = false;
    ScrollTrigger.removeEventListener('refresh', this.sweep);
    this.activeTriggers.forEach((st) => st.kill());
    this.activeTriggers = [];
    // Beats first: their timelines leave the hold timelines intact (a killed hold timeline
    // must be empty) and a window trigger is dropped without reverting its animation.
    this.beats.forEach((b) => this.release(b));
    this.sections.forEach((s) => {
      if (s.exitTween) {
        if (s.exitTween.scrollTrigger) s.exitTween.scrollTrigger.kill(true);
        else s.exitTween.revert();
      }
      s.exitTween = null;
      s.exitBeat = null;
      // A rule mid-draw reverts to its final state (the attribute is gone) and is rebuilt.
      s.rules.forEach((r) => r.trigger?.kill(true));
      s.rules = [];
      s.holdTrigger?.kill(true);
      s.holdTrigger = null;
      s.holdDriver?.kill();
      s.holdDriver = null;
      s.holdTl?.kill();
      s.holdTl = null;
      s.holdEl = null;
      s.holdFloor = 0;
      s.effective = s.spec.mode;
    });
    this.expose();
  }

  /* ---------- beats ---------- */

  private place(beat: Beat) {
    const sectionEl = beat.el.closest('[data-section]');
    const s = sectionEl ? (this.byEl.get(sectionEl) ?? null) : null;
    beat.section = s;
    const spec = s?.spec ?? resolveSpec();

    // A `self` section drives everything inside its manual stage; never double-drive it.
    if (s && spec.mode === 'self') {
      const manual = beat.el.closest('[data-rv-manual]');
      if (manual && s.el.contains(manual)) {
        beat.driver = 'self';
        warn(`beat "${beat.label}" sits inside the manual stage of self section "${spec.id}"; ignored`);
        return;
      }
    }
    // Focus-locked while pending, a hidden variant (display: none) or an empty timeline:
    // complete at once so nothing is ever left invisible.
    if (beat.locked || !visible(beat.el) || beat.tl.duration() === 0) {
      this.settle(beat);
      return;
    }
    if (s && s.effective === 'hold' && s.holdTl && s.holdEl && s.holdEl.contains(beat.el)) {
      const holdTl = s.holdTl;
      holdTl.add(beat.tl, holdTl.duration());
      // A paused child is skipped by its parent's render; unpause AFTER nesting so it never
      // plays on the global timeline.
      beat.tl.paused(false);
      beat.driver = 'hold';
      return;
    }
    this.makeWindow(beat, spec, s);
  }

  private settle(beat: Beat) {
    beat.locked = true;
    beat.driver = 'static';
    beat.tl.progress(1);
  }

  private isFirstBeat(beat: Beat, s: SectionState) {
    const first = this.beats
      .filter((b) => visible(b.el) && b.el.closest('[data-section]') === s.el)
      .sort((a, b) => domOrder(a.el, b.el))[0];
    return first === beat;
  }

  private makeWindow(beat: Beat, spec: ResolvedSpec, s: SectionState | null) {
    const settleAt = beat.opts.settleAt ?? spec.settleAt;
    let enterAt = beat.opts.enterAt ?? spec.enterAt;
    // `continue` into this section: its first beat starts as soon as it enters the viewport.
    if (beat.opts.enterAt === undefined && s && s.index > 0 && this.sections[s.index - 1].spec.next === 'continue' && this.isFirstBeat(beat, s)) {
      enterAt = CONTINUE_ENTER_AT;
    }
    enterAt = Math.max(enterAt, settleAt + MIN_WINDOW);
    const reversible = beat.opts.reversible ?? spec.reversible;
    // Lock at completion: onLeave covers scrolling (a jump across the whole window in one
    // tick fires onEnter then onLeave); the global refresh sweep covers refreshes, during
    // which callbacks are muted; the check after creation covers a trigger born already
    // past its end.
    const st = ScrollTrigger.create({
      trigger: beat.el,
      start: `clamp(top ${enterAt}%)`,
      end: `clamp(top ${settleAt}%)`,
      scrub: SCRUB,
      animation: beat.tl,
      invalidateOnRefresh: true,
      refreshPriority: -1,
      onLeave: reversible ? undefined : () => this.lock(beat),
    });
    beat.trigger = st;
    beat.driver = 'window';
    if (!reversible && st.progress >= 1) this.lock(beat);
  }

  private isReversible(beat: Beat) {
    return beat.opts.reversible ?? beat.section?.spec.reversible ?? false;
  }

  /**
   * After every global refresh (callbacks are muted while it runs, and the per-trigger
   * onRefresh loop walks the live trigger list, so nothing may be killed from inside it):
   * lock whatever now sits past its settle line.
   */
  private sweep = () => {
    [...this.beats].forEach((b) => {
      if (b.trigger && !b.locked && !this.isReversible(b) && b.trigger.progress >= 1) this.lock(b);
    });
    this.sections.forEach((s) =>
      [...s.rules].forEach((r) => {
        if (r.trigger && !r.reversible && r.trigger.progress >= 1) r.lock();
      })
    );
  };

  /** Reveal completely and stay revealed: the trigger goes, the timeline sits at 1. */
  private lock(beat: Beat) {
    if (beat.locked || beat.driver === 'self') return;
    beat.locked = true;
    if (beat.driver === 'hold') {
      const s = beat.section;
      if (s) {
        s.holdFloor = 1;
        s.holdTl?.progress(1);
      }
      return;
    }
    if (beat.trigger) {
      const st = beat.trigger;
      beat.trigger = null;
      dropTrigger(st);
    }
    beat.tl.progress(1);
  }

  private refreshSoon() {
    if (this.raf) return;
    this.raf = window.requestAnimationFrame(() => {
      this.raf = 0;
      ScrollTrigger.refresh();
    });
  }

  /* ---------- holds ---------- */

  private prepareHold(s: SectionState) {
    s.effective = s.spec.mode;
    s.holdEl = null;
    s.holdTl = null;
    s.holdDriver = null;
    s.holdTrigger = null;
    s.holdFloor = 0;
    if (s.spec.mode !== 'hold') return;
    if (!this.holdsOn) {
      s.effective = 'flow';
      return;
    }
    const holdEl = s.el.querySelector<HTMLElement>('[data-hold]');
    if (!holdEl) {
      warn(`hold section "${s.spec.id}" has no [data-hold] block; flowing`);
      s.effective = 'flow';
      return;
    }
    const room = window.innerHeight - headerHeight() - HOLD_TOP;
    if (holdEl.offsetHeight > room) {
      warn(`[data-hold] of "${s.spec.id}" is ${holdEl.offsetHeight}px tall, more than the ${room}px under the header and its gap; flowing`);
      s.effective = 'flow';
      return;
    }
    s.holdEl = holdEl;
    s.holdTl = gsap.timeline({ paused: true });
  }

  private finishHold(s: SectionState) {
    const tl = s.holdTl;
    const holdEl = s.holdEl;
    if (!tl || !holdEl) return;
    const total = tl.duration();
    if (!total) {
      warn(`hold section "${s.spec.id}": no beats inside its [data-hold] block; flowing`);
      s.effective = 'flow';
      s.holdEl = null;
      s.holdTl = null;
      tl.kill();
      return;
    }
    // The intro draws across the first (1 − HOLD_DWELL) of the pin; the finished state then
    // sits for the rest, so the pin never releases mid-reveal (scrub lag included).
    tl.to({}, { duration: (total * HOLD_DWELL) / (1 - HOLD_DWELL) }, total);

    // The pin scrubs a proxy; the intro follows it monotonically, so scrolling back up
    // through the pin never un-reveals (unless the section is reversible).
    const proxy = { p: 0 };
    const apply = () => {
      if (!s.spec.reversible) s.holdFloor = Math.max(s.holdFloor, proxy.p);
      tl.progress(s.spec.reversible ? proxy.p : s.holdFloor);
    };
    s.holdDriver = gsap.to(proxy, { p: 1, duration: 1, ease: 'none', paused: true, onUpdate: apply });
    s.holdTrigger = ScrollTrigger.create({
      trigger: holdEl,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: SCRUB,
      animation: s.holdDriver,
      start: () => `top ${headerHeight() + HOLD_TOP}`,
      end: () => `+=${Math.round(toPx(s.spec.holdDistance))}`,
    });
  }

  /* ---------- transitions ---------- */

  private buildRules(s: SectionState) {
    const prev = s.index > 0 ? this.sections[s.index - 1] : null;
    const [from, to] = RULE_SPANS[prev ? prev.spec.next : 'cut'];
    s.rules = Array.from(s.el.querySelectorAll<HTMLElement>('.a-rule')).map((el) => {
      const rule: RuleState = { el, trigger: null, reversible: s.spec.reversible, lock: () => {} };
      // Already drawn, or a display:none variant (the other SystemSheet layout): final state.
      if (this.lockedRules.has(el) || !visible(el)) {
        el.removeAttribute('data-rule-pending');
        this.lockedRules.add(el);
        return rule;
      }
      const line = el.querySelector<HTMLElement>('.a-rule-line');
      const code = el.querySelector<HTMLElement>('.a-rule-code');
      const head = el.querySelector<HTMLElement>('.a-running');
      const tl = gsap.timeline({ paused: true });
      if (line) tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'reveal' }, 0);
      if (code) tl.fromTo(code, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)', duration: 0.4, ease: 'reveal' }, 0.3);
      if (head) tl.fromTo(head, { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0)', duration: 0.4, ease: 'reveal' }, 0.4);
      const ends = [code, head].filter((x): x is HTMLElement => !!x);
      if (ends.length) tl.set(ends, { clipPath: 'none' }, 0.8);
      // The tweens have rendered their start states inline: the CSS parking can go.
      el.removeAttribute('data-rule-pending');

      rule.lock = () => {
        if (this.lockedRules.has(el)) return;
        this.lockedRules.add(el);
        if (rule.trigger) {
          const st = rule.trigger;
          rule.trigger = null;
          dropTrigger(st);
        }
        tl.progress(1);
      };
      rule.trigger = ScrollTrigger.create({
        trigger: s.el,
        start: `clamp(top ${from}%)`,
        end: `clamp(top ${to}%)`,
        scrub: SCRUB,
        animation: tl,
        invalidateOnRefresh: true,
        refreshPriority: -1,
        onLeave: s.spec.reversible ? undefined : () => rule.lock(),
      });
      if (!s.spec.reversible && rule.trigger.progress >= 1) rule.lock();
      return rule;
    });
  }

  private buildExit(s: SectionState) {
    if (s.exitTween) {
      const tween = s.exitTween;
      s.exitTween = null;
      s.exitBeat = null;
      if (tween.scrollTrigger) tween.scrollTrigger.kill(true);
      else tween.revert();
    }
    if (!this.live || s.spec.next !== 'cut' || !this.sections[s.index + 1]) return;
    const last = this.beats
      .filter((b) => b.section === s && (b.driver === 'window' || b.driver === 'hold') && visible(b.el))
      .sort((a, b) => domOrder(a.el, b.el))
      .pop();
    if (!last) return;
    // A pinned block (ScrollSmoother pins by transform) or a parallax layer owns its
    // transform: dim those by opacity only.
    const transformSafe = !last.el.closest('[data-hold],[data-speed],[data-lag]');
    const from: gsap.TweenVars = { opacity: 1 };
    const to: gsap.TweenVars = { opacity: EXIT.opacity, ease: 'none', immediateRender: false };
    if (transformSafe) {
      from.y = 0;
      to.y = EXIT.y;
    }
    s.exitBeat = last;
    s.exitTween = gsap.fromTo(last.el, from, {
      ...to,
      scrollTrigger: {
        trigger: s.el,
        start: EXIT.start,
        end: EXIT.end,
        scrub: SCRUB,
        invalidateOnRefresh: true,
        refreshPriority: -1,
      },
    });
  }

  /* ---------- debug surface ---------- */

  snapshotSections(): SectionSnapshot[] {
    return this.sections.map((s) => ({
      id: s.spec.id,
      mode: s.spec.mode,
      effective: s.effective,
      next: s.spec.next,
      tracked: s.spec.track,
    }));
  }

  holds(): string[] {
    return this.sections.filter((s) => s.holdTrigger).map((s) => s.spec.id);
  }

  snapshotBeats(): BeatSnapshot[] {
    return this.beats.map((b) => {
      const s = b.section;
      return {
        id: b.label,
        section: s?.spec.id ?? (b.el.closest('[data-section]') as HTMLElement | null)?.dataset.section ?? null,
        mode: b.driver,
        top: b.el.getBoundingClientRect().top,
        progress: b.tl.duration() ? b.tl.progress() : 1,
        locked: b.locked || (b.driver === 'hold' && (s?.holdFloor ?? 0) >= 1),
        held: b.driver === 'hold' && !!s?.holdTrigger?.isActive,
      };
    });
  }

  private expose() {
    if (!this.mounted) return;
    window.__elevaDirector = {
      sections: this.snapshotSections(),
      holds: this.holds(),
      beats: () => this.snapshotBeats(),
      refresh: () => ScrollTrigger.refresh(),
    };
  }
}

/* ------------------------------------------------------------------ */
/* Provider                                                             */
/* ------------------------------------------------------------------ */

const DirectorContext = createContext<DirectorApi>({
  // Outside a director (a component rendered on its own): show everything.
  registerBeat: (_el, tl) => {
    tl.progress(1);
    return () => {};
  },
  spec: specFor,
});

export const useSectionDirector = () => useContext(DirectorContext);

type Props = {
  /** The `<main>` that contains every `[data-section]`. */
  scope: RefObject<HTMLElement | null>;
  children: ReactNode;
};

/**
 * Section Director for Concept A. Wraps the whole page body (the header consumes the
 * active section, the sections inside <SmoothScroll> register their beats). Mounts after
 * `document.fonts.ready`, after every child effect has run, so the ScrollSmoother and the
 * self sections' pins already exist when it measures.
 */
export default function SectionDirector({ scope, children }: Props) {
  const [active, setActive] = useState('intro');
  const [engine] = useState(() => new DirectorEngine());

  useEffect(() => {
    const main = scope.current;
    if (!main) return;
    let cancelled = false;
    const start = () => {
      if (!cancelled) engine.mount(main, setActive);
    };
    document.fonts.ready.then(start, start);
    return () => {
      cancelled = true;
      engine.unmount();
    };
  }, [scope, engine]);

  const api = useMemo<DirectorApi>(
    () => ({
      registerBeat: (el, tl, opts) => engine.register(el, tl, opts),
      spec: specFor,
    }),
    [engine]
  );
  const activeValue = useMemo(() => ({ active, setActive }), [active]);

  return (
    <ActiveSectionContext.Provider value={activeValue}>
      <DirectorContext.Provider value={api}>
        {children}
        <DirectorDebug engine={engine} />
      </DirectorContext.Provider>
    </ActiveSectionContext.Provider>
  );
}
