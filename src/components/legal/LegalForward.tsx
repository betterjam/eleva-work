'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** An address in the other language's word forwards to the page's own, so a saved link or a search result never 404s. */
export default function LegalForward({ to }: { to: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(to);
  }, [router, to]);

  return null;
}
