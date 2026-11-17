'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Prefix-less `/blog` never 404s: the static export has no i18n
 * middleware, so this client redirect sends it to the default locale.
 */
export default function BlogRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/es/blog');
  }, [router]);

  return null;
}
