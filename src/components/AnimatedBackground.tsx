'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { onActiveSection, prefersReducedMotion } from '@/lib/scrollNav';

gsap.registerPlugin(ScrollTrigger);

// Fixed seed positions and sizes: the markup is fully deterministic, so the
// seeds render on the server too and need no mount flag. Their resting opacity
// is owned by globals.css (0 in dark, 0.6 in light) - nothing here writes an
// inline opacity, which would beat both of those rules.
const seedPositions = [
  { left: 15, top: 25 }, { left: 45, top: 60 }, { left: 75, top: 15 },
  { left: 25, top: 80 }, { left: 85, top: 45 }, { left: 10, top: 50 },
  { left: 55, top: 30 }, { left: 35, top: 70 }, { left: 90, top: 20 },
  { left: 5, top: 40 }, { left: 65, top: 85 }, { left: 40, top: 10 },
  { left: 80, top: 55 }, { left: 20, top: 95 }, { left: 60, top: 5 },
];

const seedSizes = [5, 6, 4, 7, 5, 6, 4, 8, 5, 6, 7, 4, 5, 6, 8];

export default function AnimatedBackground() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bg = bgRef.current;
    if (!bg) return;

    // Section-based color palettes - matching Eleva blue logo
    // Dark: subtle, relaxed blues (less aggressive)
    const darkSections = {
      hero: { c1: '#0f1419', c2: '#1e3a5f', c3: '#0c1015' },      // Soft deep blue
      features: { c1: '#101820', c2: '#234e7a', c3: '#0d1318' },  // Calm blue
      how: { c1: '#111a24', c2: '#2a5a8a', c3: '#0e1419' },       // Muted royal
      security: { c1: '#0f171f', c2: '#1f4a70', c3: '#0c1216' },  // Trust blue
      pricing: { c1: '#101820', c2: '#2d6090', c3: '#0d1318' },   // Gentle sky
      faq: { c1: '#111a24', c2: '#234e7a', c3: '#0e1419' },       // Calm blue
      demo: { c1: '#0f1419', c2: '#1e3a5f', c3: '#0c1015' },      // Soft finish
    };

    // Light: soft surf green / turquoise palette
    const lightSections = {
      hero: { c1: '#f0fdfa', c2: '#99f6e4', c3: '#e6fffa' },      // Soft mint
      features: { c1: '#ecfeff', c2: '#a5f3fc', c3: '#e0f7fa' },  // Light cyan
      how: { c1: '#f0fdfa', c2: '#5eead4', c3: '#ccfbf1' },       // Teal mist
      security: { c1: '#ecfeff', c2: '#67e8f9', c3: '#cffafe' },  // Aqua pastel
      pricing: { c1: '#f0fdfa', c2: '#6ee7b7', c3: '#d1fae5' },   // Seafoam
      faq: { c1: '#ecfeff', c2: '#a5f3fc', c3: '#e0f7fa' },       // Surf turquoise
      demo: { c1: '#f0fdfa', c2: '#5eead4', c3: '#ccfbf1' },      // Soft teal
    };

    const getColors = (section: string) => {
      const isDark = !document.documentElement.hasAttribute('data-theme') ||
                     document.documentElement.getAttribute('data-theme') === 'dark';
      const palette = isDark ? darkSections : lightSections;
      return palette[section as keyof typeof palette] || palette.hero;
    };

    // Whatever painted the background last, so a theme flip can repaint the
    // same section instantly instead of guessing it back out of the DOM.
    let currentSection = 'hero';

    const applyPalette = (section: string, instant = false) => {
      currentSection = section;
      const colors = getColors(section);
      if (instant) {
        gsap.killTweensOf(bg);
        gsap.set(bg, {
          '--gradient-c1': colors.c1,
          '--gradient-c2': colors.c2,
          '--gradient-c3': colors.c3,
        });
        return;
      }
      gsap.to(bg, {
        '--gradient-c1': colors.c1,
        '--gradient-c2': colors.c2,
        '--gradient-c3': colors.c3,
        duration: 1.2,
        ease: 'power2.inOut',
      });
    };

    // Set initial colors
    applyPalette('hero', true);

    // Only sections that really sit in the document flow get a ScrollTrigger.
    // #how, #security, #pricing and #faq live inside the pinned Features
    // column, which GSAP translates: ScrollTrigger would measure them at their
    // natural offsets and fire thousands of pixels away from where they appear.
    // The stage publishes those instead (setActiveSection in lib/scrollNav).
    const triggers: ScrollTrigger[] = [];

    ['hero', 'features', 'demo'].forEach((section) => {
      const element = document.getElementById(section) ||
                      (section === 'hero' ? document.querySelector('section') : null);

      if (element) {
        triggers.push(
          ScrollTrigger.create({
            trigger: element,
            start: 'top 60%',
            end: 'bottom 40%',
            onEnter: () => applyPalette(section),
            onEnterBack: () => applyPalette(section),
          }),
        );
      }
    });

    // The pinned stage tells us which of its inner blocks is on screen.
    const unsubscribe = onActiveSection((id) => {
      if (id in darkSections) applyPalette(id);
    });

    // The palette ScrollTriggers above are a colour change, not motion, so they
    // stay whatever the reader's setting is. Everything below moves forever, so
    // it only runs when reduced motion is not requested; the orbs and the seeds
    // then simply rest where the layout put them.
    const orbs = bg.querySelectorAll('.gradient-orb');
    const seeds = bg.querySelectorAll('.dandelion-seed');

    if (!prefersReducedMotion()) {
      // Animate floating orbs
      orbs.forEach((orb, i) => {
        gsap.to(orb, {
          x: `random(-80, 80)`,
          y: `random(-40, 40)`,
          scale: `random(0.9, 1.1)`,
          duration: `random(20, 30)`,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: i * 3,
        });
      });

      // Animate dandelion seeds - gentle floating like real seeds
      seeds.forEach((seed, i) => {
        // Random starting position
        gsap.set(seed, {
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
        });

        // Floating animation - like dandelion seeds in the wind
        const duration = 15 + Math.random() * 20;
        const xDrift = -200 - Math.random() * 300; // Drift left
        const yDrift = -100 + Math.random() * 200; // Slight up/down

        // No opacity here: globals.css owns the seeds' resting opacity (0 in
        // dark, 0.6 in light), and an inline value would beat both of those
        // rules and keep the seeds visible in dark mode for good.
        gsap.to(seed, {
          x: `+=${xDrift}`,
          y: `+=${yDrift}`,
          duration: duration,
          ease: 'none',
          delay: i * 2,
          repeat: -1,
          onRepeat: () => {
            // Reset to right side when animation repeats
            gsap.set(seed, {
              x: window.innerWidth + 50,
              y: Math.random() * window.innerHeight,
            });
          },
        });

        // Add gentle wobble
        gsap.to(seed, {
          y: `+=20`,
          duration: 2 + Math.random() * 2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: Math.random() * 2,
        });
      });
    }

    // Watch for theme changes - INSTANT transition, repainting whatever section
    // is already showing (no DOM guesswork: the pinned blocks would lie).
    const observer = new MutationObserver(() => {
      applyPalette(currentSection, true);
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      unsubscribe();
      triggers.forEach(t => t.kill());
      gsap.killTweensOf(bg);
      orbs.forEach(orb => gsap.killTweensOf(orb));
      seeds.forEach(seed => gsap.killTweensOf(seed));
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={bgRef}
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 120% 60% at 50% -10%, var(--gradient-c2) 0%, transparent 40%),
          radial-gradient(ellipse 60% 40% at 100% 50%, var(--gradient-c2) 0%, transparent 30%),
          radial-gradient(ellipse 50% 35% at 0% 90%, var(--gradient-c3) 0%, transparent 35%),
          var(--gradient-c1)
        `,
      }}
    >
      {/* Floating gradient orbs - subtle */}
      <div
        className="gradient-orb absolute top-[5%] left-[15%] w-[600px] h-[600px] rounded-full opacity-[0.12] blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--gradient-c2) 0%, transparent 70%)' }}
      />
      <div
        className="gradient-orb absolute top-[50%] right-[5%] w-[500px] h-[500px] rounded-full opacity-[0.08] blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--gradient-c2) 0%, transparent 70%)' }}
      />
      <div
        className="gradient-orb absolute bottom-[10%] left-[50%] w-[400px] h-[400px] rounded-full opacity-[0.08] blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--gradient-c3) 0%, transparent 70%)' }}
      />

      {/* Dandelion seeds - floating particles for light theme */}
      <div className="dandelion-container absolute inset-0 pointer-events-none overflow-hidden">
        {seedPositions.map((pos, i) => (
          <div
            key={i}
            className="dandelion-seed absolute rounded-full"
            style={{
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              width: `${seedSizes[i]}px`,
              height: `${seedSizes[i]}px`,
              background: 'radial-gradient(circle, var(--gradient-c2) 0%, transparent 70%)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
