# Eleva Landing Page

A modern, animated landing page for **Eleva** - a school performance evaluation software for Chilean educational institutions.

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **GSAP** for animations (ScrollTrigger, timelines)
- **next-intl** for internationalization (Spanish/English)

## Features

- Bilingual support (ES/EN) with flag-based language toggle
- Dark/Light theme with system preference detection
- Smooth GSAP animations throughout
- Responsive design (mobile-first)
- Cookie consent banner
- WhatsApp floating button
- Honeypot spam protection on forms

## Project Structure

```
src/
├── app/
│   └── [locale]/
│       ├── layout.tsx      # Root layout with theme script
│       ├── page.tsx        # Main landing page
│       ├── privacy/        # Privacy policy page
│       └── terms/          # Terms of service page
├── components/
│   ├── Header.tsx          # Navigation with theme/language toggles
│   ├── Hero.tsx            # Hero section with rotating text animation
│   ├── Features.tsx        # 3D card carousel with GSAP ScrollTrigger
│   ├── Sections.tsx        # How it works, Security, Pricing, FAQ
│   ├── DemoForm.tsx        # Contact form with pinned scroll effect
│   ├── Footer.tsx          # Footer with links
│   ├── CookieBanner.tsx    # Cookie consent component
│   ├── WhatsAppButton.tsx  # Floating WhatsApp button
│   └── AnimatedBackground.tsx # Animated gradient background
├── i18n/
│   ├── navigation.ts       # Localized navigation utilities
│   ├── request.ts          # i18n request config
│   └── routing.ts          # Locale routing config
└── middleware.ts           # i18n middleware
messages/
├── es.json                 # Spanish translations
└── en.json                 # English translations
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Build

```bash
# Create production build
npm run build

# Start production server
npm start
```

## Color System

Brand colors are centralized in `globals.css` using Tailwind v4's `@theme` directive:

```css
@theme {
  --color-brand-50: #f0fdfa;
  --color-brand-100: #ccfbf1;
  --color-brand-200: #99f6e4;
  --color-brand-300: #5eead4;
  --color-brand-400: #2dd4bf;
  --color-brand-500: #14b8a6;
  --color-brand-600: #0d9488;
  --color-brand-700: #0f766e;
  --color-brand-800: #115e59;
  --color-brand-900: #134e4a;
  --color-brand-950: #042f2e;
}
```

Use `brand-*` classes throughout the codebase (e.g., `bg-brand-600`, `text-brand-400`).

## Theme System

- Theme preference stored in `localStorage` under key `theme`
- Falls back to system preference (`prefers-color-scheme`)
- Inline script in `<head>` prevents flash of wrong theme
- Theme applied via `data-theme` attribute on `<html>`

## Internationalization

- Default locale: Spanish (`es`)
- Supported locales: Spanish (`es`), English (`en`)
- Translation files in `/messages/*.json`
- Uses `next-intl` with App Router

## Key Components

### Hero
- Rotating text animation with GSAP
- Gradient text with animated underline
- Smooth entrance animations

### Features
- 3D card carousel
- ScrollTrigger-based pinned scrolling
- Card focus/blur effects based on scroll position

### DemoForm
- Split-screen layout on desktop
- Pinned scroll effect
- Honeypot field for spam protection

## Deployment

Deploy to Vercel:

```bash
vercel
```

Or build and deploy to any Node.js hosting platform.

## License

Private - All rights reserved.
