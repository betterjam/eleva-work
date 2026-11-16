'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** /terms has no language: the Spanish page, at /es/terminos/. */
export default function TermsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/es/terminos/');
  }, [router]);

  return null;
}
