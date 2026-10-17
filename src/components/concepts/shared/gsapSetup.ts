'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';

// Register once. GSAP 3.13+ ships every plugin (ScrollSmoother, SplitText…) for free.
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, CustomEase);

  /* ScrollTrigger.create() (GSAP 3.15 and below) force-refreshes, from inside a loop over
     its own trigger list, every earlier timeline-based trigger that is still waiting for
     its first tick. When one of those kills itself on that first update (`once`, an
     `onLeave` that locks a beat) the list shrinks under the loop and the next
     `_triggers[i]` is undefined: "Cannot read properties of undefined (reading 'end')".
     It takes a page scrolled past such triggers while they are created in the same tick
     as a plain trigger: a reload while scrolled down, a breakpoint crossing that rebuilds
     the Section Director. Refreshing the waiting triggers here, in creation order and
     outside any loop, is the same work GSAP would do, without the hole. */
  // The runtime signature is (vars, animation): gsap-core passes a tween or timeline's
  // `scrollTrigger` vars through here with the animation as the second argument.
  type Create = (vars: Parameters<typeof ScrollTrigger.create>[0], animation?: gsap.core.Animation) => ScrollTrigger;
  const create = ScrollTrigger.create as Create;
  const guarded: Create = (vars, animation) => {
    if (!(ScrollTrigger as unknown as { isRefreshing?: boolean }).isRefreshing) {
      ScrollTrigger.getAll().forEach((t) => {
        if (!t.end) t.refresh();
      });
    }
    return create(vars, animation);
  };
  ScrollTrigger.create = guarded as typeof ScrollTrigger.create;

  // Shared easing vocabulary for the concepts. Sharp, non-linear, "reveal" feel.
  if (!CustomEase.get('reveal')) CustomEase.create('reveal', 'M0,0 C0.2,0 0.1,1 1,1');
  if (!CustomEase.get('snap')) CustomEase.create('snap', 'M0,0 C0.7,0 0.2,1 1,1');
  if (!CustomEase.get('settle')) CustomEase.create('settle', 'M0,0 C0.16,1 0.3,1 1,1');
}

export { gsap, ScrollTrigger, ScrollSmoother, SplitText, CustomEase };
