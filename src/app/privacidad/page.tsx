'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** /privacidad has no language: the Spanish page, at /es/privacidad/. */
export default function PrivacidadRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/es/privacidad/');
  }, [router]);

  return null;
}
