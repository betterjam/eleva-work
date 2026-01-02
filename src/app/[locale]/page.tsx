import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import DemoForm from '@/components/DemoForm';
import Footer from '@/components/Footer';
import AnimatedBackground from '@/components/AnimatedBackground';
import CookieBanner from '@/components/CookieBanner';
import WhatsAppButton from '@/components/WhatsAppButton';

export default function Home() {
  return (
    <main className="min-h-screen">
      <AnimatedBackground />
      <Header />
      <Hero />
      <Features />
      <DemoForm />
      <Footer />
      <CookieBanner />
      <WhatsAppButton
        phoneNumber="56979591791"
        message="Hola! Me interesa saber más sobre Eleva"
      />
    </main>
  );
}
