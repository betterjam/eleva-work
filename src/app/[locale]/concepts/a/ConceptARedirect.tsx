'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Client-side forward for the retired `/[locale]/concepts/a` URL. */
export default function ConceptARedirect({ locale }: { locale: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/${locale}/platform/`);
  }, [router, locale]);

  return null;
}
