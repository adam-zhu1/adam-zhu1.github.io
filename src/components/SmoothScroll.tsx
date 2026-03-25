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
      /** Slightly snappier follow so scroll responds right away after the hero. */
      lerp: 0.11,
      wheelMultiplier: 0.88,
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
