import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  // `npm run dev` binds to `::` (dual stack): Windows resolves localhost to ::1
  // first and WSL's relay hangs on an IPv6 port nobody listens on. These are the
  // dev origins that then reach the server.
  allowedDevOrigins: ['localhost', '127.0.0.1', '[::1]'],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'startupchile.org',
        pathname: '/content/uploads/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
