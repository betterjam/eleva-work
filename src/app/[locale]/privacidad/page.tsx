import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import PrivacyContent from '@/components/legal/PrivacyContent';
import { legalPath } from '@/lib/paths';

/** La política de privacidad en español: /es/privacidad/ (la inglesa está en /en/privacy/). */
export function generateStaticParams() {
  return [{ locale: 'es' }];
}

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: { canonical: legalPath('privacy', locale), languages: { es: legalPath('privacy', 'es'), en: legalPath('privacy', 'en') } } };
}

export default async function PrivacyPageEs({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PrivacyContent locale="es" />;
}
