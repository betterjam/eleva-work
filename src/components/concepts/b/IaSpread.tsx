'use client';

import { Fragment, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from '@/components/concepts/shared/gsapSetup';
import Plate from './Plate';
import { EASE, MQ, countTo, useMotion, type MotionKit } from './motion';

type Item = { num: string; title: string; desc: string; humanStep: string };
type Node = { label: string; sub: string };
type Part = { text: string; em: boolean };
type Word = { parts: Part[] };

/** Splits mixed plain/em segments into words so each word can sit in its own mask. */
function toWords(segments: Part[]): Word[] {
  const out: Word[] = [];
  let current: Part[] = [];
  const flush = () => {
    if (current.length) out.push({ parts: current });
    current = [];
  };
  for (const seg of segments) {
    for (const ch of seg.text) {
      if (ch === ' ') {
        flush();
        continue;
      }
      const last = current[current.length - 1];
      if (last && last.em === seg.em) last.text += ch;
      else current.push({ text: ch, em: seg.em });
    }
  }
  flush();
  return out;
}

/**
 * § IA · Humano en el ciclo — the inverted spread (scoped token swap) wipes
 * up; the title unmasks word by word with "propone" / "decide" turning teal;
 * three columns; a drawn diagram (cargos → la IA propone → una persona elige)
 * with the 99 % example counter; the product's own "última palabra" line; and
 * Lámina 04 · detalle tipped over the spread's bottom edge.
 */
export default function IaSpread() {
  const t = useTranslations('conceptB');
  const items = t.raw('ia.items') as Item[];
  const nodes = t.raw('ia.diagram.nodes') as Node[];
  const titleWords = toWords([
    { text: t('ia.title.pre'), em: false },
    { text: t('ia.title.em1'), em: true },
    { text: t('ia.title.mid'), em: false },
    { text: t('ia.title.em2'), em: true },
    { text: t('ia.title.post'), em: false },
  ]);
  const counterValue = Number(t.raw('ia.diagram.counterValue')) || 99; // numeric JSON value: read raw
  const counterSuffix = t('ia.diagram.counterSuffix');

  const root = useRef<HTMLElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const ledeRef = useRef<HTMLParagraphElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const plateBox = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLQuoteElement>(null);

  const build = useCallback((kit: MotionKit) => {
    const { mm, q, splitLines, isMobile } = kit;
    mm.add(MQ.motion, () => {
      const block = inner.current;
      if (!block) return;
      const trigger = { trigger: block, start: 'top 70%', once: true };

      gsap.fromTo(block, { clipPath: 'inset(0% 0% 100% 0%)', autoAlpha: 1 }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: EASE.reveal, scrollTrigger: trigger });

      const wordEls = q('.b-ia-title .b-mask-inline > span', block);
      const ems = q('.b-ia-title .b-em', block);
      const htl = gsap.timeline({ scrollTrigger: trigger });
      if (wordEls.length) htl.fromTo(wordEls, { yPercent: 110, opacity: 1 }, { yPercent: 0, autoAlpha: 1, duration: 0.7, stagger: 0.05, ease: EASE.reveal }, 0.3);
      // A class (CSS transition) rather than a colour tween: the inverted spread's accent stays live across theme toggles.
      if (ems.length) htl.call(() => ems.forEach((e) => e.classList.add('is-on')), [], '>-0.15');
      if (ledeRef.current) {
        splitLines(ledeRef.current, (self) => gsap.from(self.lines, { yPercent: 100, duration: 0.7, stagger: 0.05, ease: EASE.reveal, delay: 0.7, scrollTrigger: trigger }));
      }

      const cols = block.querySelector('.b-ia-cols');
      q('.b-ia-cols > div', block).forEach((col, i) => {
        const h = col.querySelector('.b-h3');
        const colTrigger = { trigger: cols ?? col, start: 'top 60%', once: true };
        if (h) splitLines(h, (self) => gsap.from(self.lines, { yPercent: 110, duration: 0.8, stagger: 0.08, ease: EASE.reveal, delay: i * 0.1, scrollTrigger: colTrigger }));
        const fades = col.querySelectorAll('.r-fade');
        if (fades.length) gsap.fromTo(fades, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, stagger: 0.1, delay: 0.3 + i * 0.1, ease: EASE.settle, scrollTrigger: colTrigger });
      });

      const d = diagramRef.current;
      if (d) {
        const dtl = gsap.timeline({ scrollTrigger: { trigger: d, start: 'top 65%', once: true } });
        const vertical = isMobile();
        if (lineRef.current) {
          dtl.fromTo(
            lineRef.current,
            vertical ? { scaleY: 0, scaleX: 1, autoAlpha: 1 } : { scaleX: 0, scaleY: 1, autoAlpha: 1 },
            vertical ? { scaleY: 1, duration: 1.0, ease: EASE.reveal } : { scaleX: 1, duration: 1.0, ease: EASE.reveal },
            0
          );
        }
        const nodeEls = q('.b-node', d);
        const at = [0.1, 0.5, 0.95];
        nodeEls.forEach((n, i) => dtl.fromTo(n, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: EASE.snap }, at[i] ?? 0.1));
        if (pctRef.current) {
          const pct = pctRef.current;
          dtl.add(countTo(pct, Number(pct.dataset.value ?? 0), { suffix: pct.dataset.suffix ?? '', duration: 0.6 }), 0.5);
        }
        const lastDot = d.querySelector('.b-dot.is-final');
        const lastLabel = d.querySelector('.b-ul-target');
        dtl.add(() => {
          lastDot?.classList.add('is-fill');
        }, 1.1);
        if (lastLabel) dtl.to(lastLabel, { backgroundSize: '100% 1px', duration: 0.4, ease: EASE.reveal }, 1.15);
      }

      if (quoteRef.current) {
        const el = quoteRef.current;
        splitLines(el, (self) => {
          const qt = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 80%', once: true } });
          qt.from(self.lines[0], { yPercent: 110, duration: 1.1, ease: EASE.reveal });
          if (self.lines.length > 1) qt.from(self.lines.slice(1), { yPercent: 110, duration: 0.7, stagger: 0.07, ease: EASE.reveal }, '-=0.6');
          return qt;
        });
      }

      if (plateBox.current) {
        gsap.fromTo(
          plateBox.current,
          { clipPath: 'inset(0% 100% 0% 0%)', autoAlpha: 1 },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: EASE.reveal, scrollTrigger: { trigger: plateBox.current, start: 'top 85%', once: true } }
        );
      }
    });
  }, []);

  useMotion(root, build);

  return (
    <section id="ia" ref={root} data-chapter={t('ia.runningHead')} className="b-section">
      <div ref={inner} className="b-invert r-wipe r-wipe-up" style={{ paddingBlock: 96 }}>
        <div className="b-container">
          <div className="b-divider">
            <span className="b-folio">{t('ia.folio')}</span>
          </div>
          <h2 className="b-h2 b-ia-title" style={{ marginTop: 24 }}>
            {titleWords.map((w, i) => (
              <Fragment key={i}>
                {i > 0 && ' '}
                <span className="b-mask-inline">
                  <span className="r-text">
                    {w.parts.map((p, j) =>
                      p.em ? (
                        <em key={j} className="b-em">
                          {p.text}
                        </em>
                      ) : (
                        <Fragment key={j}>{p.text}</Fragment>
                      )
                    )}
                  </span>
                </span>
              </Fragment>
            ))}
          </h2>
          <p ref={ledeRef} className="b-lede r-text" style={{ marginTop: 24 }}>
            {t('ia.lede')}
          </p>

          <div className="b-ia-cols" style={{ marginTop: 56 }}>
            {items.map((it) => (
              <div key={it.num}>
                <span className="b-folio">{it.num}</span>
                <h3 className="b-h3 r-text" style={{ marginTop: 8 }}>
                  {it.title}
                </h3>
                <p className="b-small r-fade" style={{ marginTop: 12, display: 'block' }}>
                  {it.desc}
                </p>
                <span className="b-human r-fade">
                  <span className="b-square b-square-accent" aria-hidden="true" />
                  <span className="b-label">{it.humanStep}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="b-grid" style={{ marginTop: 64 }}>
            <div className="b-c1-7 b-ia-diagram-col">
              <div ref={diagramRef} className="b-diagram">
                <i ref={lineRef} className="b-diagram-line r-rule" aria-hidden="true" />
                {nodes.map((n, i) => {
                  const last = i === nodes.length - 1;
                  return (
                    <div key={n.label} className="b-node r-fade">
                      <span className={`b-dot${last ? ' is-final' : ''}`} aria-hidden="true" />
                      <span className={`b-node-label${last ? ' b-ul-target' : ''}`}>{n.label}</span>
                      <span className="b-node-sub">
                        {i === 1 ? (
                          <>
                            <span ref={pctRef} className="r-count" data-value={counterValue} data-suffix={counterSuffix}>
                              {counterValue}
                              {counterSuffix}
                            </span>{' '}
                            · {n.sub}
                          </>
                        ) : (
                          n.sub
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="b-folio" style={{ marginTop: 16 }}>
                {t('ia.diagram.counterLabel')}
              </p>
            </div>
          </div>

          <div className="b-grid" style={{ marginTop: 64 }}>
            <div className="b-c1-8">
              <p className="b-label">{t('ia.quoteLabel')}</p>
              <blockquote ref={quoteRef} className="b-quote r-text" style={{ marginTop: 12, fontSize: 'clamp(28px, 3vw, 40px)' }} lang="es">
                {t('ia.quote')}
              </blockquote>
            </div>
          </div>
        </div>
      </div>

      <div className="b-container b-ia-plate-row">
        <div className="b-grid">
          <div className="b-c8-12">
            <Plate
              id="aiMatchDetail"
              className="r-wipe r-wipe-left"
              boxRef={plateBox}
              folio={t('ia.plate.folio')}
              caption={t('ia.plate.caption')}
              alt={t('ia.plate.alt')}
              sizes="(min-width: 1280px) 493px, (min-width: 768px) 40vw, 100vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
