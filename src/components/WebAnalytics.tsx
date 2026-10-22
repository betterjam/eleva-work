import Script from 'next/script';

/**
 * Cloudflare Web Analytics: page views, referrers, countries, devices and real-user
 * Core Web Vitals. Cookieless (no consent needed) and about 5 KB, loaded after the page
 * is interactive so it does not affect first paint. The token is public by design
 * (it ships in the snippet); empty means analytics is off.
 */
const CF_BEACON_TOKEN = '1e53d74b0e7340e08ca74309403f1873';

export default function WebAnalytics() {
  if (!CF_BEACON_TOKEN) return null;
  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      strategy="afterInteractive"
      data-cf-beacon={JSON.stringify({ token: CF_BEACON_TOKEN })}
    />
  );
}
