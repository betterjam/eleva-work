'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function CTA() {
  const t = useTranslations('CTA');
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 80, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsSubmitting(false);
    setIsSubmitted(true);
    setEmail('');
  };

  return (
    <section
      ref={sectionRef}
      id="cta"
      className="py-32 px-6 lg:px-8 bg-white relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 gradient-mesh opacity-50" />

      <div className="max-w-5xl mx-auto relative">
        <div
          ref={contentRef}
          className="relative rounded-[3rem] overflow-hidden"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 gradient-primary" />

          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Glowing orbs */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/30 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

          {/* Content */}
          <div className="relative z-10 px-8 py-20 sm:px-16 sm:py-24 text-center">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
              {t('title')}
            </h2>
            <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>

            {isSubmitted ? (
              <div className="max-w-md mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-white text-xl font-semibold">
                    {t('button') === 'Solicitar demo'
                      ? '¡Gracias! Te contactaremos pronto.'
                      : 'Thank you! We\'ll contact you soon.'}
                  </p>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto"
              >
                <div className="flex-1 relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('placeholder')}
                    required
                    className="w-full px-6 py-4 rounded-full bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white placeholder-white/60 focus:outline-none focus:border-white focus:bg-white/20 transition-all text-lg"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-10 py-4 rounded-full bg-white text-primary font-bold text-lg hover:bg-gray-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-2xl shadow-black/20 hover:shadow-black/30 hover:-translate-y-0.5"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Enviando...
                    </span>
                  ) : (
                    t('button')
                  )}
                </button>
              </form>
            )}

            <p className="mt-6 text-sm text-white/60">{t('privacy')}</p>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              {[
                { value: '500+', label: 'Colegios' },
                { value: '50k+', label: 'Usuarios' },
                { value: '99.9%', label: 'Uptime' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-white/60 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
