import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import PrivacyContent from '@/components/legal/PrivacyContent';
import LegalForward from '@/components/legal/LegalForward';
import { legalPath } from '@/lib/paths';

/** The privacy policy in English (/en/privacy/); in Spanish this word only forwards to /es/privacidad/. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return locale === 'en' ? { alternates: { canonical: legalPath('privacy', locale), languages: { es: legalPath('privacy', 'es'), en: legalPath('privacy', 'en') } } } : { robots: { index: false, follow: false } };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (locale !== 'en') return <LegalForward to={legalPath('privacy', 'es')} />;
  return <PrivacyContent locale="en" />;
}
