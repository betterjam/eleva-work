'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

export default function CookieBanner() {
  const t = useTranslations('cookies');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Small delay to avoid layout shift on load
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookie-consent', 'all');
    setIsVisible(false);
  };

  const acceptEssential = () => {
    localStorage.setItem('cookie-consent', 'essential');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="cookie-banner mx-auto max-w-4xl rounded-2xl backdrop-blur-xl p-4 md:p-6 shadow-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <p className="cookie-text text-sm">
              {t('message')}{' '}
              <Link href="/privacy" className="cookie-link underline">
                {t('privacyLink')}
              </Link>
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={acceptEssential}
              className="cookie-btn-secondary rounded-xl px-4 py-2 text-sm transition"
            >
              {t('essential')}
            </button>
            <button
              onClick={acceptAll}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-on-accent transition hover:bg-brand-700"
            >
              {t('acceptAll')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
