'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap, ScrollTrigger } from '@/components/concepts/shared/gsapSetup';
import Plate from './Plate';
import SectionRule from './SectionRule';
import { useReveal } from './useReveal';
import { Connectors, LOGRO_OFFSET, SLOTS, STATIONS, STATION_VIEWBOX, type SystemLabels } from './systemStations';

type IndexItem = { num: string; label: string; sentence: string };
type PlateMsg = { fig: string; caption: string; alt: string };
type NodeMsg = { name: string; code: string };
type PerspectiveMsg = { label: string; weight: string };

/** Slot crops (natural px), ratio 1.45 each. The org chart starts below the app's header strip
    (its role counters stay out of the crop; the Sostenedor node stays centred). */
const SLOT_PLATES = [
  { src: '/images/app/org-chart-editor.png', w: 1540, h: 1162, region: { x: 200, y: 140, w: 1340, h: 924 } },
  { src: '/images/app/perspective-weights-wizard.png', w: 1490, h: 1154, region: { x: 340, y: 288, w: 820, h: 565 } },
  { src: '/images/app/generated-evaluation-rubric.png', w: 1390, h: 951, region: { x: 415, y: 170, w: 975, h: 672 } },
  { src: '/images/app/evaluation-answering-360.png', w: 1305, h: 1104, region: { x: 250, y: 0, w: 880, h: 607 } },
];

type Geo = SVGGeometryElement & { dataset: DOMStringMap };

/** Measure every `.a-draw`, hide it with its own dash length, and un-hide the SVG. */
function prepDraws(svg: SVGSVGElement) {
  const lens = new Map<Geo, number>();
  svg.querySelectorAll<Geo>('.a-draw').forEach((el) => {
    const len = el.getTotalLength();
    lens.set(el, len);
    gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
  });
  svg.classList.remove('a-svg-pending');
  return lens;
}

function parseNumber(text: string): { n: number; suffix: string } {
  const m = text.match(/^\s*([\d.,]+)(.*)$/);
  if (!m) return { n: 0, suffix: '' };
  return { n: parseFloat(m[1].replace(',', '.')), suffix: m[2] };
}

/**
 * §01 The system. Desktop (≥1024, motion allowed): 260vh pin, scrubbed drawing of
 * four stations, "wet ink" strokes that dry stage by stage, wiped readouts (the only
 * counter is the 100 % weighting ring, an example), four screenshot plates tipped in as
 * each stage completes, index rows + readout. Otherwise a stacked
 * `SystemMobile` (one station per figure, once-only draw). Every value the timeline
 * needs is read back from the DOM (data-* attributes), so the effect runs once.
 */
export default function SystemSheet() {
  const t = useTranslations('conceptA');
  const sectionRef = useRef<HTMLElement>(null);
  useReveal(sectionRef);

  const index = t.raw('system.index') as IndexItem[];
  const plates = t.raw('system.plates') as PlateMsg[];
  const L: SystemLabels = {
    index,
    nodes: t.raw('system.diagram.nodes') as NodeMsg[],
    catalogTitle: t('system.diagram.catalogTitle'),
    catalogNote: t('system.diagram.catalogNote'),
    perspectives: t.raw('system.diagram.perspectives') as PerspectiveMsg[],
    ringCenter: t('system.diagram.ringCenter'),
    ringLabel: t('system.diagram.ringLabel'),
    bank: t('system.diagram.bank'),
    rubric: t('system.diagram.rubric'),
    rubricLine: t('system.diagram.rubricLine'),
    rubricNote: t('system.diagram.rubricNote'),
    criteria: t.raw('system.diagram.criteria') as string[],
    stages: t.raw('system.diagram.stages') as string[],
    logroLabel: t('system.diagram.logroLabel'),
    logroValue: t('system.diagram.logroValue'),
    logroUnit: t('system.diagram.logroUnit'),
    exampleTag: t('system.diagram.exampleTag'),
  };
  const readouts = ['01', '02', '03', '04'].map((c) => t('system.progress', { current: c }));

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      // `reduce` complements `noReduce` so the callback always runs (matchMedia only calls
      // it when at least one condition matches).
      mm.add(
        {
          isDesktop: '(min-width: 1024px)',
          noReduce: '(prefers-reduced-motion: no-preference)',
          reduce: '(prefers-reduced-motion: reduce)',
        },
        (mctx) => {
          const { isDesktop, noReduce } = mctx.conditions as { isDesktop: boolean; noReduce: boolean };
          if (!noReduce) {
            // Final states: CSS shows the strokes; only the data-driven fills need a nudge.
            gsap.set(section.querySelectorAll('.a-node'), { attr: { 'data-fill': 'dry' } });
            gsap.set(section.querySelectorAll('[data-draw="logro"]'), { attr: { 'data-wet': 'true' } });
            return;
          }
          return isDesktop ? buildDesktop(section) : buildMobile(section);
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const refresh = () => ScrollTrigger.refresh();

  return (
    <section
      id="system"
      data-section="system"
      ref={sectionRef}
      className="a-section a-sheet"
      style={{ paddingBlock: 0 }}
    >
      {/* ---------- Desktop: pinned drawing ---------- */}
      <div className="a-sys-desk" data-rv-manual>
        <div className="a-sys-pin">
          <div className="a-container">
            <div className="a-cols">
              <div className="col-span-4 md:col-span-3 a-sys-side">
                <SectionRule code={t('system.code')} runningHead={t('system.runningHead')} />
                <h2 className="a-h2">{t('system.title')}</h2>
                <p className="a-body">{t('system.lead')}</p>
                <div className="a-sys-index" role="list">
                  {index.map((item, i) => (
                    <div
                      key={item.num}
                      className="a-sys-index-row"
                      data-active={i === 0 ? 'true' : 'false'}
                      role="listitem"
                    >
                      <span className="a-nav-num">{item.num}</span>
                      {item.label}
                    </div>
                  ))}
                </div>
                <div className="a-code a-sys-readout" aria-hidden="true" data-readouts={JSON.stringify(readouts)}>
                  <span>{readouts[0]}</span>
                </div>
              </div>

              <div className="col-span-4 md:col-start-4 md:col-span-9">
                <div className="a-sys-stage">
                  <svg className="a-sys-svg a-svg-pending" viewBox="0 0 1200 640" aria-hidden="true">
                    {STATIONS.map((Station, i) => (
                      <Station key={i} p="sd" L={L} />
                    ))}
                    <Connectors />
                  </svg>
                  {SLOT_PLATES.map((sp, i) => (
                    <div key={i} className="a-sys-slot" style={SLOTS[i]}>
                      <Plate
                        src={sp.src}
                        naturalW={sp.w}
                        naturalH={sp.h}
                        region={sp.region}
                        fig={plates[i]?.fig ?? ''}
                        caption={plates[i]?.caption ?? ''}
                        alt={plates[i]?.alt ?? ''}
                        sizes="(min-width: 1024px) 22vw, 100vw"
                        reveal="rv-wipe-up"
                        onLoad={refresh}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Mobile / tablet / reduced motion: stacked stations ---------- */}
      <div className="a-sys-mobile a-section">
        <div className="a-container">
          <SectionRule code={t('system.code')} runningHead={t('system.runningHead')} />
          <div data-rv-group>
            <h2 className="a-h2 rv-lines">{t('system.title')}</h2>
            <p className="a-lead rv-lines" style={{ marginTop: 20 }} data-rv-delay="0.15">
              {t('system.lead')}
            </p>
          </div>
          <div style={{ marginTop: 48 }} data-rv-manual>
            {STATIONS.map((Station, i) => (
              <figure key={i} className="a-sys-fig">
                <div className="a-sys-index-row" data-active="true">
                  <span className="a-nav-num">{index[i]?.num}</span>
                  {index[i]?.label}
                </div>
                <p className="a-body-sm">{index[i]?.sentence}</p>
                <svg className="a-svg-pending" viewBox={STATION_VIEWBOX[i]} aria-hidden="true">
                  <Station p={`sm${i}`} L={L} />
                </svg>
                <Plate
                  src={SLOT_PLATES[i].src}
                  naturalW={SLOT_PLATES[i].w}
                  naturalH={SLOT_PLATES[i].h}
                  region={SLOT_PLATES[i].region}
                  fig={plates[i]?.fig ?? ''}
                  caption={plates[i]?.caption ?? ''}
                  alt={plates[i]?.alt ?? ''}
                  sizes="(min-width: 768px) 60vw, 100vw"
                  reveal="rv-wipe-up"
                />
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop choreography (positions are fractions of a 1-unit timeline)  */
/* ------------------------------------------------------------------ */
function buildDesktop(section: HTMLElement): (() => void) | undefined {
  const pin = section.querySelector<HTMLElement>('.a-sys-pin');
  const svg = section.querySelector<SVGSVGElement>('.a-sys-desk svg.a-sys-svg');
  if (!pin || !svg) return;
  const restores: (() => void)[] = [];
  const slots = Array.from(section.querySelectorAll<HTMLElement>('.a-sys-slot'));
  const rows = Array.from(section.querySelectorAll<HTMLElement>('.a-sys-index-row'));
  const readoutWrap = section.querySelector<HTMLElement>('.a-sys-readout');
  const readout = readoutWrap?.querySelector<HTMLElement>('span') ?? null;
  let readouts: string[] = [];
  try {
    readouts = JSON.parse(readoutWrap?.dataset.readouts ?? '[]') as string[];
  } catch {
    readouts = [];
  }
  const lens = prepDraws(svg);

  const D = (name: string) => svg.querySelector<Geo>(`[data-draw="${name}"]`) as Geo;
  const C = (id: string) => svg.querySelector<SVGRectElement>(`[data-clip="${id}"]`) as SVGRectElement;
  const crit = (i: number) => svg.querySelector<SVGTextElement>(`[data-crit="${i}"]`) as SVGTextElement;
  const ringCenter = svg.querySelector<SVGTextElement>('[data-text="ringCenter"]');

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: pin,
      start: 'top top',
      end: '+=260%',
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
      /* Gentle settle to the nearest station, only once the user has clearly stopped
         (nearest label, not directional; never advances a station on a single wheel notch). */
      snap: {
        snapTo: 'labels',
        delay: 0.3,
        duration: { min: 0.4, max: 0.9 },
        inertia: true,
        ease: 'settle',
      },
    },
  });
  tl.addLabel('s1', 0).addLabel('s2', 0.25).addLabel('s3', 0.5).addLabel('s4', 0.75).addLabel('end', 1);

  const wet = (els: Element | Element[], at: number, on = true) =>
    tl.set(els, { attr: { 'data-wet': on ? 'true' : 'false' } }, at);
  const draw = (name: string, at: number, dur: number, finalOffset = 0) => {
    const el = D(name);
    if (!el) return;
    const len = lens.get(el) ?? 0;
    wet(el, at);
    tl.fromTo(el, { strokeDashoffset: len }, { strokeDashoffset: finalOffset, duration: dur }, at);
  };
  const wipe = (id: string, at: number, dur: number) => {
    const rect = C(id);
    if (rect) tl.fromTo(rect, { attr: { width: 0 } }, { attr: { width: 1 }, duration: dur }, at);
  };
  const wipeUp = (id: string, at: number, dur: number) => {
    const rect = C(id);
    if (rect) tl.fromTo(rect, { attr: { y: 1, height: 0 } }, { attr: { y: 0, height: 1 }, duration: dur }, at);
  };
  const slot = (i: number, at: number, dur: number) => {
    const body = slots[i]?.querySelector<HTMLElement>('.a-plate-body');
    if (body) tl.fromTo(body, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: dur }, at);
  };
  const lit = (el: Element | null, at: number, on = true) => {
    if (el) tl.set(el, { attr: { 'data-lit': on ? 'true' : 'false' } }, at);
  };

  /* ---- S1 · Estructura ---- */
  draw('r1', 0.0, 0.07);
  wipe('n0', 0.04, 0.03);
  wipe('c0', 0.045, 0.025);
  draw('r2', 0.04, 0.07);
  wipe('n1', 0.08, 0.03);
  wipe('c1', 0.085, 0.025);
  draw('r3', 0.08, 0.07);
  wipe('n2', 0.12, 0.03);
  wipe('c2', 0.125, 0.025);
  draw('e1', 0.09, 0.04);
  draw('e2', 0.13, 0.04);
  wipe('catalog', 0.12, 0.05);
  wipe('catalogNote', 0.16, 0.05);
  slot(0, 0.15, 0.09);
  wet(['r1', 'r2', 'r3', 'e1', 'e2'].map(D).filter(Boolean), 0.22, false);
  draw('c1', 0.22, 0.05);
  wet(D('c1'), 0.29, false);

  /* ---- S2 · Perspectivas ---- */
  draw('arrowUp', 0.26, 0.05);
  wipe('p0', 0.29, 0.02);
  draw('arrowRight', 0.3, 0.05);
  wipe('p1a', 0.33, 0.02);
  wipe('p1b', 0.335, 0.015);
  draw('arrowDown', 0.34, 0.05);
  wipe('p2', 0.37, 0.02);
  draw('arrowLeft', 0.38, 0.05);
  wipe('p3a', 0.41, 0.02);
  wipe('p3b', 0.415, 0.015);
  draw('arc1', 0.28, 0.04);
  draw('arc2', 0.32, 0.04);
  draw('arc3', 0.36, 0.04);
  draw('arc4', 0.4, 0.04);
  if (ringCenter) {
    // Target from data-count (the text itself is mutated below); restored on revert.
    const original = ringCenter.textContent ?? '';
    const ring = parseNumber(ringCenter.dataset.count ?? original);
    const proxy = { v: 0 };
    ringCenter.textContent = `0${ring.suffix}`;
    restores.push(() => {
      ringCenter.textContent = original;
    });
    tl.to(
      proxy,
      {
        v: ring.n,
        duration: 0.16,
        onUpdate: () => {
          ringCenter.textContent = `${Math.round(proxy.v)}${ring.suffix}`;
        },
      },
      0.28
    );
  }
  slot(1, 0.4, 0.09);
  wet(
    ['arrowUp', 'arrowRight', 'arrowDown', 'arrowLeft', 'arc1', 'arc2', 'arc3', 'arc4'].map(D).filter(Boolean),
    0.47,
    false
  );
  draw('c2', 0.47, 0.05);
  wet(D('c2'), 0.54, false);

  /* ---- S3 · Pauta ---- */
  draw('bank', 0.51, 0.05);
  wipe('bank', 0.53, 0.03);
  draw('bankEdge', 0.56, 0.06);
  [0.57, 0.585, 0.6, 0.615].forEach((at, i) => lit(crit(i), at));
  draw('rubric', 0.62, 0.06);
  wipe('rubric', 0.65, 0.03);
  wipe('rubricLine', 0.67, 0.03);
  wipe('rubricNote', 0.69, 0.03);
  slot(2, 0.65, 0.09);
  wet(['bank', 'bankEdge', 'rubric'].map(D).filter(Boolean), 0.72, false);
  [0, 1, 2, 3].forEach((i) => lit(crit(i), 0.72, false));
  draw('c3', 0.72, 0.05);
  wet(D('c3'), 0.79, false);

  /* ---- S4 · Proceso → Resultado ---- */
  draw('rail', 0.76, 0.12);
  const nodes = [0, 1, 2, 3, 4, 5].map((k) => D(`node${k}`)).filter(Boolean);
  for (let k = 0; k < 6; k++) {
    const at = 0.77 + 0.02 * k;
    draw(`node${k}`, at, 0.02);
    if (nodes[k]) tl.set(nodes[k], { attr: { 'data-fill': 'wet' } }, at + 0.01);
    wipe(`stage${k}`, at, 0.03);
  }
  draw('logro', 0.86, 0.08, LOGRO_OFFSET);
  wipeUp('logroNum', 0.9, 0.03);
  wipe('logroLabel', 0.92, 0.03);
  wipe('logroExample', 0.93, 0.03);
  slot(3, 0.88, 0.09);
  wet([D('rail'), ...nodes].filter(Boolean), 0.97, false);
  if (nodes.length) tl.set(nodes, { attr: { 'data-fill': 'dry' } }, 0.97);
  tl.to({}, { duration: 0.03 }, 0.97);

  /* ---- index rows + readout flips at each label ---- */
  [0.25, 0.5, 0.75].forEach((pos, i) => {
    if (rows[i]) tl.set(rows[i], { attr: { 'data-active': 'false' } }, pos);
    if (rows[i + 1]) tl.set(rows[i + 1], { attr: { 'data-active': 'true' } }, pos);
    if (readout && readouts[i + 1]) {
      tl.to(readout, { yPercent: -100, duration: 0.012, immediateRender: false }, pos - 0.012);
      tl.set(readout, { textContent: readouts[i + 1] }, pos);
      tl.fromTo(readout, { yPercent: 100 }, { yPercent: 0, duration: 0.015, immediateRender: false }, pos);
    }
  });

  return () => restores.forEach((fn) => fn());
}

/* ------------------------------------------------------------------ */
/* Mobile / tablet: one once-only draw per station figure               */
/* ------------------------------------------------------------------ */
function buildMobile(section: HTMLElement): (() => void) | undefined {
  const figures = Array.from(section.querySelectorAll<HTMLElement>('.a-sys-mobile .a-sys-fig'));
  const restores: (() => void)[] = [];
  figures.forEach((fig) => {
    const svg = fig.querySelector<SVGSVGElement>('svg');
    if (!svg) return;
    const lens = prepDraws(svg);
    const draws = Array.from(lens.keys());
    const clips = Array.from(svg.querySelectorAll<SVGRectElement>('[data-clip]:not([data-clip-up])'));
    const clipsUp = Array.from(svg.querySelectorAll<SVGRectElement>('[data-clip][data-clip-up]'));
    const crits = Array.from(svg.querySelectorAll<SVGTextElement>('[data-crit]'));
    const nodes = Array.from(svg.querySelectorAll<SVGCircleElement>('.a-node'));
    const ringCenter = svg.querySelector<SVGTextElement>('[data-text="ringCenter"]');
    const plate = fig.querySelector<HTMLElement>('.a-plate-body');
    const img = plate?.querySelector('img');

    const tl = gsap.timeline({
      defaults: { ease: 'reveal' },
      scrollTrigger: { trigger: fig, start: 'top 80%', once: true },
    });
    tl.set(draws, { attr: { 'data-wet': 'true' } }, 0);
    draws.forEach((el, k) => {
      const len = lens.get(el) ?? 0;
      const finalOffset = el.dataset.finalOffset ? parseFloat(el.dataset.finalOffset) : 0;
      tl.fromTo(el, { strokeDashoffset: len }, { strokeDashoffset: finalOffset, duration: 0.9 }, k * 0.06);
    });
    if (clips.length) {
      tl.fromTo(clips, { attr: { width: 0 } }, { attr: { width: 1 }, duration: 0.5, stagger: 0.04 }, 0.3);
    }
    if (clipsUp.length) {
      tl.fromTo(clipsUp, { attr: { y: 1, height: 0 } }, { attr: { y: 0, height: 1 }, duration: 0.5 }, 0.6);
    }
    // The weighting ring (100 %, an example) is the only figure that counts up.
    if (ringCenter) {
      const original = ringCenter.textContent ?? '';
      const ring = parseNumber(ringCenter.dataset.count ?? original);
      const proxy = { v: 0 };
      ringCenter.textContent = `0${ring.suffix}`;
      restores.push(() => {
        ringCenter.textContent = original;
      });
      tl.to(
        proxy,
        {
          v: ring.n,
          duration: 1.1,
          ease: 'settle',
          onUpdate: () => {
            ringCenter.textContent = `${Math.round(proxy.v)}${ring.suffix}`;
          },
        },
        0.3
      );
    }
    crits.forEach((c, i) => tl.set(c, { attr: { 'data-lit': 'true' } }, 0.4 + i * 0.08));
    nodes.forEach((n, i) => tl.set(n, { attr: { 'data-fill': 'wet' } }, 0.3 + i * 0.06));
    if (plate) tl.fromTo(plate, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.9 }, 0.5);
    if (img) tl.fromTo(img, { y: 40 }, { y: 0, duration: 0.9 }, 0.5);
    // dry at the end (the LOGRO arc stays wet)
    const dryable = draws.filter((el) => el.dataset.draw !== 'logro');
    if (dryable.length) tl.set(dryable, { attr: { 'data-wet': 'false' } }, '>-0.05');
    if (nodes.length) tl.set(nodes, { attr: { 'data-fill': 'dry' } }, '<');
    if (crits.length) tl.set(crits, { attr: { 'data-lit': 'false' } }, '<');
  });
  return () => restores.forEach((fn) => fn());
}
