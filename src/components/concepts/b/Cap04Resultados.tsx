'use client';

import { Fragment, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from '@/components/concepts/shared/gsapSetup';
import ChapterOpener from './ChapterOpener';
import Plate from './Plate';
import { EASE, MQ, countTo, useMotion, type MotionKit } from './motion';

type ScaleItem = { n: string; label: string };

const RING_R = 118;
const RING_C = 2 * Math.PI * RING_R; // ≈ 741.4

/**
 * Cap. 04 · Resultados — scrubbed achievement figure (0 → 3.83) with the ring
 * arc filling, facts, the Likert line unmasking word by word (with "Siempre"
 * underlined in accent), a hand-drawn suggestion box, and Lámina 09 wiping up.
 */
export default function Cap04Resultados() {
  const t = useTranslations('conceptB');
  const facts = t.raw('cap04.facts') as string[];
  const scale = t.raw('cap04.scale') as ScaleItem[];
  const figureValue = t('cap04.figure.value');
  const finalOffset = RING_C * (1 - Number(figureValue) / 5);

  const root = useRef<HTMLElement>(null);
  const spread = useRef<HTMLDivElement>(null);
  const figRef = useRef<HTMLSpanElement>(null);
  const arcRef = useRef<SVGCircleElement>(null);
  const plateBox = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const build = useCallback((kit: MotionKit) => {
    const { mm, q } = kit;
    mm.add(MQ.motion, () => {
      const s = spread.current;
      if (!s) return;

      /* Scrubbed: figure and arc. */
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: s, start: 'top 75%', end: 'top 25%', scrub: 0.7 },
      });
      const fig = figRef.current;
      if (fig) {
        const value = Number(fig.dataset.value ?? 0);
        tl.add(countTo(fig, value, { from: 0, decimals: 2, ease: 'none', duration: 1 }), 0);
        if (arcRef.current) {
          tl.fromTo(arcRef.current, { strokeDashoffset: RING_C }, { strokeDashoffset: RING_C * (1 - value / 5), duration: 1 }, 0);
        }
      }

      /* Once: facts, Likert words, accent underline, drawn box. */
      const once = gsap.timeline({ scrollTrigger: { trigger: s, start: 'top 60%', once: true }, defaults: { ease: EASE.reveal } });
      const factSpans = q('.b-ruled .b-mask > span', s);
      if (factSpans.length) once.fromTo(factSpans, { yPercent: 100, opacity: 1 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, stagger: 0.08 }, 0.1);
      const scaleWords = q('.b-scale .b-mask-inline > span', s);
      if (scaleWords.length) once.fromTo(scaleWords, { yPercent: 110, opacity: 1 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, stagger: 0.08 }, 0.2);
      const ul = q('.b-scale .b-ul', s);
      if (ul.length) once.to(ul, { backgroundSize: '100% 2px', duration: 0.4 }, 0.85);
      const box = boxRef.current;
      if (box) {
        q('.b-box-drawn > i', box).forEach((side, i) => {
          const horizontal = i % 2 === 0;
          once.fromTo(
            side,
            horizontal ? { scaleX: 0, autoAlpha: 1 } : { scaleY: 0, autoAlpha: 1 },
            horizontal ? { scaleX: 1, duration: 0.15, ease: 'none' } : { scaleY: 1, duration: 0.15, ease: 'none' },
            0.6 + i * 0.15
          );
        });
        const text = box.querySelectorAll('.r-fade');
        if (text.length) once.fromTo(text, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 1.2);
      }
    });

    /* Lámina 09, bottom→top. Two columns (md+): scrubbed with the figure, keyed to the
       spread. Stacked (phones): the plate sits ~650px below the spread top, after the
       ring, facts and scale, so a spread-keyed scrub would finish off-screen; it gets
       its own once-trigger instead. */
    const wipe = { clipPath: 'inset(100% 0% 0% 0%)', autoAlpha: 1 };
    mm.add(MQ.md, () => {
      const s = spread.current;
      const box = plateBox.current;
      if (!s || !box) return;
      gsap.fromTo(box, wipe, {
        clipPath: 'inset(0% 0% 0% 0%)',
        ease: 'none',
        scrollTrigger: { trigger: s, start: 'top 75%', end: 'top 25%', scrub: 0.7 },
      });
    });
    mm.add(MQ.mobile, () => {
      const box = plateBox.current;
      if (!box) return;
      gsap.fromTo(box, wipe, {
        clipPath: 'inset(0% 0% 0% 0%)',
        duration: 1.0,
        ease: EASE.reveal,
        scrollTrigger: { trigger: box, start: 'top 85%', once: true },
      });
    });
  }, []);

  useMotion(root, build);

  return (
    <section id="cap-04-resultados" ref={root} data-chapter={t('cap04.runningHead')} className="b-chapter">
      <ChapterOpener numeral={t('cap04.numeral')} folio={t('cap04.folio')} title={t('cap04.title')} lede={t('cap04.lede')} />

      <div className="b-container">
        <div ref={spread} className="b-spread b-grid">
          <div className="b-c1-5">
            <div className="b-ring">
              <svg viewBox="0 0 240 240" aria-hidden="true">
                <circle className="b-ring-track" cx="120" cy="120" r={RING_R} />
                <circle
                  ref={arcRef}
                  className="b-ring-arc"
                  cx="120"
                  cy="120"
                  r={RING_R}
                  strokeDasharray={RING_C}
                  strokeDashoffset={finalOffset}
                  strokeLinecap="butt"
                />
              </svg>
              <div style={{ textAlign: 'center', position: 'relative' }}>
                <span ref={figRef} className="b-figure-xl b-tnum r-count" data-value={figureValue}>
                  {figureValue}
                </span>
                <span className="b-label" style={{ display: 'block', marginTop: 6 }}>
                  {t('cap04.figure.of')} · {t('cap04.figure.label')}
                </span>
              </div>
            </div>
            <p className="b-folio" style={{ marginTop: 12, whiteSpace: 'normal' }}>
              {t('cap04.figure.example')}
            </p>

            <ul className="b-ruled" style={{ marginTop: 24 }}>
              {facts.map((f) => (
                <li key={f}>
                  <span className="b-square" style={{ alignSelf: 'center' }} aria-hidden="true" />
                  <span className="b-mask" style={{ flex: '1 1 auto' }}>
                    <span className="r-text">{f}</span>
                  </span>
                </li>
              ))}
            </ul>

            <p className="b-label" style={{ marginTop: 28 }}>
              {t('cap04.scaleLabel')}
            </p>
            <p className="b-scale" style={{ margin: '8px 0 0' }}>
              {scale.map((s, i) => (
                <Fragment key={s.n}>
                  {i > 0 && (
                    <span className="b-sep" aria-hidden="true">
                      ·
                    </span>
                  )}
                  <span className="b-mask-inline">
                    <span className="r-text">
                      <span className="b-n">{s.n}</span>
                      <span className={i === scale.length - 1 ? 'b-ul' : undefined}>{s.label}</span>
                    </span>
                  </span>
                </Fragment>
              ))}
            </p>

            <div ref={boxRef} className="b-box-drawn" style={{ marginTop: 28 }}>
              <i className="r-rule" aria-hidden="true" />
              <i className="r-rule-v" aria-hidden="true" />
              <i className="r-rule" aria-hidden="true" />
              <i className="r-rule-v" aria-hidden="true" />
              <p className="b-label r-fade">{t('cap04.suggestion.title')}</p>
              <p className="b-small r-fade" style={{ marginTop: 6, display: 'block' }}>
                {t('cap04.suggestion.body')}
              </p>
            </div>
          </div>

          <div className="b-c6-12">
            <Plate
              id="answering"
              className="r-wipe r-wipe-down"
              boxRef={plateBox}
              folio={t('cap04.plate.folio')}
              caption={t('cap04.plate.caption')}
              alt={t('cap04.plate.alt')}
              sizes="(min-width: 1280px) 699px, (min-width: 768px) 55vw, 100vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
