'use client';

import { useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from '@/components/concepts/shared/gsapSetup';
import { EASE, MQ, useMotion, type MotionKit } from './motion';

const DIAG = 136; // ≈ √(96² + 96²)

/**
 * § Testimonio — one sample school, unmistakably a placeholder (dashed badge):
 * quotation mark wipes up, quote unmasks with a slow first line, a square
 * portrait slot draws its frame and crop marks, attribution unmasks.
 */
export default function TestimonioB() {
  const t = useTranslations('conceptB');
  const root = useRef<HTMLElement>(null);
  const qmarkRef = useRef<HTMLSpanElement>(null);
  const quoteRef = useRef<HTMLQuoteElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLSpanElement>(null);

  const build = useCallback((kit: MotionKit) => {
    const { mm, q, splitLines, root: el } = kit;
    mm.add(MQ.motion, () => {
      const trigger = { trigger: el, start: 'top 75%', once: true };
      const tl = gsap.timeline({ scrollTrigger: trigger });
      if (qmarkRef.current) {
        tl.fromTo(qmarkRef.current, { clipPath: 'inset(0% 0% 100% 0%)', autoAlpha: 1 }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: EASE.reveal }, 0);
      }
      if (quoteRef.current) {
        splitLines(quoteRef.current, (self) => {
          const qt = gsap.timeline({ scrollTrigger: trigger, delay: 0.2 });
          qt.from(self.lines[0], { yPercent: 110, duration: 1.2, ease: EASE.reveal });
          if (self.lines.length > 1) qt.from(self.lines.slice(1), { yPercent: 110, duration: 0.7, stagger: 0.07, ease: EASE.reveal }, '-=0.7');
          return qt;
        });
      }
      const portrait = portraitRef.current;
      if (portrait) {
        q('i', portrait).forEach((side, i) => {
          const horizontal = i % 2 === 0;
          tl.fromTo(
            side,
            horizontal ? { scaleX: 0, autoAlpha: 1 } : { scaleY: 0, autoAlpha: 1 },
            horizontal ? { scaleX: 1, duration: 0.125, ease: 'none' } : { scaleY: 1, duration: 0.125, ease: 'none' },
            0.8 + i * 0.125
          );
        });
        const lines = q<SVGLineElement>('line', portrait);
        if (lines.length) tl.fromTo(lines, { strokeDashoffset: DIAG }, { strokeDashoffset: 0, duration: 0.3, ease: EASE.reveal, stagger: 0.05 }, 1.3);
      }
      const attrib = q('.b-attrib .b-mask > *', el);
      if (attrib.length) tl.fromTo(attrib, { yPercent: 100, opacity: 1 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, stagger: 0.08, ease: EASE.reveal }, 1.2);
      if (badgeRef.current) tl.fromTo(badgeRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 1.6);
    });
  }, []);

  useMotion(root, build);

  return (
    <section id="testimonio" ref={root} data-chapter={t('testimonio.runningHead')} className="b-section">
      <div className="b-container">
        <div className="b-divider">
          <span className="b-folio">{t('testimonio.folio')}</span>
          <span ref={badgeRef} className="b-tag b-tag-dashed r-fade" style={{ order: 2 }}>
            {t('testimonio.badge')}
          </span>
        </div>

        <div className="b-grid" style={{ marginTop: 40 }}>
          <div className="b-c1-2">
            <span ref={qmarkRef} className="b-qmark r-wipe r-wipe-up" aria-hidden="true" style={{ display: 'block' }}>
              “
            </span>
          </div>
          <div className="b-c3-11">
            <blockquote ref={quoteRef} className="b-testimonial-quote r-text">
              {t('testimonio.quote')}
            </blockquote>
            <span className="b-rule" style={{ marginTop: 32 }} aria-hidden="true" />
            <div className="b-attrib">
              <div ref={portraitRef} className="b-portrait" role="img" aria-label={t('testimonio.portraitAlt')}>
                <i className="r-rule" aria-hidden="true" />
                <i className="r-rule-v" aria-hidden="true" />
                <i className="r-rule" aria-hidden="true" />
                <i className="r-rule-v" aria-hidden="true" />
                <svg viewBox="0 0 96 96" aria-hidden="true">
                  <line x1="0" y1="0" x2="96" y2="96" strokeDasharray={DIAG} />
                  <line x1="96" y1="0" x2="0" y2="96" strokeDasharray={DIAG} />
                </svg>
              </div>
              <div>
                <span className="b-mask">
                  <span className="r-text" style={{ fontWeight: 600, fontSize: 16 }}>
                    {t('testimonio.name')}
                  </span>
                </span>
                <span className="b-mask" style={{ marginTop: 4 }}>
                  <span className="b-folio r-text" style={{ whiteSpace: 'normal' }}>
                    {t('testimonio.role')} · {t('testimonio.school')} · {t('testimonio.city')}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
