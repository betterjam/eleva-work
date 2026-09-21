'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useReveal } from './useReveal';

/**
 * Closing CTA, between §07 Normativa and the colophon. One hairline-framed block with an
 * accent rule that draws across its top: the page ends by sending the reader back to the
 * landing, which owns the demo form. Not tracked by the header counter (`sections.ts`
 * gives it `track: false`), so the counter holds at §07.
 */
export default function CierreA() {
  const t = useTranslations('conceptA');
  const locale = useLocale();
  const ref = useRef<HTMLElement>(null);
  useReveal(ref);

  return (
    <section id="cierre" data-section="cierre" ref={ref} className="a-section a-cierre">
      <div className="a-container">
        <div className="a-cierre-box" data-rv-group data-rv-start="top 88%">
          <span className="a-cierre-top rv-rule-x" aria-hidden="true" />
          <span className="a-label a-cierre-label rv-wipe">{t('cierre.label')}</span>
          <h2 className="a-h2 a-cierre-title rv-lines" data-rv-delay="0.1">
            {t('cierre.title')}
          </h2>
          <p className="a-lead a-cierre-lead rv-lines" data-rv-delay="0.25">
            {t('cierre.lead')}
          </p>
          <div className="a-cierre-actions rv-fade" data-rv-delay="0.4">
            {/* Cross-page: the demo form lives on the landing, under #demo. */}
            <Link href={`/${locale}/#demo`} className="a-btn a-btn-primary">
              {t('cierre.cta')}
            </Link>
            <Link href={`/${locale}/`} className="a-btn a-btn-outline">
              {t('cierre.back')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
