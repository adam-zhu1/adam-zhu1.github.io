import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { registerLenis } from "../lenisBridge";

/**
 * Smooths mouse-wheel deltas into continuous scroll so scrub-linked sections
 * (About / Work rail) don’t jump in coarse steps. Trackpad stays natural via lerp.
 * Disabled when prefers-reduced-motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      return;
    }

    const lenis = new Lenis({
      autoRaf: true,
      /** Softer follow = less stair-stepping on wheel. */
      lerp: 0.075,
      /** Less distance per notch; combine with taller Work section for slower slides. */
      wheelMultiplier: 0.78,
      touchMultiplier: 1,
      smoothWheel: true,
    });

    registerLenis(lenis);

    return () => {
      lenis.destroy();
      registerLenis(null);
    };
  }, []);

  return null;
}
