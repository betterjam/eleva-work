'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

/**
 * Customer testimonial card.
 *
 * Quote approved by Colegio Santa Cruz de Chicureo (Eduardo Soto Joo, Rector) on
 * 2026-10-16. An empty `city` (or `role`) is simply skipped.
 *
 * The school's crest (a local asset, public/images/logos) takes the avatar slot. It is
 * full colour, so on dark backgrounds it sits on a white plate (`testimonial-logo`,
 * globals.css); on light backgrounds the plate disappears. `data-hero-row` marks the parts the
 * hero entrance cascades in; anywhere else the attribute is inert.
 * `testimonial-accent` gets the darker brand step in light mode (globals.css).
 */
export default function Testimonial({ className = '' }: { className?: string }) {
  const t = useTranslations('testimonial');
  const name = t('name');

  return (
    <figure className={`rounded-3xl border border-white/12 bg-white/5 p-6 md:p-8 ${className}`}>
      <span
        aria-hidden="true"
        className="testimonial-accent font-display block text-6xl font-semibold leading-[0.7] text-brand-400"
      >
        “
      </span>
      <blockquote
        data-hero-row
        className="font-display mt-4 text-[22px] font-medium leading-snug text-white/90 md:text-2xl"
      >
        {t('quote')}
      </blockquote>
      <figcaption data-hero-row className="mt-6 flex items-center gap-4 border-t border-white/10 pt-5">
        <div className="testimonial-logo flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl p-1.5">
          <Image
            src="/images/logos/colegio-santa-cruz-chicureo.webp"
            alt={t('school')}
            width={185}
            height={168}
            className="h-full w-auto"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-white">{name}</div>
          <div className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-white/50">
            {[t('role'), t('school'), t('city')].filter(Boolean).join(' · ')}
          </div>
        </div>
      </figcaption>
    </figure>
  );
}
