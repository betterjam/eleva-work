'use client';

import Image from 'next/image';
import { Fragment, useEffect, useRef, type CSSProperties } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { gsap, ScrollTrigger, SplitText } from '@/components/concepts/shared/gsapSetup';
import KeyValue, { type KeyValueRow } from './KeyValue';
import Plate from './Plate';
import { appImage } from './appImage';
import SectionRule from './SectionRule';
import { splitLinesInto } from './splitLines';
import { useReveal } from './useReveal';

type Slip = {
  code: string;
  text: string;
  dimension: string;
  perspectives: string[];
  priority: string;
  laws: string[];
  selected: boolean;
};
type PlateMsg = { fig: string; caption: string; alt: string };
type LedgerHead = { code: string; text: string; dimension: string; perspectives: string; priority: string; laws: string };

/* Crops in natural pixels. The bank window starts below the screenshot's own header row;
   the rubric window is the question column (group header down), never the sidebar. */
const BANK = {
  src: '/images/app/question-bank-catalog.png',
  w: 1578,
  h: 990,
  region: { x: 40, y: 300, w: 1500, h: 660 },
  mobile: { x: 57, y: 305, w: 856, h: 642 },
};
const RUBRIC = {
  src: '/images/app/generated-evaluation-rubric.png',
  w: 1390,
  h: 951,
  region: { x: 415, y: 170, w: 955, h: 764 },
  mobile: { x: 415, y: 170, w: 955, h: 716 },
  /** Cover crop: same column, down to the file's bottom edge (fills a portrait frame by height). */
  cover: { x: 415, y: 170, w: 955, h: 781 },
};

/** The pinned assembly is a full viewport: it needs width AND height. Everything else stacks. */
const MQ = {
  pin: '(min-width: 1024px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)',
  stack:
    '(max-width: 1023.98px) and (prefers-reduced-motion: no-preference), (min-width: 1024px) and (max-height: 759.98px) and (prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
} as const;

/**
 * Pinned timeline: the beats run on a 0→1 normalised scale, then the claim holds.
 * `HOLD` is extra timeline time after 1.00 in which nothing moves, so the finished
 * claim can be read while the stage is still pinned. The scroll window is sized from
 * the original 280% per timeline unit, so every beat before 1.00 keeps its old pace:
 * (1 + HOLD) × 280% ≈ 315%.
 */
const HOLD = 0.12;
const PIN_END = '+=315%';

let refreshRaf = 0;
/** rAF-debounced ScrollTrigger.refresh() for image loads and layout changes. */
function refreshSoon() {
  if (typeof window === 'undefined' || refreshRaf) return;
  refreshRaf = window.requestAnimationFrame(() => {
    refreshRaf = 0;
    ScrollTrigger.refresh();
  });
}

/**
 * Keyboard users: when focus lands inside the stage, every once-trigger of the stage
 * that has not fired yet jumps to its end, so the focused spot is readable at once.
 * Scrubbed and pinned triggers are left alone.
 */
function finishOnceTriggers(root: HTMLElement) {
  ScrollTrigger.getAll().forEach((st) => {
    const trigger = st.trigger;
    if (!st.vars.once || !(trigger instanceof Element) || !root.contains(trigger) || st.isActive || st.progress > 0) return;
    if (st.animation) st.animation.progress(1);
    else if (typeof st.vars.onEnter === 'function') st.vars.onEnter(st);
    st.kill(false, true);
  });
}

const q = <T extends Element = HTMLElement>(selector: string, scope: Element) => Array.from(scope.querySelectorAll<T>(selector));

type LadderKit = { crits: HTMLElement[]; links: HTMLElement[] };
const ladderKit = (ladder: Element | null): LadderKit => ({
  crits: ladder ? q('.a-crit', ladder) : [],
  links: ladder ? q('.a-pb-link', ladder) : [],
});

/** Criteria ladder: DIMENSIÓN → PERSPECTIVA → PRIORIDAD → NORMATIVA with 1px connectors. */
function Ladder({ criteria, vertical }: { criteria: string[]; vertical?: boolean }) {
  return (
    <div className={`a-pb-ladder ${vertical ? 'a-pb-ladder-v' : 'a-pb-ladder-h'}`}>
      {criteria.map((c, i) => (
        <Fragment key={c}>
          {i > 0 ? <i className="a-pb-link" aria-hidden="true" /> : null}
          <span className="a-crit" data-lit="false">
            {c}
          </span>
        </Fragment>
      ))}
    </div>
  );
}

/**
 * §03 Pauta — the builder. A ledger of six real questions beside an assembling rubric
 * frame. Wide AND tall viewports (≥1024 × ≥760, motion allowed): one pinned, scrubbed
 * timeline lifts the three Director questions out of the ledger into the frame's slots
 * (travel measured from the static li box to the static slot, width snapped once at
 * lift-off), stamps their law chips (colour pulse + scale ≤ 1.06, never overlapping),
 * lights the criteria ladder in the gutter as each slip travels, stamps the dimension
 * chips, unmasks the normativas and finally wipes the real rubric over the frame. The
 * last beat hands the left column over: the ledger gives way and the claim takes its
 * cell at display scale, then holds while the pin runs out.
 * Narrow or short viewports: stacked, no pin, the ladder sits above the frame and the
 * claim closes the section below the plate. Reduced motion / no script: CSS shows the
 * finished frame (cover on, slots off) and the claim reads as a closing block.
 */
export default function PautaBuilderA() {
  const t = useTranslations('conceptA');
  const locale = useLocale();
  const ref = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const claimRef = useRef<HTMLDivElement>(null);
  useReveal(ref);

  const bankRows = t.raw('pauta.bank.rows') as KeyValueRow[];
  const bankPlate = t.raw('pauta.bank.plate') as PlateMsg;
  const rubricPlate = t.raw('pauta.rubricPlate') as PlateMsg;
  const head = t.raw('pauta.stage.ledgerHead') as LedgerHead;
  const criteria = t.raw('pauta.stage.criteria') as string[];
  const slips = t.raw('pauta.stage.slips') as Slip[];
  const dimensions = t.raw('pauta.stage.frame.dimensions') as string[];
  const norms = t.raw('pauta.stage.frame.norms') as string[];

  useEffect(() => {
    const stage = stageRef.current;
    const frame = frameRef.current;
    if (!stage || !frame) return;

    let cancelled = false;
    let ctx: gsap.Context | null = null;
    let mm: gsap.MatchMedia | null = null;

    const onFocusIn = () => finishOnceTriggers(stage);
    stage.addEventListener('focusin', onFocusIn);

    /* Pinned assembly (returns its own cleanup for the matchMedia context). */
    const buildPinned = () => {
      const cover = coverRef.current;
      const caption = captionRef.current;
      const frameHead = frame.querySelector<HTMLElement>('.a-pb-frame-head');
      const frameLabels = q('.a-pb-frame-label', frame);
      const selected = q('.a-pb-slip[data-selected="true"] .a-pb-card', stage);
      const ghosts = selected.map((c) => c.parentElement?.querySelector<HTMLElement>('.a-pb-ghost') ?? null);
      const slots = q('.a-pb-slot', frame);
      const fills = slots.map((s) => s.querySelector<HTMLElement>('.a-pb-slot-fill'));
      const remaining = q('.a-pb-slip[data-selected="false"] .a-pb-card', stage);
      const chips = q('.a-pb-dim', frame);
      const normSpans = q('.a-pb-norms > li > span', frame);
      const bank = stage.querySelector<HTMLElement>('.a-pb-bank');
      const gutter = stage.querySelector<HTMLElement>('.a-pb-gutter');
      const gutterRule = gutter?.querySelector<HTMLElement>('.a-pb-gutter-rule') ?? null;
      const { crits, links } = ladderKit(gutter?.querySelector('.a-pb-ladder') ?? null);
      const claim = claimRef.current;
      const claimLine = claim?.querySelector<HTMLElement>('.a-pb-claim-line') ?? null;
      const claimRule = claim?.querySelector<HTMLElement>('.a-pb-claim-rule') ?? null;
      const claimSub = claim?.querySelector<HTMLElement>('.a-pb-claim-sub > span') ?? null;
      const splits: SplitText[] = [];
      // The ledger gives way, in visual order, so the column empties from the top. The
      // selected cards are NOT in this list: they have travelled into the frame and fade
      // on their own at 0.90 (a clip-path on the ledger would crop them mid-flight, and a
      // second opacity tween on the same targets would fight that one).
      const leaving = [
        bank?.querySelector<HTMLElement>(':scope > .a-label') ?? null,
        bank?.querySelector<HTMLElement>('.a-pb-ledger-head') ?? null,
        ...q('.a-pb-ledger > li', stage).flatMap((li) => [
          li.querySelector<HTMLElement>('.a-pb-ghost'),
          li.dataset.selected === 'true' ? null : li.querySelector<HTMLElement>('.a-pb-card'),
        ]),
        bank?.querySelector<HTMLElement>('.a-pb-note') ?? null,
      ].filter(Boolean) as HTMLElement[];

      // Fit: the frame has a fixed height (a full-viewport pin). When the static content
      // would not fit, compact the spacing (`.is-tight`) so the last normativas are never
      // clipped. Measured BEFORE the timeline so the slot positions it records are final.
      // The bank column has no fixed height of its own, so it is measured against the stage
      // (a full viewport): when its static column would end below the pinned viewport, the
      // stage's own tier shortens every slip AND slot together (the travel stays slot-exact).
      const overflows = () => frame.scrollHeight > frame.clientHeight + 1;
      const bankOverflows = () => !!bank && bank.offsetTop + bank.offsetHeight > stage.clientHeight + 1;
      const fit = () => {
        frame.classList.remove('is-tight', 'is-tighter');
        stage.classList.remove('is-tight');
        if (overflows()) frame.classList.add('is-tight');
        // Re-measured: the shortest pinned viewports need the second tier too.
        if (overflows()) frame.classList.add('is-tighter');
        if (bankOverflows()) stage.classList.add('is-tight');
      };
      fit();

      // Start states. CSS already parks all of these (so SSR never snaps); the sets make
      // the same state explicit for GSAP.
      const appear = [frameHead, ...frameLabels, ...slots].filter(Boolean) as HTMLElement[];
      gsap.set(appear, { autoAlpha: 0 });
      gsap.set(chips, { clipPath: 'inset(0% 100% 0% 0%)' });
      // `y: 0` clears the pixel offset GSAP parses from the stylesheet's translateY(110%)
      // (same hazard as useReveal's rv-mask); without it every span ends one line too low.
      gsap.set(normSpans, { y: 0, yPercent: 110 });
      gsap.set(ghosts.filter(Boolean) as HTMLElement[], { opacity: 0 });
      gsap.set(links, { scaleY: 0 });
      if (gutterRule) gsap.set(gutterRule, { scaleY: 0 });
      if (cover) gsap.set(cover, { clipPath: 'inset(0% 0% 100% 0%)' });
      if (caption) gsap.set(caption, { autoAlpha: 0 });
      if (claimRule) gsap.set(claimRule, { scaleX: 0 });
      // Same `y: 0` hazard as the normativas: `.rv-mask > *` is parked at translateY(110%).
      if (claimSub) gsap.set(claimSub, { y: 0, yPercent: 110 });

      // Travel measured from the static li box to the static slot, never from the moving card.
      const delta = (i: number) => {
        const li = selected[i].parentElement;
        const slot = slots[i];
        if (!li || !slot) return { x: 0, y: 0, w: selected[i].offsetWidth };
        const a = li.getBoundingClientRect();
        const b = slot.getBoundingClientRect();
        return { x: b.left - a.left, y: b.top - a.top, w: b.width };
      };

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: stage,
          start: 'top top',
          end: PIN_END,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Ladder step k lights at `at`; its connector draws down into it just before.
      const light = (k: number, at: number) => {
        if (crits[k]) tl.set(crits[k], { attr: { 'data-lit': 'true' } }, at);
        if (k > 0 && links[k - 1]) tl.fromTo(links[k - 1], { scaleY: 0 }, { scaleY: 1, duration: 0.05 }, at - 0.05);
      };

      // 0.00–0.10 gutter rule draws; frame head, labels and slots appear
      if (gutterRule) tl.to(gutterRule, { scaleY: 1, duration: 0.1 }, 0);
      if (appear.length) tl.fromTo(appear, { autoAlpha: 0 }, { autoAlpha: 1, stagger: 0.01, duration: 0.08 }, 0.02);

      // 0.10–0.62 slips travel; ladder lights one step per slip; laws stamp
      selected.forEach((card, i) => {
        if (!slots[i]) return;
        const t0 = 0.1 + i * 0.16;
        light(i, t0);
        if (ghosts[i]) tl.to(ghosts[i], { opacity: 1, duration: 0.02 }, t0);
        // `.a-pb-card.is-selected` mixes its border from --on (live tokens; a colour tween would bake the theme).
        tl.to(card, { '--on': 1, duration: 0.02 }, t0);
        // Width snaps once at lift-off (the dashed ghost stays behind, so the jump is
        // invisible) and BEFORE any chip animates; only transforms tween while the scrub runs.
        tl.set(card, { width: () => delta(i).w }, t0 + 0.02);
        tl.to(card, { x: () => delta(i).x, y: () => delta(i).y, duration: 0.1 }, t0 + 0.02);
        const fill = fills[i];
        if (fill) tl.to(fill, { opacity: 1, duration: 0.02 }, t0 + 0.12);
        const laws = card.querySelectorAll('.a-pb-law');
        if (laws.length) {
          // Two `to` tweens, never a positioned fromTo (immediateRender would tint the chips
          // before any scroll). Scale stays ≤ 1.06 about `left center`: the chips sit in a
          // wrapping flex row with a 10px column gap, so no chip ever reaches its neighbour.
          tl.to(laws, { '--hit': 1, scale: 1.06, duration: 0.012, stagger: 0.008 }, t0 + 0.12).to(
            laws,
            { '--hit': 0, scale: 1, duration: 0.03, stagger: 0.008, ease: 'snap' },
            t0 + 0.132
          );
        }
      });
      // The questions left behind de-emphasise by colour (`--dim` mixes live tokens in CSS), never
      // by opacity, so the 10px meta and chips keep ≥ 4.5:1 in both themes.
      if (remaining.length) tl.to(remaining, { '--dim': 1, duration: 0.2, stagger: 0.03 }, 0.3);

      // 0.62–0.78 dimension chips stamp
      if (chips.length) tl.fromTo(chips, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.05, stagger: 0.012 }, 0.62);

      // 0.76 NORMATIVA lights; 0.78–0.90 normativas unmask
      light(3, 0.76);
      if (normSpans.length) tl.fromTo(normSpans, { y: 0, yPercent: 110 }, { yPercent: 0, duration: 0.06, stagger: 0.006 }, 0.78);

      // 0.90–1.00 the real rubric wipes over the frame; slips fade beneath; caption appears
      if (cover) tl.to(cover, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.1 }, 0.9);
      if (selected.length) tl.to(selected, { autoAlpha: 0, duration: 0.05 }, 0.9);
      if (caption) tl.fromTo(caption, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0.96);

      // 0.91–0.955 the ledger gives way, top to bottom (opacity only — never a layout
      // property, and never a clip-path, which would crop the cards travelling outside the
      // bank's box). `amount` fixes the spread, so the count of slips cannot lengthen it.
      if (leaving.length) tl.to(leaving, { opacity: 0, duration: 0.022, stagger: { amount: 0.025 } }, 0.91);

      // 0.94–1.00 the claim takes the column: the lines unmask, the hairline draws, the sub
      // follows. Eased, unlike every beat before it: this one lands, it is not dragged.
      if (claim) tl.set(claim, { pointerEvents: 'auto' }, 0.935);
      if (claimLine) {
        // A line target that cannot be measured (no boxes) is only un-hidden.
        if (claimLine.getClientRects().length) {
          splits.push(splitLinesInto(claimLine, tl, 0.94, { duration: 0.04, stagger: { amount: 0.02 }, ease: 'reveal' }));
        } else {
          gsap.set(claimLine, { visibility: 'visible' });
        }
      }
      if (claimRule) tl.fromTo(claimRule, { scaleX: 0 }, { scaleX: 1, duration: 0.035, ease: 'reveal' }, 0.965);
      if (claimSub) tl.fromTo(claimSub, { y: 0, yPercent: 110 }, { yPercent: 0, duration: 0.03, ease: 'reveal' }, 0.97);

      // 1.00–1.12 a beat of stillness: the claim is whole while the pin still holds.
      tl.to({}, { duration: HOLD }, 1);

      const ro = new ResizeObserver(() => {
        fit();
        refreshSoon();
      });
      ro.observe(frame);
      ro.observe(stage);
      return () => {
        ro.disconnect();
        splits.forEach((s) => s.revert());
        frame.classList.remove('is-tight', 'is-tighter');
        stage.classList.remove('is-tight');
      };
    };

    /* Narrow or short (with motion): stacked, no pin (returns its own cleanup for the matchMedia context). */
    const buildStacked = () => {
      const splits: SplitText[] = [];
      q('.a-pb-card', stage).forEach((card) => {
        const li = card.parentElement;
        if (!li) return;
        gsap.fromTo(
          card,
          { clipPath: 'inset(0% 100% 0% 0%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 0.6,
            ease: 'reveal',
            scrollTrigger: { trigger: li, start: 'top 85%', once: true },
            onComplete: () => {
              gsap.set(card, { clipPath: 'none' });
              if (li.dataset.selected === 'false') li.classList.add('is-remaining');
            },
          }
        );
      });

      const ladder = stage.querySelector<HTMLElement>('.a-pb-gutter-stack .a-pb-ladder');
      const { crits, links } = ladderKit(ladder);
      if (ladder && crits.length) {
        gsap.set(links, { scaleX: 0 });
        const ltl = gsap.timeline({ scrollTrigger: { trigger: ladder, start: 'top 80%', once: true } });
        crits.forEach((c, k) => {
          ltl.set(c, { attr: { 'data-lit': 'true' } }, k * 0.15);
          if (k > 0 && links[k - 1]) ltl.to(links[k - 1], { scaleX: 1, duration: 0.3, ease: 'reveal' }, k * 0.15 - 0.1);
        });
      }

      const chips = q('.a-pb-dim', frame);
      const normSpans = q('.a-pb-norms > li > span', frame);
      const ftl = gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 75%', once: true } });
      if (chips.length) ftl.fromTo(chips, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.4, stagger: 0.03, ease: 'reveal' }, 0);
      // `y: 0` clears the pixel offset GSAP parses from the stylesheet's translateY(110%).
      if (normSpans.length) ftl.fromTo(normSpans, { y: 0, yPercent: 110 }, { yPercent: 0, duration: 0.5, stagger: 0.03, ease: 'reveal' }, 0.3);

      // The real plate, static, wipes up once (its body carries `rv-wipe-up`, left to us by
      // the stage's `data-rv-manual`).
      const body = stage.querySelector<HTMLElement>('.a-pb-mplate .a-plate-body');
      if (body) {
        const img = body.querySelector('img');
        const ptl = gsap.timeline({ scrollTrigger: { trigger: body, start: 'top 80%', once: true } });
        ptl.fromTo(body, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.9, ease: 'reveal' }, 0);
        ptl.set(body, { clipPath: 'none' }, 0.9);
        if (img) ptl.fromTo(img, { y: 40 }, { y: 0, duration: 0.9, ease: 'reveal' }, 0);
      }
      // The claim closes the section: nothing is replaced here (the ledger stays), so it is
      // an ordinary once-only reveal, in seconds rather than beat proportions.
      const claim = claimRef.current;
      if (claim) {
        const claimLine = claim.querySelector<HTMLElement>('.a-pb-claim-line');
        const claimRule = claim.querySelector<HTMLElement>('.a-pb-claim-rule');
        const claimSub = claim.querySelector<HTMLElement>('.a-pb-claim-sub > span');
        const ctl = gsap.timeline({ scrollTrigger: { trigger: claim, start: 'top 80%', once: true } });
        if (claimLine) {
          if (claimLine.getClientRects().length) splits.push(splitLinesInto(claimLine, ctl, 0));
          else gsap.set(claimLine, { visibility: 'visible' });
        }
        if (claimRule) ctl.fromTo(claimRule, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'reveal' }, 0.35);
        // `y: 0` clears the pixel offset GSAP parses from `.rv-mask > *`'s translateY(110%).
        if (claimSub) ctl.fromTo(claimSub, { y: 0, yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: 'reveal' }, 0.5);
      }

      // `is-remaining` is added by an onComplete, outside GSAP's own revert: drop it when the
      // condition stops matching, so a resize into the pinned layout starts from undimmed cards.
      return () => {
        splits.forEach((s) => s.revert());
        q('.a-pb-slip.is-remaining', stage).forEach((li) => li.classList.remove('is-remaining'));
      };
    };

    const start = () => {
      if (cancelled) return;
      ctx = gsap.context(() => {
        mm = gsap.matchMedia();
        // `reduce` complements the two motion conditions so the callback always runs.
        mm.add({ pin: MQ.pin, stack: MQ.stack, reduce: MQ.reduce }, (mctx) => {
          const { pin, stack, reduce } = mctx.conditions as { pin: boolean; stack: boolean; reduce: boolean };
          if (reduce) {
            // Final states: CSS renders the finished frame; the data-driven bits get a nudge.
            gsap.set(q('.a-crit', stage), { attr: { 'data-lit': 'true' } });
            if (coverRef.current) gsap.set(coverRef.current, { clipPath: 'none' });
            return;
          }
          if (pin) return buildPinned();
          if (stack) return buildStacked();
        });
      }, stage);
      refreshSoon();
    };

    // Measured travel and the fit check depend on font metrics: build once fonts are ready.
    document.fonts.ready.then(start, start);

    return () => {
      cancelled = true;
      stage.removeEventListener('focusin', onFocusIn);
      mm?.revert();
      ctx?.revert();
    };
  }, []);

  const coverVars = {
    '--img-w': RUBRIC.w,
    '--crop-x': RUBRIC.cover.x,
    '--crop-y': RUBRIC.cover.y,
    '--crop-w': RUBRIC.cover.w,
    '--crop-h': RUBRIC.cover.h,
    '--ratio': `${RUBRIC.cover.w} / ${RUBRIC.cover.h}`,
  } as CSSProperties;

  return (
    <section id="pauta" data-section="pauta" ref={ref} className="a-section">
      <div className="a-container">
        <SectionRule code={t('pauta.code')} runningHead={t('pauta.runningHead')} />
        <div className="a-cols" data-rv-group>
          <h2 className="a-h2 rv-lines col-span-4 md:col-span-9">{t('pauta.title')}</h2>
          <p className="a-lead rv-lines col-span-4 md:col-span-7" data-rv-delay="0.15" style={{ marginTop: 24 }}>
            {t('pauta.lead')}
          </p>
        </div>

        {/* FIG. 3.1 — the bank, with its facts */}
        <div className="a-cols a-pb-intro" data-rv-group style={{ marginTop: 56 }}>
          <Plate
            src={BANK.src}
            naturalW={BANK.w}
            naturalH={BANK.h}
            region={BANK.region}
            mobileRegion={BANK.mobile}
            fig={bankPlate.fig}
            caption={bankPlate.caption}
            alt={bankPlate.alt}
            sizes="(min-width: 1024px) 60vw, 100vw"
            reveal="rv-wipe"
          />
          <div className="a-pb-intro-side">
            <p className="a-label-2">{t('pauta.bank.label')}</p>
            <p className="a-code">{t('pauta.bank.sub')}</p>
            <KeyValue rows={bankRows} />
          </div>
        </div>

        {/* The stage: ledger · gutter ladder · frame */}
        <div id="pauta-stage" ref={stageRef} className="a-sheet a-pb-stage" data-rv-manual>
          <p className="a-sr-only">{t('pauta.stage.srSummary')}</p>

          {/* Bank ledger */}
          <div className="a-pb-bank">
            <p className="a-label">
              {t('pauta.stage.bankLabel')} <span className="a-pb-label-meta">{t('pauta.stage.bankMeta')}</span>
            </p>
            <p className="a-code a-pb-ledger-head" aria-hidden="true">
              {head.code} · {head.text} · {head.dimension} · {head.perspectives} · {head.priority} · {head.laws}
            </p>
            <ol className="a-pb-ledger">
              {slips.map((s) => (
                <li key={s.code} className="a-pb-slip" data-selected={s.selected ? 'true' : 'false'}>
                  <i className="a-pb-ghost" aria-hidden="true" />
                  <article className={`a-pb-card${s.selected ? ' is-selected' : ''}`}>
                    <p className="a-pb-text">{s.text}</p>
                    <span className="a-pb-code">{s.code}</span>
                    <div className="a-pb-meta">
                      <span>{s.dimension}</span>
                      <span aria-hidden="true">·</span>
                      <span>{s.perspectives.join(' · ')}</span>
                      <span aria-hidden="true">·</span>
                      <span>{s.priority}</span>
                    </div>
                    {s.laws.length || s.selected ? (
                      <div className="a-pb-laws">
                        {s.laws.map((l) => (
                          <span key={l} className="a-pb-law">
                            {l}
                          </span>
                        ))}
                        {s.selected ? <span className="a-pb-tag">{t('pauta.stage.selectedTag')}</span> : null}
                      </div>
                    ) : null}
                  </article>
                </li>
              ))}
            </ol>
            <p className="a-code a-pb-note">{t('pauta.stage.note')}</p>
          </div>

          {/* Pinned gutter: hairline on the boundary, the criteria ladder along it */}
          <div className="a-pb-gutter" aria-hidden="true">
            <i className="a-pb-gutter-rule" />
            <Ladder criteria={criteria} vertical />
          </div>

          {/* Stacked: the ladder above the frame */}
          <div className="a-pb-gutter-stack">
            <p className="a-label">{t('pauta.stage.selectionLabel')}</p>
            <Ladder criteria={criteria} />
          </div>

          {/* The assembled frame (a plate in the making: crop marks, FIG. caption once the cover lands) */}
          <div className="a-pb-rubric">
            <div className="a-pb-plate">
              <span className="a-pb-marks" aria-hidden="true" />
              <div ref={frameRef} className="a-pb-frame">
                <div className="a-pb-frame-head">
                  <p className="a-label-2">{t('pauta.stage.frame.label')}</p>
                  <p className="a-code">{t('pauta.stage.frame.meta')}</p>
                </div>
                <div className="a-pb-slots a-pb-pin-only" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="a-pb-slot">
                      <i className="a-pb-slot-fill" />
                      <span className="a-pb-slot-label">
                        {t('pauta.stage.frame.slotLabel')} {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="a-label a-pb-frame-label">{t('pauta.stage.frame.dimensionsLabel')}</p>
                <div className="a-pb-dims">
                  {dimensions.map((d) => (
                    <span key={d} className="a-chip a-pb-dim">
                      {d}
                    </span>
                  ))}
                </div>
                <p className="a-label a-pb-frame-label">{t('pauta.stage.frame.normsLabel')}</p>
                <ul className="a-pb-norms">
                  {norms.map((n) => (
                    <li key={n}>
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
                <div ref={coverRef} className="a-pb-cover a-pb-pin-only" style={coverVars}>
                  <div className="a-pb-cover-crop">
                    <Image
                      className="a-crop"
                      src={appImage(RUBRIC.src, locale)}
                      width={RUBRIC.w}
                      height={RUBRIC.h}
                      alt={rubricPlate.alt}
                      loading="lazy"
                      sizes="(min-width: 1280px) 960px, 80vw"
                      draggable={false}
                    />
                  </div>
                </div>
              </div>
              <p ref={captionRef} className="a-plate-caption a-pb-caption a-pb-pin-only">
                <span className="a-fig">{rubricPlate.fig}</span>
                <span>{rubricPlate.caption}</span>
              </p>
            </div>
          </div>

          {/* Stacked: the real plate, static */}
          <div className="a-pb-mplate">
            <Plate
              src={RUBRIC.src}
              naturalW={RUBRIC.w}
              naturalH={RUBRIC.h}
              region={RUBRIC.region}
              mobileRegion={RUBRIC.mobile}
              fig={rubricPlate.fig}
              caption={rubricPlate.caption}
              alt={rubricPlate.alt}
              sizes="(min-width: 768px) 90vw, 100vw"
              reveal="rv-wipe-up"
            />
          </div>

          {/* The last beat. Pinned: this sits in the ledger's own grid cell and arrives as
              the ledger leaves. Stacked / reduced motion / no script: it closes the section
              below the plate, with the ledger still above it. The start states are the
              shared `rv-*` ones, so the stylesheet's reduced-motion rules and the layout's
              <noscript> block already render it finished. */}
          <div ref={claimRef} className="a-pb-claim">
            <p className="a-h2 a-pb-claim-line rv-lines">{t('pauta.close')}</p>
            <i className="a-pb-claim-rule rv-rule-x" aria-hidden="true" />
            <p className="a-label-2 a-pb-claim-sub rv-mask">
              <span>{t('pauta.closeSub')}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
