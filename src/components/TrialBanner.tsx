import { useLocale, useTranslations } from 'next-intl';
import { trialUrl } from '@/lib/trial';

/**
 * The band above the header: the free trial, said once and whole. It is in the flow, so it leaves with the first
 * scroll and the sticky header takes its place. One link, the band itself.
 */
export default function TrialBanner() {
  const t = useTranslations('trial');
  const locale = useLocale();
  return (
    <a
      href={trialUrl(locale)}
      className="trial-banner flex min-h-10 flex-wrap items-center justify-center gap-x-2 gap-y-0.5 bg-brand-600 px-4 py-2 text-center text-sm text-on-accent transition hover:bg-brand-700"
    >
      <span className="font-semibold">{t('banner')}</span>
      <span className="opacity-90">{t('noCard')}</span>
      <svg className="h-3.5 w-3.5 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  );
}
