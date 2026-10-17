'use client';

import { Fragment, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap, ScrollTrigger } from '@/components/concepts/shared/gsapSetup';
import ConfidenceBars, { type Bar } from './ConfidenceBars';
import KeyValue, { type KeyValueRow } from './KeyValue';
import Plate from './Plate';
import SectionRule from './SectionRule';
import { useSectionDirector } from './director/SectionDirector';
import { HOLD_TOP, SCRUB } from './director/sections';
import { useReveal } from './useReveal';

type Block = {
  id: string;
  index: string;
  label: string;
  title: string;
  body: string;
  rows: KeyValueRow[];
  example?: { label: string; text: string };
  barsLabel?: string;
  bars?: Bar[];
};
type PlateMsg = { fig: string; caption: string; alt: string };

const PLATES = [
  {
    src: '/images/app/org-chart-editor.png',
    w: 1540,
    h: 1162,
    region: { x: 0, y: 0, w: 1540, h: 1155 },
    mobile: { x: 0, y: 0, w: 1540, h: 1059 },
  },
  {
    src: '/images/app/role-catalog-tree.png',
    w: 1576,
    h: 1173,
    region: { x: 0, y: 0, w: 1564, h: 1173 },
    mobile: { x: 0, y: 0, w: 1576, h: 1084 },
  },
  {
    src: '/images/app/role-template-ai-match.png',
    w: 1505,
    h: 1010,
    region: { x: 0, y: 0, w: 1347, h: 1010 },
    mobile: { x: 0, y: 0, w: 1469, h: 1010 },
  },
];

/**
 * §02 Estructura. A HOLD section: the `[data-hold]` block (title + lead) pins under the
 * header for 55vh while its beat draws, so the page waits for the reveal (`sections.ts`).
 * Desktop (≥1024, motion allowed): a rail of three spec blocks on the left and a pinned
 * plate column (pinSpacing false) on the right, parked vertically centred in the area
 * below the header like the stage box of §01. Plate 2.1 reveals as a director BEAT
 * (scrubbed, locked at completion). Plates 2.2 / 2.3 wipe up over the previous one as
 * their block crosses 60 % → 40 % of the viewport, the covered plate settling back (scale
 * 0.985, 35 %): that cross-fade is a scrubbed trigger of its own, NOT a beat, because it
 * must run backwards when the reader scrolls back up to the block above it — a beat that
 * never locks would count as an unfinished reveal. Under 1024px or reduced motion the
 * plates interleave (the stylesheet picks the variant with media queries, so SSR paints
 * the right one).
 */
export default function EstructuraA() {
  const t = useTranslations('conceptA');
  const ref = useRef<HTMLElement>(null);
  const { registerBeat } = useSectionDirector();
  useReveal(ref);

  const blocks = t.raw('estructura.blocks') as Block[];
  const plates = t.raw('estructura.plates') as PlateMsg[];

  useEffect(() => {
    const section = ref.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add(
        { isDesktop: '(min-width: 1024px)', noReduce: '(prefers-reduced-motion: no-preference)' },
        (mctx) => {
          const { isDesktop, noReduce } = mctx.conditions as { isDesktop: boolean; noReduce: boolean };
          if (!isDesktop || !noReduce) return;
          const plateCol = section.querySelector<HTMLElement>('.a-plate-col');
          const blockEls = Array.from(section.querySelectorAll<HTMLElement>('.a-estr-block'));
          if (!plateCol || blockEls.length < 3) return;
          const plateEls = Array.from(plateCol.querySelectorAll<HTMLElement>('.a-plate'));
          if (plateEls.length < 3) return;
          const unregisters: (() => void)[] = [];

          // The column parks with its centre on the centre of the area below the fixed
          // header, never higher than the line the hold sections park at (HOLD_TOP under
          // the header), so a column taller than that area still starts at a readable
          // top. It leaves with the rail: the pin ends when the last block's bottom
          // reaches the column's bottom, and the two scroll away together. Both edges are
          // functions, re-read on every refresh (invalidateOnRefresh) for resizes.
          const parkedTop = () => {
            const header = document.querySelector<HTMLElement>('.a-header')?.offsetHeight || 56;
            const centred = header + (window.innerHeight - header - plateCol.offsetHeight) / 2;
            return Math.max(header + HOLD_TOP, Math.round(centred));
          };
          ScrollTrigger.create({
            trigger: plateCol,
            start: () => `top ${parkedTop()}px`,
            endTrigger: blockEls[blockEls.length - 1],
            end: () => `bottom ${parkedTop() + plateCol.offsetHeight}px`,
            pin: true,
            pinSpacing: false,
            invalidateOnRefresh: true,
          });

          // Plate 2.1 reveals with the section (body wipes from the right + image slide;
          // frame stays): one beat on the plate column, scrubbed from its top at 80 % of
          // the viewport and locked at completion. The column is measured unpinned (the
          // whole window closes at 48 %, always before its own pin starts: the column
          // parks with its top well above that line).
          const body0 = plateEls[0].querySelector<HTMLElement>('.a-plate-body');
          const img0 = plateEls[0].querySelector('img');
          const intro = gsap.timeline({ paused: true });
          if (body0) intro.fromTo(body0, { clipPath: 'inset(0% 0% 0% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.0, ease: 'reveal' }, 0);
          if (img0) intro.fromTo(img0, { x: -32 }, { x: 0, duration: 1.0, ease: 'reveal' }, 0);
          // A residual `clip-path` still clips focus rings and overflow at 100 %, so the
          // beat drops it at the end (same reason as `useReveal`). The 2.2/2.3 cross-fade
          // below keeps its clip: it is reversible, so it must be able to close again.
          if (body0) intro.set(body0, { clipPath: 'none' }, 1.0);
          if (intro.duration()) unregisters.push(registerBeat(plateCol, intro, { enterAt: 80, id: 'estructura/plate-2.1' }));

          // Plates 2.2 / 2.3 (whole figures, stacked over 2.1 whose crop marks sit at the same
          // coordinates) wipe up over the previous one as their block arrives. Only the covered
          // plate's BODY dims, so the crop marks underneath keep full opacity.
          for (let i = 1; i < 3; i++) {
            const tl = gsap.timeline({ paused: true });
            const prevBody = plateEls[i - 1].querySelector<HTMLElement>('.a-plate-body') ?? plateEls[i - 1];
            tl.fromTo(plateEls[i], { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.8, ease: 'reveal' }, 0)
              .fromTo(plateEls[i].querySelector('img'), { y: 40 }, { y: 0, duration: 0.8, ease: 'reveal' }, 0)
              .to(prevBody, { scale: 0.985, autoAlpha: 0.35, duration: 0.6, ease: 'settle' }, 0);
            // Positional and reversible: the cross-fade follows the scroll both ways, so
            // the plate on top always belongs to the block being read.
            ScrollTrigger.create({
              trigger: blockEls[i],
              start: 'clamp(top 60%)',
              end: 'clamp(top 40%)',
              scrub: SCRUB,
              animation: tl,
              invalidateOnRefresh: true,
            });
          }

          return () => unregisters.forEach((fn) => fn());
        }
      );
    }, section);

    return () => ctx.revert();
  }, [registerBeat]);

  // Plates reserve their box: no refresh on image load (see SystemSheet).

  return (
    <section id="estructura" data-section="estructura" ref={ref} className="a-section">
      <div className="a-container">
        <SectionRule code={t('estructura.code')} runningHead={t('estructura.runningHead')} />
        {/* The hold block: it pins under the header while this beat draws. */}
        <div data-hold>
          <div className="a-cols" data-rv-group>
            <h2 className="a-h2 rv-lines col-span-4 md:col-span-8">{t('estructura.title')}</h2>
            <p className="a-lead rv-lines col-span-4 md:col-span-6" data-rv-delay="0.15" style={{ marginTop: 24 }}>
              {t('estructura.lead')}
            </p>
          </div>
        </div>

        <div className="a-cols a-estr" style={{ marginTop: 64 }}>
          {blocks.map((b, i) => (
            <Fragment key={b.id}>
              <div className="a-estr-block" data-rv-group data-rv-start="top 75%">
                <p className="a-label rv-wipe">
                  {b.index} / {b.label}
                </p>
                <h3 className="a-h3 rv-lines" style={{ marginTop: 16 }}>
                  {b.title}
                </h3>
                <p className="a-body rv-lines" style={{ marginTop: 12 }}>
                  {b.body}
                </p>
                <KeyValue rows={b.rows} className="a-spec-kv" />
                {b.example ? (
                  <blockquote className="a-spec-quote">
                    <p className="a-label rv-wipe">{b.example.label}</p>
                    <p className="a-body rv-lines">{b.example.text}</p>
                  </blockquote>
                ) : null}
                {b.bars && b.barsLabel ? <ConfidenceBars label={b.barsLabel} bars={b.bars} /> : null}
              </div>
              <div className="a-estr-mplate">
                <Plate
                  src={PLATES[i].src}
                  naturalW={PLATES[i].w}
                  naturalH={PLATES[i].h}
                  region={PLATES[i].mobile}
                  fig={plates[i]?.fig ?? ''}
                  caption={plates[i]?.caption ?? ''}
                  alt={plates[i]?.alt ?? ''}
                  sizes="100vw"
                  reveal="rv-wipe-up"
                />
              </div>
            </Fragment>
          ))}

          <div className="a-plate-col" data-rv-manual>
            <div className="a-plate-stack">
              {PLATES.map((p, i) => (
                <Plate
                  key={p.src}
                  src={p.src}
                  naturalW={p.w}
                  naturalH={p.h}
                  region={p.region}
                  fig={plates[i]?.fig ?? ''}
                  caption={plates[i]?.caption ?? ''}
                  alt={plates[i]?.alt ?? ''}
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  reveal={i === 0 ? 'rv-wipe-left' : undefined}
                  className={i === 0 ? undefined : 'rv-wipe-up'}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
