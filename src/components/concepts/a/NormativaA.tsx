'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap, ScrollTrigger } from '@/components/concepts/shared/gsapSetup';
import KeyValue, { type KeyValueRow } from './KeyValue';
import Plate from './Plate';
import SectionRule from './SectionRule';
import { useSectionDirector } from './director/SectionDirector';
import { useReveal } from './useReveal';

type Group = { issuer: string; items: { ref: string; name: string; matched: boolean }[] };
type PlateMsg = { fig: string; caption: string; alt: string };

/** The rubric's own framework list (cropped below its heading, which carries a count). */
const INSET = { src: '/images/app/generated-evaluation-rubric.png', w: 1390, h: 951, region: { x: 0, y: 345, w: 400, h: 546 } };

/**
 * §07 Normativa. A HOLD section: the `[data-hold]` block (title + lead) runs the full grid
 * width above the spread and pins under the header for 60vh while its beat draws — which
 * is why the title and the lead are not inside the left column any more (a hold has to pin
 * a full-width block; pinning one column would leave the page free to scroll past it).
 * Left column: index of the issuers behind the Director rubric (name + one-line descriptor,
 * no tallies) and an inset plate. Right: question 1 of the Director rubric with its chips,
 * then the ledger of frameworks grouped by issuer (rows rise through masks). On desktop an
 * SVG trace draws orthogonal leaders from the question down the margin into each matched
 * framework, lighting the row as each leader lands (scrubbed, rebuilt on resize); under
 * 1024px the same rows light from a director BEAT scrubbed across the question's window.
 */
export default function NormativaA() {
  const t = useTranslations('conceptA');
  const ref = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const { registerBeat } = useSectionDirector();
  useReveal(ref);

  const issuers = t.raw('normativa.issuers') as KeyValueRow[];
  const groups = t.raw('normativa.groups') as Group[];
  const chips = t.raw('normativa.question.chips') as string[];
  const plate = t.raw('normativa.plate') as PlateMsg;

  useEffect(() => {
    const section = ref.current;
    const main = mainRef.current;
    if (!section || !main) return;

    let ro: ResizeObserver | null = null;
    const ctx = gsap.context(() => {
      const svg = main.querySelector<SVGSVGElement>('svg.a-trace');
      const qRow = main.querySelector<HTMLElement>('.a-question-row');
      const matched = Array.from(main.querySelectorAll<HTMLElement>('.a-law[data-matched="true"]'));

      const mm = gsap.matchMedia();
      // `reduce` complements `noReduce` so the callback always runs (final states included).
      mm.add(
        {
          isDesktop: '(min-width: 1024px)',
          noReduce: '(prefers-reduced-motion: no-preference)',
          reduce: '(prefers-reduced-motion: reduce)',
        },
        (mctx) => {
          const { isDesktop, noReduce } = mctx.conditions as { isDesktop: boolean; noReduce: boolean };
          if (!noReduce) {
            gsap.set(matched, { attr: { 'data-on': 'true' } });
            return;
          }

          if (isDesktop && svg && qRow && matched.length) {
            /* Build one path per matched row from layout offsets (transform-independent). */
            const paths = matched.map(() => {
              const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
              svg.appendChild(p);
              return p;
            });
            /* Offsets accumulated up to `main`: a row sits inside a transformed mask
               wrapper (an offsetParent in Chromium/Gecko), so a single offsetTop would be
               relative to that wrapper. Layout offsets ignore transforms, so the sum is the
               same before and after the mask reveal (getBoundingClientRect would not be). */
            const rel = (el: HTMLElement) => {
              let x = 0;
              let y = 0;
              let n: HTMLElement | null = el;
              while (n && n !== main && main.contains(n)) {
                x += n.offsetLeft;
                y += n.offsetTop;
                n = n.offsetParent as HTMLElement | null;
              }
              return { x, y };
            };
            const build = () => {
              const w = main.clientWidth;
              const h = main.clientHeight;
              svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
              const q = rel(qRow);
              const x0 = q.x;
              const y0 = q.y + qRow.offsetHeight;
              matched.forEach((row, k) => {
                const r = rel(row);
                const tx = r.x + 1;
                const ty = r.y + row.offsetHeight / 2;
                paths[k].setAttribute('d', `M${x0 - 12} ${y0} V${ty} H${tx}`);
                const len = paths[k].getTotalLength();
                paths[k].style.strokeDasharray = `${len}`;
              });
            };
            build();

            // Scrubbed, then locked exactly like a director window: once the trace has been
            // drawn it stays drawn (`normativa` is not `reversible`), so scrolling back up
            // never retracts the leaders or darkens the `data-on` rows again. `build()` only
            // rewrites `d`/`stroke-dasharray`, so a later resize keeps the drawn state.
            const tl = gsap.timeline({
              defaults: { ease: 'none' },
              scrollTrigger: {
                trigger: main,
                start: 'top 60%',
                end: 'center 40%',
                scrub: 0.5,
                invalidateOnRefresh: true,
                onLeave: (self) => {
                  self.getTween()?.kill();
                  self.kill(false, true);
                  tl.progress(1);
                },
              },
            });
            paths.forEach((p, k) => {
              tl.fromTo(p, { strokeDashoffset: () => p.getTotalLength() }, { strokeDashoffset: 0, duration: 0.22 }, k * 0.22);
              tl.set(matched[k], { attr: { 'data-on': 'true' } }, k * 0.22 + 0.22);
            });

            ro = new ResizeObserver(() => {
              build();
              ScrollTrigger.refresh();
            });
            ro.observe(main);
            return () => {
              ro?.disconnect();
              ro = null;
              paths.forEach((p) => p.remove());
            };
          }

          /* Mobile / tablet: the matched rows light in sequence, as one beat scrubbed
             across the question's window and locked at completion. */
          if (qRow && matched.length) {
            const tl = gsap.timeline({ paused: true });
            matched.forEach((row, k) => tl.set(row, { attr: { 'data-on': 'true' } }, k * 0.15));
            // Tail so the last row lights before the window closes, not exactly on it.
            tl.to({}, { duration: 0.15 }, matched.length * 0.15);
            const unregister = registerBeat(qRow, tl, { enterAt: 70, id: 'normativa/matches' });
            return () => unregister();
          }
        }
      );
    }, section);

    return () => {
      ro?.disconnect();
      ctx.revert();
    };
  }, [registerBeat]);

  return (
    <section id="normativa" data-section="normativa" ref={ref} className="a-section">
      <div className="a-container">
        <SectionRule code={t('normativa.code')} runningHead={t('normativa.runningHead')} />
        {/* The hold block: it pins under the header while this beat draws. */}
        <div data-hold>
          <div className="a-cols" data-rv-group>
            <h2 className="a-h2 rv-lines col-span-4 md:col-span-8">{t('normativa.title')}</h2>
            <p className="a-lead rv-lines col-span-4 md:col-span-6" data-rv-delay="0.15" style={{ marginTop: 24 }}>
              {t('normativa.lead')}
            </p>
          </div>
        </div>
        <div className="a-cols" style={{ rowGap: 56, marginTop: 64 }}>
          <div className="col-span-4 md:col-span-5 a-norm-side" data-rv-group>
            <p className="a-label rv-wipe">{t('normativa.issuersLabel')}</p>
            <KeyValue rows={issuers} className="a-norm-issuers" />
            <Plate
              src={INSET.src}
              naturalW={INSET.w}
              naturalH={INSET.h}
              region={INSET.region}
              fig={plate.fig}
              caption={plate.caption}
              alt={plate.alt}
              sizes="300px"
              reveal="rv-wipe-up"
            />
          </div>

          <div ref={mainRef} className="col-span-4 md:col-start-6 md:col-span-7 a-norm-main a-sheet">
            <div data-rv-group>
              <p className="a-label rv-wipe">{t('normativa.question.label')}</p>
              <div className="a-question-row">
                <span className="a-code">{t('normativa.question.num')}</span>
                <p className="rv-lines">{t('normativa.question.text')}</p>
                <div className="a-chips">
                  {chips.map((c) => (
                    <span key={c} className="a-chip rv-wipe">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <p className="a-code a-norm-trace rv-wipe">{t('normativa.question.traceLabel')}</p>
            </div>

            {groups.map((g) => (
              <div key={g.issuer} className="a-norm-group" data-rv-group>
                <p className="a-label rv-wipe">{g.issuer}</p>
                {g.items.map((it) => (
                  <div key={`${g.issuer}-${it.ref}`} className="rv-mask">
                    <div className="a-mask-inner">
                      <div className="a-law" data-matched={it.matched ? 'true' : 'false'} data-on="false">
                        <span className="a-law-ref">{it.ref}</span>
                        <span className="a-law-name">{it.name}</span>
                        {it.matched ? (
                          <span className="a-law-tag">
                            <span aria-hidden="true">{t('normativa.question.matchTag')}</span>
                            <span className="a-sr-only">{t('normativa.question.matchSr')}</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <p className="a-code a-norm-foot rv-wipe">{t('normativa.footnote')}</p>
            <svg className="a-trace" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
