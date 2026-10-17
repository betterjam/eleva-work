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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 md:p-6">
      <div className="cookie-banner mx-auto max-w-4xl rounded-xl backdrop-blur-xl p-3 shadow-2xl md:rounded-2xl md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="flex-1">
            <p className="cookie-text text-xs leading-snug md:text-sm">
              {t('message')}{' '}
              <Link href="/privacy" className="cookie-link underline">
                {t('privacyLink')}
              </Link>
            </p>
          </div>
          <div className="flex flex-row gap-2">
            <button
              onClick={acceptEssential}
              className="cookie-btn-secondary flex-1 rounded-xl px-3 py-2.5 text-sm transition sm:flex-none sm:px-4"
            >
              {t('essential')}
            </button>
            <button
              onClick={acceptAll}
              className="flex-1 rounded-xl bg-brand-600 px-3 py-2.5 text-sm font-medium text-on-accent transition hover:bg-brand-700 sm:flex-none sm:px-4"
            >
              {t('acceptAll')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
