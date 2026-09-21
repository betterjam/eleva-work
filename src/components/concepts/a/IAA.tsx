'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap, SplitText } from '@/components/concepts/shared/gsapSetup';
import ConfidenceBars, { type Bar } from './ConfidenceBars';
import Plate from './Plate';
import SectionRule from './SectionRule';
import { useSectionDirector } from './director/SectionDirector';
import { splitWordsInto } from './splitLines';
import { useReveal } from './useReveal';

type Row = { num: string; name: string; proposes: string; decides: string };
type PlateMsg = { fig: string; caption: string; alt: string };

const MATCH = { src: '/images/app/role-template-ai-match.png', w: 1505, h: 1010, region: { x: 20, y: 310, w: 660, h: 440 } };

/**
 * §06 IA. A four-column ledger (# · intervention · "La IA propone" · "Tú decides"):
 * head and rows wipe in from the left with their text lines masked; the confidence bars
 * fill in row 01; the "Tú decides" hairline is each row's own left border, so it reveals
 * with the row and survives resize. Pull quote: masked words, then the accent underline
 * sweeps under the emphasis — one BEAT handed to the Section Director (scrubbed across its
 * window, locked at completion), so the sweep can never finish after the quote has gone.
 * Match plate wipes in from the right.
 */
export default function IAA() {
  const t = useTranslations('conceptA');
  const ref = useRef<HTMLElement>(null);
  const { registerBeat } = useSectionDirector();
  useReveal(ref);

  const rows = t.raw('ia.rows') as Row[];
  const bars = t.raw('ia.bars') as Bar[];
  const plate = t.raw('ia.plate') as PlateMsg;

  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    const quote = section.querySelector<HTMLElement>('.a-quote');
    if (!quote) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let split: SplitText | null = null;
    let unregister = () => {};
    let cancelled = false;

    const ctx = gsap.context(() => {
      const em = section.querySelector<HTMLElement>('.a-quote-em');
      if (reduce && em) gsap.set(em, { backgroundSize: '100% 2px' });
    }, section);

    if (!reduce) {
      // Words need font metrics; the beat registers once its timeline is complete.
      const run = () => {
        if (cancelled) return;
        ctx.add(() => {
          const tl = gsap.timeline({ paused: true });
          split = splitWordsInto(quote, tl, 0);
          // The underline sweeps once the words have landed (a proportion of the window).
          // The emphasis span lives INSIDE the split subtree, which `autoSplit` rebuilds on
          // resize, so the sweep drives a proxy and writes to whatever node is live at that
          // tick instead of holding a reference that a re-split would detach. The 0 % start
          // state is the stylesheet's, so nothing has to render at progress 0.
          const sweep = { v: 0 };
          tl.to(
            sweep,
            {
              v: 100,
              duration: 0.5,
              ease: 'snap',
              onUpdate: () => {
                const live = section.querySelector<HTMLElement>('.a-quote-em');
                if (live) live.style.backgroundSize = `${sweep.v}% 2px`;
              },
            },
            tl.duration()
          );
          unregister = registerBeat(quote, tl, { enterAt: 80, id: 'ia/quote' });
        });
      };
      // Both arms: a rejected fonts promise must still build the beat, or the quote
      // (visibility: hidden via .rv-lines) would stay invisible with nothing to settle it.
      document.fonts.ready.then(run, run);
    }

    return () => {
      cancelled = true;
      unregister();
      split?.revert();
      ctx.revert();
    };
  }, [registerBeat]);

  return (
    <section id="ia" data-section="ia" ref={ref} className="a-section">
      <div className="a-container">
        <SectionRule code={t('ia.code')} runningHead={t('ia.runningHead')} />
        <div className="a-cols" data-rv-group>
          <h2 className="a-h2 rv-lines col-span-4 md:col-span-7">{t('ia.title')}</h2>
          <p className="a-lead rv-lines col-span-4 md:col-span-6" data-rv-delay="0.15" style={{ marginTop: 24 }}>
            {t('ia.lead')}
          </p>
        </div>

        <div className="a-sheet" style={{ marginTop: 56 }}>
          <div className="a-ledger a-ia-ledger" data-rv-group data-rv-start="top 70%">
            <div className="a-ledger-row a-ledger-head rv-wipe">
              <span>{t('ia.header.num')}</span>
              <span>{t('ia.header.intervention')}</span>
              <span>{t('ia.header.proposes')}</span>
              <span className="a-ledger-cell-decides">{t('ia.header.decides')}</span>
            </div>
            {rows.map((r, i) => (
              <div key={r.num} className="a-ledger-row rv-wipe" data-rv-delay={String(0.1 * i)}>
                <span className="a-code">{r.num}</span>
                <h3 className="a-h4">{r.name}</h3>
                <div>
                  <span className="a-label a-ledger-m-label">{t('ia.header.proposes')}</span>
                  <p className="a-body rv-lines">{r.proposes}</p>
                  {i === 0 ? <ConfidenceBars label={t('ia.barsLabel')} bars={bars} /> : null}
                </div>
                <div className="a-ledger-cell-decides">
                  <span className="a-label a-ledger-m-label">{t('ia.header.decides')}</span>
                  <p className="a-body rv-lines">{r.decides}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="a-code a-ia-never rv-wipe">{t('ia.never')}</p>
        </div>

        <div className="a-cols a-ia-quote-block" style={{ rowGap: 48 }}>
          <div className="col-span-4 md:col-span-7">
            <blockquote className="a-quote rv-lines" data-rv-manual>
              {t('ia.quoteStart')}
              <span className="a-quote-em">{t('ia.quoteEmphasis')}</span>
            </blockquote>
            <p className="a-label rv-wipe" style={{ marginTop: 20 }}>
              {t('ia.quoteSource')}
            </p>
          </div>
          <div className="col-span-4 md:col-start-8 md:col-span-5">
            <Plate
              src={MATCH.src}
              naturalW={MATCH.w}
              naturalH={MATCH.h}
              region={MATCH.region}
              fig={plate.fig}
              caption={plate.caption}
              alt={plate.alt}
              sizes="(min-width: 768px) 40vw, 100vw"
              reveal="rv-wipe-left"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
