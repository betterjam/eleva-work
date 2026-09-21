'use client';

import { useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from '@/components/concepts/shared/gsapSetup';
import ChapterOpener from './ChapterOpener';
import Plate from './Plate';
import { EASE, MQ, countTo, drawRule, useMotion, type MotionKit } from './motion';

type WeightRow = { name: string; hint: string; value: number };
type Stage = { num: string; name: string; desc: string };

/**
 * Cap. 03 · El proceso 360° — 3a pesos (scrubbed counts + rule draws, plate
 * revealed through a growing circle) and 3b etapas (a rule that grows down
 * the list as each stage lights up; plain scrub, no pin).
 */
export default function Cap03Proceso() {
  const t = useTranslations('conceptB');
  const rows = t.raw('cap03.weights.rows') as WeightRow[];
  const stages = t.raw('cap03.stages.items') as Stage[];
  const unit = t('cap03.weights.unit');
  const totalValue = Number(t.raw('cap03.weights.totalValue')) || 100; // numeric JSON value: read raw

  const root = useRef<HTMLElement>(null);
  const s1 = useRef<HTMLDivElement>(null);
  const s2 = useRef<HTMLDivElement>(null);
  const p1 = useRef<HTMLDivElement>(null);
  const p2 = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const stagesRule = useRef<HTMLSpanElement>(null);
  const noteRule = useRef<HTMLSpanElement>(null);
  const noteText = useRef<HTMLParagraphElement>(null);

  const build = useCallback((kit: MotionKit) => {
    const { mm, q, splitLines } = kit;
    mm.add(MQ.motion, () => {
      const lines = (el: Element | null, delay: number, stagger = 0.08) => {
        if (!el) return;
        splitLines(el, (self) =>
          gsap.from(self.lines, { yPercent: 110, duration: 0.8, stagger, ease: EASE.reveal, delay, scrollTrigger: { trigger: el, start: 'top 80%', once: true } })
        );
      };

      /* ---- 3a Pesos: one scrubbed timeline, no pin ---- */
      if (s1.current) {
        const spread = s1.current;
        lines(spread.querySelector('.b-h3'), 0);
        lines(spread.querySelector('.b-body'), 0.15, 0.05);
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: spread, start: 'top 70%', end: 'top 20%', scrub: 0.8 },
        });
        const wrows = q('.b-wrow:not(.is-total)', spread);
        wrows.forEach((row, i) => {
          const rule = row.querySelector<HTMLElement>('.b-wrule');
          const val = row.querySelector<HTMLElement>('.r-count');
          if (rule) tl.fromTo(rule, { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 0.2 }, i * 0.2);
          if (val) tl.add(countTo(val, Number(val.dataset.value ?? 0), { from: 0, ease: 'none', duration: 0.2, suffix: val.dataset.unit ?? '' }), i * 0.2);
        });
        const totalRow = spread.querySelector<HTMLElement>('.b-wrow.is-total');
        if (totalRow) {
          const rule = totalRow.querySelector<HTMLElement>('.b-wrule');
          const val = totalRow.querySelector<HTMLElement>('.r-count');
          if (val) tl.add(countTo(val, Number(val.dataset.value ?? 0), { from: 0, ease: 'none', duration: 0.8 }), 0);
          if (rule) tl.fromTo(rule, { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 0.2 }, 0.8);
        }
      }


      /* ---- 3b Etapas: growing rule, stages lighting up (plain scrub) ---- */
      if (s2.current) {
        const spread = s2.current;
        lines(spread.querySelector('.b-h3'), 0);
        lines(spread.querySelector('.b-body'), 0.15, 0.05);
        const list = listRef.current;
        if (list) {
          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: list, start: 'top 70%', end: 'bottom 60%', scrub: 0.6 },
          });
          if (stagesRule.current) tl.fromTo(stagesRule.current, { scaleY: 0 }, { scaleY: 1, duration: 1 }, 0);
          q('li', list).forEach((li, i) => {
            const t0 = i * 0.16;
            const num = li.querySelector<HTMLElement>('.b-stage-num');
            const fill = num?.querySelector<HTMLElement>('i');
            const desc = li.querySelector<HTMLElement>('.b-mask > span');
            if (fill) tl.fromTo(fill, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, t0);
            // Scrub a numeric custom property; CSS mixes the live tokens (a colour tween would bake the theme).
            if (num) tl.to(num, { '--on': 1, duration: 0.04 }, t0);
            if (desc) tl.fromTo(desc, { yPercent: 110, opacity: 1 }, { yPercent: 0, autoAlpha: 1, duration: 0.06 }, t0 + 0.02);
          });
        }
        if (p2.current) {
          gsap.fromTo(
            p2.current,
            { clipPath: 'inset(0% 100% 0% 0%)', autoAlpha: 1 },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: EASE.reveal, scrollTrigger: { trigger: p2.current, start: 'top 75%', once: true } }
          );
        }
        if (noteRule.current && noteText.current) {
          const box = noteRule.current.parentElement ?? noteText.current;
          const ntl = gsap.timeline({ scrollTrigger: { trigger: box, start: 'top 80%', once: true } });
          ntl.add(drawRule(noteRule.current, { duration: 0.7 }), 0);
          const note = noteText.current;
          splitLines(note, (self) =>
            gsap.from(self.lines, { yPercent: 110, duration: 0.7, stagger: 0.05, ease: EASE.reveal, delay: 0.2, scrollTrigger: { trigger: box, start: 'top 80%', once: true } })
          );
        }
      }
    });

    /* Lámina 06 grows out of a circle. Two columns (md+): scrubbed with the weights,
       keyed to the spread. Stacked (phones): the plate follows the h3, body and five
       weight rows (~570px), so a spread-keyed scrub would finish before it is on
       screen; it gets its own once-trigger instead. */
    const circle = { clipPath: 'circle(0% at 62% 55%)', autoAlpha: 1 };
    mm.add(MQ.md, () => {
      const spread = s1.current;
      const box = p1.current;
      if (!spread || !box) return;
      gsap.fromTo(box, circle, {
        clipPath: 'circle(80% at 62% 55%)',
        ease: 'none',
        scrollTrigger: { trigger: spread, start: 'top 70%', end: 'top 20%', scrub: 0.8 },
      });
    });
    mm.add(MQ.mobile, () => {
      const box = p1.current;
      if (!box) return;
      gsap.fromTo(box, circle, {
        clipPath: 'circle(80% at 62% 55%)',
        duration: 1.1,
        ease: EASE.reveal,
        scrollTrigger: { trigger: box, start: 'top 85%', once: true },
      });
    });
  }, []);

  useMotion(root, build);

  return (
    <section id="cap-03-proceso" ref={root} data-chapter={t('cap03.runningHead')} className="b-chapter">
      <ChapterOpener numeral={t('cap03.numeral')} folio={t('cap03.folio')} title={t('cap03.title')} lede={t('cap03.lede')} />

      <div className="b-container">
        {/* 3a — Pesos */}
        <div ref={s1} className="b-spread b-grid">
          <div className="b-c1-5">
            <h3 className="b-h3 r-text">{t('cap03.weights.title')}</h3>
            <p className="b-body r-text" style={{ marginTop: 16 }}>
              {t('cap03.weights.body')}
            </p>
            <div className="b-wrows" style={{ marginTop: 28 }}>
              {rows.map((r) => (
                <div key={r.name} className="b-wrow">
                  <span>
                    <span className="b-wname">{r.name}</span>
                    <span className="b-hint">{r.hint}</span>
                  </span>
                  <span className="b-wval r-count" data-value={r.value} data-unit={unit}>
                    {r.value}
                    {unit}
                  </span>
                  <i className="b-wrule r-rule" aria-hidden="true" />
                </div>
              ))}
              <div className="b-wrow is-total">
                <span className="b-wname">{t('cap03.weights.totalLabel')}</span>
                <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8 }}>
                  <span className="b-wval r-count" data-value={totalValue}>
                    {totalValue}
                  </span>
                  <span className="b-folio">{t('cap03.weights.totalOf')}</span>
                </span>
                <i className="b-wrule r-rule" aria-hidden="true" />
              </div>
            </div>
            <p className="b-folio" style={{ marginTop: 12, whiteSpace: 'normal' }}>
              {t('cap03.weights.note')}
            </p>
          </div>
          <div className="b-c6-12">
            <Plate
              id="weights"
              className="r-wipe b-clip-circle"
              boxRef={p1}
              folio={t('cap03.weights.plate.folio')}
              caption={t('cap03.weights.plate.caption')}
              alt={t('cap03.weights.plate.alt')}
              sizes="(min-width: 1280px) 699px, (min-width: 768px) 55vw, 100vw"
            />
          </div>
        </div>

        {/* 3b — Etapas */}
        <div ref={s2} className="b-spread b-grid">
          <div className="b-c1-6">
            <h3 className="b-h3 r-text">{t('cap03.stages.title')}</h3>
            <p className="b-body r-text" style={{ marginTop: 16 }}>
              {t('cap03.stages.body')}
            </p>
            <div className="b-stages-wrap" style={{ marginTop: 28 }}>
              <span ref={stagesRule} className="b-stages-rule r-rule-v" aria-hidden="true" />
              <ol ref={listRef} className="b-stages">
                {stages.map((s) => (
                  <li key={s.num}>
                    <span className="b-stage-num" aria-hidden="true">
                      <i />
                      <span>{s.num}</span>
                    </span>
                    <h4 className="b-h4">
                      <span className="b-folio" style={{ marginRight: 10 }}>
                        {s.num}
                      </span>
                      {s.name}
                    </h4>
                    <p className="b-small b-mask" style={{ marginTop: 4 }}>
                      <span className="r-text">{s.desc}</span>
                    </p>
                  </li>
                ))}
              </ol>
            </div>
            <p className="b-folio" style={{ marginTop: 12, whiteSpace: 'normal' }}>
              {t('cap03.stages.alwaysNote')}
            </p>
          </div>
          <div className="b-c7-12">
            <Plate
              id="stages"
              className="r-wipe r-wipe-left"
              boxRef={p2}
              folio={t('cap03.stages.plate.folio')}
              caption={t('cap03.stages.plate.caption')}
              alt={t('cap03.stages.plate.alt')}
              sizes="(min-width: 1280px) 596px, (min-width: 768px) 48vw, 100vw"
            />
            <div className="b-note-box" style={{ marginTop: 24, position: 'relative', borderTop: 0 }}>
              <span ref={noteRule} className="b-rule r-rule" style={{ position: 'absolute', left: 0, top: 0 }} aria-hidden="true" />
              <p className="b-label">{t('cap03.stages.noteLabel')}</p>
              <p ref={noteText} className="r-text" style={{ marginTop: 8 }}>
                {t('cap03.stages.note')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
