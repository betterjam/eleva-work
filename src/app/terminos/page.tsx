'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** /terminos has no language: the Spanish page, at /es/terminos/. */
export default function TerminosRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/es/terminos/');
  }, [router]);

  return null;
}
