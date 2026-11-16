'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** /privacy has no language: the Spanish page, at /es/privacidad/. */
export default function PrivacyRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/es/privacidad/');
  }, [router]);

  return null;
}
