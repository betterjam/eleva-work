/**
 * Section Director — configuration (single source of truth).
 *
 * One entry per `data-section` in `PageA.tsx`, in DOM order. The director reads the
 * sections from the DOM and looks each one up here by id; a section missing from this
 * list gets the defaults (`flow`, `cut`).
 *
 * Vocabulary (see design-section-director.md):
 * - flow: every beat inside is a scroll WINDOW: its timeline is scrubbed from the beat's
 *   top at `enterAt` % of the viewport to its top at `settleAt` %, then locked.
 * - hold: the section's `[data-hold]` intro block pins `HOLD_TOP` px under the fixed header for
 *   `holdDistance` while the beats inside it are scrubbed across that distance (the page
 *   literally waits for the reveal). Everything else in the section is an ordinary window.
 *   Under 768px or with reduced motion a hold degrades to flow.
 * - self: the section drives its own pinned, scrubbed sequence (SystemSheet, PautaBuilderA).
 *   The director tracks it (active section, transitions, the header copy windows outside
 *   its `[data-rv-manual]` stage) but never pins it and never touches its manual subtree.
 * - next: the transition INTO the following section. `cut` dims the last beat as the
 *   section leaves and draws the next SectionRule late; `continue` draws it early and lets
 *   the next section's first beat enter at 100 % so both reveals overlap.
 */
export type SectionMode = 'flow' | 'hold' | 'self';
export type Transition = 'cut' | 'continue';

export type SectionSpec = {
  /** Matches `data-section` on the section element. */
  id: string;
  /** Default 'flow'. */
  mode?: SectionMode;
  /** Pin distance of a hold: '55vh', '400px' or a number of px (default '60vh'). */
  holdDistance?: string | number;
  /** Transition INTO the following section (default 'cut'). */
  next?: Transition;
  /** Beats un-reveal on scroll up (default false: locked at completion). */
  reversible?: boolean;
  /** Window start: the beat's top at this % of the viewport height (default 92). */
  enterAt?: number;
  /** Window end: the beat's top at this % of the viewport height (default 48). */
  settleAt?: number;
  /** Feeds the header counter and nav highlight (default true; the footer has no §NN). */
  track?: boolean;
};

export type ResolvedSpec = {
  id: string;
  mode: SectionMode;
  holdDistance: string | number;
  next: Transition;
  reversible: boolean;
  enterAt: number;
  settleAt: number;
  track: boolean;
};

export const DEFAULT_ENTER_AT = 92;
export const DEFAULT_SETTLE_AT = 48;
export const DEFAULT_HOLD_DISTANCE = '60vh';

/** Scrub smoothing (seconds) for windows, holds, rule draws and exits. */
export const SCRUB = 0.25;
/** Holds only pin from this viewport width up (Tailwind md). */
export const HOLD_MIN_WIDTH = 768;
/**
 * Gap (px) kept between the fixed header and a parked hold block. Without it the section
 * title sat flush under the 56px header for the whole pin and read as crowded; with it the
 * block parks where a section's own top padding would put it.
 */
export const HOLD_TOP = 80;
/**
 * Share of a hold's pin distance kept AFTER its intro has finished drawing. The intro draws
 * across the first (1 - HOLD_DWELL) of the pin and then sits finished for the rest, so the
 * pin never releases mid-reveal (the 0.25 s scrub lag included) and the reader gets a beat
 * of stillness on the finished block before the page moves on.
 */
export const HOLD_DWELL = 0.3;
/** Minimum window length (enterAt − settleAt, in % of the viewport). */
export const MIN_WINDOW = 8;
/** First beat of a section reached through `continue` enters at 100 %. */
export const CONTINUE_ENTER_AT = 100;
/** SectionRule draw span (section top at these % of the viewport) per transition INTO it. */
export const RULE_SPANS: Record<Transition, [number, number]> = { cut: [90, 72], continue: [100, 86] };
/** Exit of a `cut` section's last beat: section bottom from 30 % to 0 % of the viewport. */
export const EXIT = { start: 'bottom 30%', end: 'bottom 0%', opacity: 0.35, y: -16 } as const;
/** Active-section line (header counter / nav highlight). */
export const ACTIVE_LINE = '45%';

export const SECTIONS: SectionSpec[] = [
  // The page intro's load timeline stays time-based (it plays on arrival, not on scroll).
  { id: 'intro', mode: 'flow', next: 'continue' },
  { id: 'system', mode: 'self', next: 'continue' },
  { id: 'estructura', mode: 'hold', holdDistance: '55vh', next: 'continue' },
  { id: 'pauta', mode: 'self', next: 'continue' },
  { id: 'proceso', mode: 'hold', holdDistance: '55vh', next: 'continue' },
  { id: 'resultados', mode: 'hold', holdDistance: '55vh', next: 'cut' },
  { id: 'ia', mode: 'flow', next: 'continue' },
  { id: 'normativa', mode: 'hold', holdDistance: '60vh', next: 'cut' },
  // Closing CTA and colophon carry no §NN, so the counter holds at §07 to the end.
  // `cut` into the colophon: the closing block dims as it leaves. The exit runs from the
  // section's bottom at 30 % of the viewport to its bottom at 0 %, and the box sits inside
  // 104px of section padding, so it is already mostly above the fold when the dim starts.
  { id: 'cierre', mode: 'flow', next: 'cut', track: false },
  { id: 'footer', mode: 'flow', settleAt: 80, next: 'cut', track: false },
];

export function resolveSpec(spec?: Partial<SectionSpec>): ResolvedSpec {
  return {
    id: spec?.id ?? '',
    mode: spec?.mode ?? 'flow',
    holdDistance: spec?.holdDistance ?? DEFAULT_HOLD_DISTANCE,
    next: spec?.next ?? 'cut',
    reversible: spec?.reversible ?? false,
    enterAt: spec?.enterAt ?? DEFAULT_ENTER_AT,
    settleAt: spec?.settleAt ?? DEFAULT_SETTLE_AT,
    track: spec?.track ?? true,
  };
}

export function specFor(id: string): ResolvedSpec {
  return resolveSpec(SECTIONS.find((s) => s.id === id) ?? { id });
}
