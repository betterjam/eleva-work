'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap, ScrollTrigger } from '@/components/concepts/shared/gsapSetup';
import KeyValue from './KeyValue';
import Plate from './Plate';
import SectionRule from './SectionRule';
import { ClipText } from './systemStations';
import { useReveal } from './useReveal';

type Perspective = { label: string; desc: string; weight: string };
type Stage = { num: string; name: string; desc: string; always: boolean };
type PlateMsg = { fig: string; caption: string; alt: string };

const WEIGHTS = { src: '/images/app/perspective-weights-wizard.png', w: 1490, h: 1154, region: { x: 340, y: 288, w: 820, h: 547 } };
const STAGES = { src: '/images/app/evaluation-stages-config.png', w: 806, h: 797 };

/* Donut geometry: viewBox 640×360, centre (320,180), r 110, stroke 18. */
const VB = { w: 640, h: 360 };
const C = { x: 320, y: 180, r: 110 };
const ARCS = [
  `M${C.x} ${C.y - C.r} A${C.r} ${C.r} 0 0 1 ${C.x + C.r} ${C.y}`,
  `M${C.x + C.r} ${C.y} A${C.r} ${C.r} 0 0 1 ${C.x} ${C.y + C.r}`,
  `M${C.x} ${C.y + C.r} A${C.r} ${C.r} 0 0 1 ${C.x - C.r} ${C.y}`,
  `M${C.x - C.r} ${C.y} A${C.r} ${C.r} 0 0 1 ${C.x} ${C.y - C.r}`,
];
const K = 124 * 0.7071;
const CALLOUTS = [
  { d: `M${C.x + K} ${C.y - K} L${C.x + 112} 68 H${C.x + 130}`, x: C.x + 136, y: 72, anchor: 'start' as const },
  { d: `M${C.x + K} ${C.y + K} L${C.x + 112} 292 H${C.x + 130}`, x: C.x + 136, y: 296, anchor: 'start' as const },
  { d: `M${C.x - K} ${C.y + K} L${C.x - 112} 292 H${C.x - 130}`, x: C.x - 136, y: 296, anchor: 'end' as const },
  { d: `M${C.x - K} ${C.y - K} L${C.x - 112} 68 H${C.x - 130}`, x: C.x - 136, y: 72, anchor: 'end' as const },
];

function parseNumber(text: string) {
  const m = text.match(/^\s*([\d.,]+)(.*)$/);
  return m ? { n: parseFloat(m[1].replace(',', '.')), suffix: m[2] } : { n: 0, suffix: '' };
}

/**
 * §04 Proceso. A HOLD section: the `[data-hold]` block (title + lead) pins under the
 * header for 55vh while its beat draws, so the page waits for the reveal (`sections.ts`).
 * Every other reveal here is already positional (scrubbed), so nothing inside it is timed.
 * Left: the weights donut draws its four 25% arcs in sequence (wet), each
 * callout leader draws and its label wipes, the centre counts to 100 %, then the arcs dry
 * to four monochrome tones and "Total 100 / 100" turns accent (scrubbed). Right: the six
 * stages light up as they cross 55% of the viewport while an accent rail grows (scrubbed).
 */
export default function ProcesoA() {
  const t = useTranslations('conceptA');
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);

  const perspectives = t.raw('proceso.weights.perspectives') as Perspective[];
  const stages = t.raw('proceso.stages.items') as Stage[];
  const weightsPlate = t.raw('proceso.weights.plate') as PlateMsg;
  const stagesPlate = t.raw('proceso.stages.plate') as PlateMsg;

  useEffect(() => {
    const section = ref.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const donutWrap = section.querySelector<HTMLElement>('.a-donut-wrap');
      const svg = donutWrap?.querySelector<SVGSVGElement>('svg') ?? null;
      const arcs = Array.from(section.querySelectorAll<SVGPathElement>('.a-donut-arc'));
      const leaders = Array.from(section.querySelectorAll<SVGPathElement>('.a-donut-leader'));
      const clips = Array.from(section.querySelectorAll<SVGRectElement>('.a-donut-wrap [data-clip]'));
      const centerNum = section.querySelector<HTMLElement>('.a-donut-center [data-count]');
      const totalLabel = section.querySelector<HTMLElement>('.a-donut-center .a-label');
      const list = section.querySelector<HTMLElement>('.a-stages');
      const rail = list?.querySelector<HTMLElement>('.a-rail') ?? null;
      const stageRows = Array.from(section.querySelectorAll<HTMLElement>('.a-stage'));

      const mm = gsap.matchMedia();
      // `reduce` complements `noReduce` so the callback always runs (final states included).
      mm.add({ noReduce: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' }, (mctx) => {
        const { noReduce } = mctx.conditions as { noReduce: boolean };
        if (!noReduce) {
          arcs.forEach((a, i) => a.setAttribute('data-tone', String(i + 1)));
          totalLabel?.setAttribute('data-accent', 'true');
          stageRows.forEach((r) => r.classList.add('is-lit'));
          return;
        }

        /* ---- donut ---- */
        if (svg && donutWrap && arcs.length === 4) {
          const arcLens = arcs.map((a) => a.getTotalLength());
          const leaderLens = leaders.map((l) => l.getTotalLength());
          arcs.forEach((a, i) => gsap.set(a, { strokeDasharray: arcLens[i], strokeDashoffset: arcLens[i] }));
          leaders.forEach((l, i) => gsap.set(l, { strokeDasharray: leaderLens[i], strokeDashoffset: leaderLens[i] }));
          svg.classList.remove('a-svg-pending');

          // Scrubbed like a director window, and locked the same way: the arcs, the counter
          // and the `data-tone`/`data-accent` sets stay at their final state once the donut
          // has passed its end line (`proceso` is not `reversible`).
          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: donutWrap,
              start: 'top 75%',
              end: 'center 45%',
              scrub: 0.5,
              invalidateOnRefresh: true,
              onLeave: (self) => {
                self.getTween()?.kill();
                self.kill(false, true);
                tl.progress(1);
              },
            },
          });
          arcs.forEach((a, i) => {
            const at = 0.22 * i;
            tl.set(a, { attr: { 'data-wet': 'true' } }, at);
            tl.fromTo(a, { strokeDashoffset: arcLens[i] }, { strokeDashoffset: 0, duration: 0.22 }, at);
            if (leaders[i]) tl.fromTo(leaders[i], { strokeDashoffset: leaderLens[i] }, { strokeDashoffset: 0, duration: 0.06 }, at + 0.12);
            if (clips[i]) tl.fromTo(clips[i], { attr: { width: 0 } }, { attr: { width: 1 }, duration: 0.05 }, at + 0.17);
          });
          if (centerNum) {
            const parsed = parseNumber(centerNum.dataset.count ?? '');
            const proxy = { v: 0 };
            centerNum.textContent = `0${parsed.suffix}`;
            tl.to(
              proxy,
              {
                v: parsed.n,
                duration: 0.88,
                onUpdate: () => {
                  centerNum.textContent = `${Math.round(proxy.v)}${parsed.suffix}`;
                },
              },
              0
            );
          }
          arcs.forEach((a, i) => {
            tl.set(a, { attr: { 'data-wet': 'false', 'data-tone': String(i + 1) } }, 0.88 + 0.03 * i);
          });
          if (totalLabel) tl.set(totalLabel, { attr: { 'data-accent': 'true' } }, 0.97);
          tl.to({}, { duration: 0.03 }, 0.97);
        }

        /* ---- stages ---- */
        if (list && rail) {
          // Deliberately reversible: the rail is a position readout for the stage list, not
          // a reveal — it tracks how far down the list the reader is, in both directions.
          gsap.fromTo(rail, { scaleY: 0 }, {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: list,
              start: 'top 60%',
              end: 'bottom 60%',
              scrub: 0.4,
              invalidateOnRefresh: true,
            },
          });
        }
        // Lit once, lit for good (`proceso` is not `reversible`): the class is only ever
        // added, so a stage that has been read stays lit on the way back up. `toggleClass`
        // would take it off again at `onLeaveBack`.
        stageRows.forEach((row) => {
          const light = () => row.classList.add('is-lit');
          const st = ScrollTrigger.create({
            trigger: row,
            start: 'top 55%',
            onEnter: light,
            onEnterBack: light,
            invalidateOnRefresh: true,
          });
          if (st.progress > 0) light();
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  const center = t('proceso.weights.center');

  return (
    <section id="proceso" data-section="proceso" ref={ref} className="a-section">
      <div className="a-container">
        <SectionRule code={t('proceso.code')} runningHead={t('proceso.runningHead')} />
        {/* The hold block: it pins under the header while this beat draws. */}
        <div data-hold>
          <div className="a-cols" data-rv-group>
            <h2 className="a-h2 rv-lines col-span-4 md:col-span-8">{t('proceso.title')}</h2>
            <p className="a-lead rv-lines col-span-4 md:col-span-6" data-rv-delay="0.15" style={{ marginTop: 24 }}>
              {t('proceso.lead')}
            </p>
          </div>
        </div>

        <div className="a-cols" style={{ marginTop: 64, rowGap: 64 }}>
          {/* 4.1 Ponderaciones */}
          <div className="col-span-4 md:col-span-6 a-proc-col">
            <div data-rv-group>
              <p className="a-label rv-wipe">
                {t('proceso.weights.index')} / {t('proceso.weights.label')}
              </p>
              <p className="a-body-sm rv-lines">{t('proceso.weights.sub')}</p>
            </div>

            <div className="a-donut-wrap">
              <svg className="a-donut a-svg-pending" viewBox={`0 0 ${VB.w} ${VB.h}`} aria-hidden="true">
                {ARCS.map((d, i) => (
                  <path key={`t${i}`} className="a-donut-track" d={d} />
                ))}
                {ARCS.map((d, i) => (
                  <path key={`a${i}`} className="a-draw a-donut-arc" data-wet="false" d={d} />
                ))}
                <g className="a-donut-callouts">
                  {CALLOUTS.map((c, i) => (
                    <g key={i}>
                      <path className="a-donut-leader" d={c.d} />
                      <ClipText p="donut" id={`w${i}`} x={c.x} y={c.y} anchor={c.anchor} className="a-svg-label a-svg-label-sm">
                        {perspectives[i]?.label} · {perspectives[i]?.weight}
                      </ClipText>
                    </g>
                  ))}
                </g>
              </svg>
              <div className="a-donut-center">
                <span className="a-num-md a-tabular" data-count={center}>
                  {center}
                </span>
                <span className="a-label" data-accent="false">
                  {t('proceso.weights.total')}
                </span>
              </div>
            </div>

            <KeyValue rows={perspectives.map((p) => ({ key: p.label, value: p.desc }))} />
            <p className="a-code a-proc-simulate">{t('proceso.weights.simulate')}</p>

            <div data-rv-group data-rv-start="top 85%" style={{ marginTop: 32 }}>
              <Plate
                src={WEIGHTS.src}
                naturalW={WEIGHTS.w}
                naturalH={WEIGHTS.h}
                region={WEIGHTS.region}
                fig={weightsPlate.fig}
                caption={weightsPlate.caption}
                alt={weightsPlate.alt}
                sizes="(min-width: 768px) 46vw, 100vw"
                reveal="rv-wipe-up"
              />
            </div>
          </div>

          {/* 4.2 Etapas */}
          <div className="col-span-4 md:col-start-7 md:col-span-6 a-proc-col">
            <p className="a-label rv-wipe">
              {t('proceso.stages.index')} / {t('proceso.stages.label')}
            </p>
            <div className="a-stages" data-rv-group>
              <span className="a-rail" aria-hidden="true" />
              {stages.map((s) => (
                <div key={s.num} className="a-stage rv-wipe">
                  <span className="a-index">{s.num}</span>
                  <div>
                    <h3 className="a-h4 rv-lines">{s.name}</h3>
                    <p className="a-body-sm">{s.desc}</p>
                  </div>
                  <span className="a-stage-state">{s.always ? t('proceso.stages.alwaysOn') : t('proceso.stages.configurable')}</span>
                </div>
              ))}
            </div>
            <div className="a-proc-notes" data-rv-group>
              <p className="a-body-sm rv-lines">{t('proceso.stages.central')}</p>
              <p className="a-code rv-lines">{t('proceso.stages.freeze')}</p>
            </div>
            <Plate
              src={STAGES.src}
              naturalW={STAGES.w}
              naturalH={STAGES.h}
              width={420}
              height={415}
              fig={stagesPlate.fig}
              caption={stagesPlate.caption}
              alt={stagesPlate.alt}
              sizes="420px"
              reveal="rv-wipe-up"
              style={{ maxWidth: 420 }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
