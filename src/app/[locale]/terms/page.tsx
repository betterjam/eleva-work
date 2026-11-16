import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import TermsContent from '@/components/legal/TermsContent';
import LegalForward from '@/components/legal/LegalForward';
import { legalPath } from '@/lib/paths';

/** The terms of service in English (/en/terms/); in Spanish this word only forwards to /es/terminos/. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return locale === 'en' ? { alternates: { canonical: legalPath('terms', locale), languages: { es: legalPath('terms', 'es'), en: legalPath('terms', 'en') } } } : { robots: { index: false, follow: false } };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale !== 'en') return <LegalForward to={legalPath('terms', 'es')} />;
  return <TermsContent locale="en" />;
}
