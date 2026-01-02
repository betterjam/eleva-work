# CLAUDE.md

This file provides context for Claude Code when working on this project.

## Project Overview

**Eleva** is a landing page for a school performance evaluation SaaS product targeting Chilean educational institutions. The site is bilingual (Spanish/English) with dark/light theme support.

## Commands

```bash
# Development
npm run dev          # Start dev server on localhost:3000

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
- Brand colors defined in `src/app/globals.css` using `@theme` directive
- Use `brand-*` utility classes (not `teal-*` or hardcoded colors)

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
