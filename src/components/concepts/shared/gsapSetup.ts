'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';

// Register once. GSAP 3.13+ ships every plugin (ScrollSmoother, SplitText…) for free.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, CustomEase);

  // Shared easing vocabulary for the concepts. Sharp, non-linear, "reveal" feel.
  if (!CustomEase.get('reveal')) CustomEase.create('reveal', 'M0,0 C0.2,0 0.1,1 1,1');
  if (!CustomEase.get('snap')) CustomEase.create('snap', 'M0,0 C0.7,0 0.2,1 1,1');
  if (!CustomEase.get('settle')) CustomEase.create('settle', 'M0,0 C0.16,1 0.3,1 1,1');
}

export { gsap, ScrollTrigger, ScrollSmoother, SplitText, CustomEase };
