'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Prefix-less URL (no i18n middleware in this static export): forward to the Spanish page. */
export default function ConceptBRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/es/concepts/b');
  }, [router]);

  return null;
}
