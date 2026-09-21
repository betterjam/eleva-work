import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Only a language-neutral fallback title lives here. The description used to
// be a hardcoded Spanish sentence describing a different product, and it
// shadowed meta.description for every locale; each page under `[locale]` now
// exports its own generateMetadata with the translated strings instead.
export const metadata: Metadata = {
  title: 'Eleva',
};

// This is the only layout that renders <html>, and it sits above the [locale]
// segment, so it cannot read the locale at build time. The script below (which
// already runs synchronously in <head>, before the body is parsed) reads it off
// the path instead, so /en and /en/platform declare English to screen readers,
// browser translation and hyphenation rather than inheriting the `es` default.
const themeScript = `
  (function() {
    try {
      var locale = (location.pathname.split('/')[1] || '').toLowerCase();
      if (locale === 'en' || locale === 'es') {
        document.documentElement.lang = locale;
      }
    } catch (e) {}
    try {
      var stored = localStorage.getItem('theme');
      if (stored) {
        document.documentElement.setAttribute('data-theme', stored);
      } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
