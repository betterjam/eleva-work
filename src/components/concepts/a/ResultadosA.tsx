'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from '@/components/concepts/shared/gsapSetup';
import Plate from './Plate';
import SectionRule from './SectionRule';
import { useSectionDirector } from './director/SectionDirector';
import { useReveal } from './useReveal';

type LikertItem = { num: string; name: string };
type PlateMsg = { fig: string; caption: string; alt: string };

const ANSWERING = {
  src: '/images/app/evaluation-answering-360.png',
  w: 1305,
  h: 1104,
  region: { x: 250, y: 0, w: 880, h: 733 },
  mobile: { x: 250, y: 0, w: 880, h: 660 },
};

/* Mini ring: r 20 → circumference 125.66; 3.83/5 = 76.6 % → offset 29.4 */
const RING_LEN = 2 * Math.PI * 20;
const RING_OFFSET = RING_LEN * (1 - 0.766);

/**
 * §05 Resultados. A HOLD section: the `[data-hold]` block (title + lead) pins under the
 * header for 55vh while its beat draws. The answering plate reveals through a double mask
 * (container clip top→bottom + image slide). The typographic column is one BEAT handed to
 * the Section Director — scrubbed across its window at every width and locked at
 * completion: separators draw, the achievement ring fills to 3.83/5, the digits flip in
 * one by one, 32 counts up, and the five Likert boxes tint in order — neutral, nothing
 * "selected".
 */
export default function ResultadosA() {
  const t = useTranslations('conceptA');
  const ref = useRef<HTMLElement>(null);
  const colRef = useRef<HTMLDivElement>(null);
  const { registerBeat } = useSectionDirector();
  useReveal(ref);

  const items = t.raw('resultados.escala.items') as LikertItem[];
  const plate = t.raw('resultados.plate') as PlateMsg;
  const logroValue = t('resultados.logro.value');
  const progresoValue = t('resultados.progreso.value');
  const progresoMatch = progresoValue.match(/^\s*(\d+)(.*)$/);
  const progresoCount = progresoMatch ? progresoMatch[1] : progresoValue;
  const progresoRest = progresoMatch ? progresoMatch[2] : '';

  useEffect(() => {
    const col = colRef.current;
    if (!col) return;

    let unregister = () => {};
    const ctx = gsap.context(() => {
      const hrs = Array.from(col.querySelectorAll<HTMLElement>('.a-res-hr'));
      const ring = col.querySelector<SVGCircleElement>('.a-res-ring');
      const digits = Array.from(col.querySelectorAll<HTMLElement>('.a-res-logro .rv-mask > span'));
      const countEl = col.querySelector<HTMLElement>('[data-count]');
      const boxes = Array.from(col.querySelectorAll<HTMLElement>('.a-likert-box'));
      const target = countEl ? parseInt(countEl.dataset.count ?? '0', 10) : 0;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // The stylesheet renders every other final state; the boxes carry theirs in an attribute.
        gsap.set(boxes, { attr: { 'data-filled': 'true' } });
        return;
      }

      // Durations are proportions of the window, not seconds.
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
      if (hrs.length) tl.fromTo(hrs, { scaleX: 0 }, { scaleX: 1, duration: 0.3, stagger: 0.05, ease: 'reveal' }, 0);
      if (ring) tl.fromTo(ring, { strokeDashoffset: RING_LEN }, { strokeDashoffset: RING_OFFSET, duration: 0.4, ease: 'settle' }, 0.05);
      // The stylesheet parks the digit at translateY(110%); GSAP reads that as a pixel `y`,
      // so it must be cleared explicitly or the digit ends one line too low.
      if (digits.length) tl.fromTo(digits, { y: 0, yPercent: 110 }, { yPercent: 0, duration: 0.25, stagger: 0.06, ease: 'snap' }, 0.05);
      if (countEl) tl.fromTo(countEl, { textContent: 0 }, { textContent: target, snap: { textContent: 1 }, duration: 0.35 }, 0.25);
      boxes.forEach((box, k) => tl.set(box, { attr: { 'data-filled': 'true' } }, 0.45 + 0.08 * k));
      tl.to({}, { duration: 0.1 }, 0.9);
      unregister = registerBeat(col, tl, { enterAt: 75, settleAt: 40, id: 'resultados/readout' });
    }, col);

    return () => {
      unregister();
      ctx.revert();
    };
  }, [registerBeat]);

  return (
    <section id="resultados" data-section="resultados" ref={ref} className="a-section">
      <div className="a-container">
        <SectionRule code={t('resultados.code')} runningHead={t('resultados.runningHead')} />
        {/* The hold block: it pins under the header while this beat draws. */}
        <div data-hold>
          <div className="a-cols" data-rv-group>
            <h2 className="a-h2 rv-lines col-span-4 md:col-span-8">{t('resultados.title')}</h2>
            <p className="a-lead rv-lines col-span-4 md:col-span-6" data-rv-delay="0.15" style={{ marginTop: 24 }}>
              {t('resultados.lead')}
            </p>
          </div>
        </div>

        <div className="a-cols" style={{ marginTop: 64, rowGap: 48 }}>
          <div className="col-span-4 md:col-span-12 lg:col-span-8" data-rv-group data-rv-start="top 75%">
            <Plate
              src={ANSWERING.src}
              naturalW={ANSWERING.w}
              naturalH={ANSWERING.h}
              region={ANSWERING.region}
              mobileRegion={ANSWERING.mobile}
              fig={plate.fig}
              caption={plate.caption}
              alt={plate.alt}
              sizes="(min-width: 768px) 62vw, 100vw"
              reveal="rv-wipe-down"
            />
          </div>

          <div ref={colRef} className="col-span-4 md:col-span-12 lg:col-start-9 lg:col-span-4 a-res-col" data-rv-manual>
            <div className="a-res-grid-m">
              <div className="a-res-block">
                <p className="a-label">{t('resultados.logro.label')}</p>
                <div className="a-res-logro">
                  <span className="a-num-lg a-tabular">
                    <span className="a-sr-only">{logroValue}</span>
                    {Array.from(logroValue).map((ch, i) => (
                      <span key={i} className="rv-mask" aria-hidden="true">
                        <span>{ch}</span>
                      </span>
                    ))}
                  </span>
                  <span className="a-code">{t('resultados.logro.unit')}</span>
                  <svg className="a-mini-ring" viewBox="0 0 44 44" aria-hidden="true">
                    <circle className="a-draw-thin" cx={22} cy={22} r={20} />
                    <circle
                      className="a-draw a-res-ring"
                      data-wet="true"
                      cx={22}
                      cy={22}
                      r={20}
                      transform="rotate(-90 22 22)"
                      strokeDasharray={RING_LEN.toFixed(2)}
                      strokeDashoffset={RING_OFFSET.toFixed(2)}
                    />
                  </svg>
                </div>
                <p className="a-label">{t('resultados.logro.note')}</p>
              </div>
              <span className="a-res-hr" aria-hidden="true" />
              <div className="a-res-block">
                <p className="a-label">{t('resultados.progreso.label')}</p>
                <span className="a-num a-tabular">
                  <span data-count={progresoCount}>{progresoCount}</span>
                  {progresoRest}
                </span>
                <p className="a-label">{t('resultados.progreso.note')}</p>
              </div>
            </div>
            <span className="a-res-hr" aria-hidden="true" />
            <div className="a-res-block">
              <p className="a-label">{t('resultados.escala.label')}</p>
              <div className="a-likert">
                {items.map((it) => (
                  <div key={it.num} className="a-likert-cell">
                    <span className="a-likert-box" data-filled="false">
                      {it.num}
                    </span>
                    <span className="a-likert-name">{it.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <span className="a-res-hr" aria-hidden="true" />
            <div className="a-res-block">
              <p className="a-label-2">{t('resultados.dominio.label')}</p>
              <p className="a-h4">{t('resultados.dominio.value')}</p>
            </div>
            <span className="a-res-hr" aria-hidden="true" />
            <div className="a-res-block">
              <p className="a-label">{t('resultados.sugerencia.label')}</p>
              <p className="a-body-sm">{t('resultados.sugerencia.text')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
