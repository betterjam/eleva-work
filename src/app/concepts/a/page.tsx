'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Old concept URL (no i18n middleware in this static export): forward to the Spanish detail page. */
export default function ConceptARedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/es/platform');
  }, [router]);

  return null;
}
