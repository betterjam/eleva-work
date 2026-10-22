# CLAUDE.md

This file provides context for Claude Code when working on this project.

## Project Overview

**eleva 360° for companies** (eleva.works) is the company edition of the Eleva landing: it helps companies run 360° feedback for their collaborators. It is a fork of the school edition (`betterjam/eleva-landing`, eleva.school); never deploy it to the school bucket or distribution. The site is bilingual (Spanish/English) with dark/light theme support.

## Commands

```bash
# Development
npm run dev          # Start dev server on port 3000, bound to :: (IPv4 + IPv6)
                     # Under WSL2, open http://127.0.0.1:3000 from Windows if
                     # localhost hangs (Windows tries ::1 first through wslrelay).

# Production
npm run build        # Build for production
npm start            # Start production server

# Linting
npm run lint         # Run ESLint
```

## Architecture

### Framework
- Next.js 16 with App Router
- Dynamic `[locale]` route for i18n
- TypeScript throughout

### Styling
- Tailwind CSS v4 with CSS-first configuration
- Brand: **eleva 360°** (October 2026). The asset pack lives in `public/brand/` (served at
  `/brand/`: `logo/`, `symbol/`, `icons/`, `web/`), copied from the brand repo at
  `C:\Users\bette\source\repos\eleva-360-brand` whose `eleva-360-website-handoff.md` is the spec.
  The root layout links the fonts (Lexend for headings, labels, buttons and nav; Atkinson
  Hyperlegible for text), the token sheet `/brand/web/eleva-tokens.css` (light and dark
  values), the favicon, app icons and manifest.
- In components keep using `brand-*` utilities: `src/app/globals.css` resolves them to the
  tokens (`brand-600` = `--accent-fill`, `brand-400` = `--accent`). Primary buttons pair
  `bg-brand-600` with `text-on-accent`, never `text-white`. The legacy `text-white*`,
  `bg-white*`, `border-white*` utilities are remapped to `--ink`, `--surface-raised`,
  `--line` for both themes; do not add new hardcoded colours or the old teal.
- Logos are always the brand files, never rebuilt in CSS: colour logo on light, reverse
  on dark (`.logo-light` / `.logo-dark`), compact variant under 140px, stacked in square
  spaces, `alt="eleva 360°"`.
- Palette: there is no palette switch. The **light theme** is the handoff's light surfaces
  with navy actions (`html[data-theme="light"]` sets `--accent`/`--accent-fill` to navy under
  the "Light theme" heading in `globals.css`); never a navy band or an inverted header. The
  **dark theme** is the handoff's own (ocean surfaces, aqua actions) and must stay that way.
  `?theme=light|dark` fixes the theme (stored in `localStorage` as `theme`); when a local
  preview and production disagree, check that key before touching CSS.

### Animations
- GSAP with ScrollTrigger plugin
- Register plugins with `gsap.registerPlugin(ScrollTrigger)`
- Use `gsap.context()` for cleanup in useEffect

### i18n
- `next-intl` library
- Translation files: `messages/es.json`, `messages/en.json`
- Access translations via `useTranslations()` hook
- For arrays, use `t.raw('key')` and cast appropriately

## Key Patterns

### Theme Handling
```tsx
// Theme is set via data-theme attribute on <html>
document.documentElement.setAttribute('data-theme', 'light' | 'dark');

// Stored in localStorage under 'theme' key
localStorage.getItem('theme');
localStorage.setItem('theme', newTheme);
```

### GSAP Animations in React
```tsx
useEffect(() => {
  const ctx = gsap.context(() => {
    // animations here
  }, containerRef);

  return () => ctx.revert();
}, [dependencies]);
```

### Mobile vs Desktop Layouts
Many components render separate mobile/desktop layouts:
```tsx
<>
  {/* Mobile */}
  <section className="md:hidden">...</section>

  {/* Desktop */}
  <section className="hidden md:block">...</section>
</>
```

### Shared Section IDs
When both mobile and desktop sections need the same anchor ID, wrap in a parent div:
```tsx
<div id="section-name">
  <section className="md:hidden">...</section>
  <section className="hidden md:block">...</section>
</div>
```

## File Locations

| Purpose | Location |
|---------|----------|
| Global styles & brand colors | `src/app/globals.css` |
| Main page | `src/app/[locale]/page.tsx` |
| Layout with theme script | `src/app/[locale]/layout.tsx` |
| Components | `src/components/*.tsx` |
| Translations | `messages/*.json` |
| i18n config | `src/i18n/*.ts` |
| Middleware | `src/middleware.ts` |

## Common Tasks

### Adding a new translation
1. Add key to both `messages/es.json` and `messages/en.json`
2. Use `t('key')` or `t.raw('key')` for arrays

### Changing brand colors
1. Edit `@theme` block in `src/app/globals.css`
2. All `brand-*` classes will update automatically

### Adding a new section
1. Create component in `src/components/`
2. Import in `src/app/[locale]/page.tsx`
3. Add translations to both JSON files
4. Add nav link in `Header.tsx` if needed

### Form spam protection
Forms use honeypot fields:
```tsx
<input
  type="text"
  name="website"
  className="absolute -left-[9999px] opacity-0 h-0 w-0"
  tabIndex={-1}
  aria-hidden="true"
/>
```
Check `formData.get('website')` - if filled, it's a bot.

## Dependencies

- `gsap` - Animation library
- `next-intl` - Internationalization
- `flag-icons` - Country flag CSS icons

## Notes

- The site uses scroll-based pinning effects; test on both mobile and desktop
- Theme flash is prevented by inline script in `<head>` (see layout.tsx)
- WhatsApp number: 56979591791
- Cookie consent stored in localStorage as `cookie-consent`

## Methodology page (concept A)

The methodology page at `/platform` is the former redesign concept A ("Plano Maestro"):
`src/app/[locale]/platform`, `src/components/concepts/a`, `src/styles/concept-a.css`, copy in
`messages/concept-a/{es,en}.json` → `useTranslations('conceptA')`. Concept B and the concept
switcher were removed from this fork.

- Shared foundation: `src/components/concepts/shared/` — `gsapSetup.ts`, `SmoothScroll.tsx`,
  `hooks.ts`, `ConceptRoot.tsx`.
- Fixed elements (headers, floating buttons) go OUTSIDE `<SmoothScroll>`; anchors use `scrollTo`.
- Do NOT use `text-white*`, `bg-white*`, `border-white*`, `bg-black/20|40`, `blur-3xl`, `text-black`
  or `id="demo"` in concept code: legacy light-mode overrides in `globals.css` hijack them.
- Product screenshots: `public/images/app/*.png`. All but `perspective-weights-wizard.png` still
  show school data (Sostenedor, colegio, MINEDUC) and must be replaced with company captures.
