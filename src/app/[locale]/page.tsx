import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import DemoForm from '@/components/DemoForm';
import Footer from '@/components/Footer';
import AnimatedBackground from '@/components/AnimatedBackground';
import CookieBanner from '@/components/CookieBanner';
import WhatsAppButton from '@/components/WhatsAppButton';
import FloatingCue from '@/components/FloatingCue';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';

type Props = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// The landing's <meta name="description"> comes from here, not from the root
// layout: only this route knows the locale, so only here can meta.description
// be the translated one.
export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: `${t('product')} | ${t('tagline')}`,
    description: t('description'),
  };
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="min-h-screen">
      <AnimatedBackground />
      <Header />
      <Hero />
      <Features />
      <DemoForm />
      <Footer />
      <CookieBanner />
      <FloatingCue />
      <WhatsAppButton
        phoneNumber="56979591791"
        message="Hola! Me interesa saber más sobre Eleva"
      />
    </main>
  );
}
