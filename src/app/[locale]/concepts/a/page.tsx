import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';
import ConceptARedirect from './ConceptARedirect';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Concept A became the real product page at `/[locale]/platform`. This route stays as a
 * forward so the old locale-prefixed URL (still linked from the shared ConceptSwitcher,
 * which this job does not own) never 404s on the static export.
 */
export default async function ConceptAPage({ params }: Props) {
  const { locale } = await params;
  return <ConceptARedirect locale={locale} />;
}
