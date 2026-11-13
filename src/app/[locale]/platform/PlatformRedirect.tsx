'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** The methodology page is gone: its old address forwards, so a saved link or a search result never 404s. */
export default function PlatformRedirect({ locale }: { locale: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${locale}/`);
  }, [router, locale]);

  return null;
}
