import type Lenis from "lenis";

let lenisRef: Lenis | null = null;

const lenisScrollSubscribers = new Set<() => void>();
let lenisScrollUnsub: (() => void) | undefined;
let lenisScrollRafId = 0;
/** Last `lenis.scroll` we pushed to subscribers (avoid redundant React updates). */
let lenisScrollLastPushed: number | null = null;

function stopLenisScrollRaf(): void {
  if (lenisScrollRafId) {
    cancelAnimationFrame(lenisScrollRafId);
    lenisScrollRafId = 0;
  }
  lenisScrollLastPushed = null;
}

function attachLenisScrollEmitter(): void {
  lenisScrollUnsub?.();
  lenisScrollUnsub = undefined;
  stopLenisScrollRaf();

  const lenis = lenisRef;
  if (!lenis || lenisScrollSubscribers.size === 0) {
    return;
  }

  /**
   * Lenis updates `animatedScroll` every internal frame; native `window` scroll events and even
   * `lenis.on("scroll")` are not guaranteed once per visual frame in every browser. Poll `scroll`
   * on rAF so Work / Connect scrub progress stays continuous while wheel-smoothing runs.
   */
  const tick = (): void => {
    lenisScrollRafId = requestAnimationFrame(tick);
    const y = lenis.scroll;
    if (lenisScrollLastPushed !== null && y === lenisScrollLastPushed) {
      return;
    }
    lenisScrollLastPushed = y;
    for (const cb of lenisScrollSubscribers) {
      cb();
    }
  };

  lenisScrollLastPushed = null;
  lenisScrollRafId = requestAnimationFrame(tick);
  lenisScrollUnsub = () => {
    stopLenisScrollRaf();
  };
}

/**
 * Continuous Lenis sync: we poll `lenis.scroll` on rAF so scrub-linked UI updates every frame
 * during smooth wheel scrolling (more reliable than native `window` scroll alone).
 */
export function subscribeLenisScroll(callback: () => void): () => void {
  lenisScrollSubscribers.add(callback);
  attachLenisScrollEmitter();
  return () => {
    lenisScrollSubscribers.delete(callback);
    if (lenisScrollSubscribers.size === 0) {
      lenisScrollUnsub?.();
      lenisScrollUnsub = undefined;
      stopLenisScrollRaf();
    }
  };
}

export function registerLenis(instance: Lenis | null): void {
  lenisScrollUnsub?.();
  lenisScrollUnsub = undefined;
  lenisRef = instance;
  attachLenisScrollEmitter();
}

export function getLenis(): Lenis | null {
  return lenisRef;
}

/** Document scroll position; prefer Lenis’s value when smooth scroll is active (matches `scrollTo`). */
export function getScrollY(): number {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return window.scrollY;
  }
  const lenis = lenisRef;
  return lenis ? lenis.scroll : window.scrollY;
}

/** Vertical scroll; uses Lenis when active so scrubbed sections stay in sync. */
export function scrollWindowToY(top: number, options?: { immediate?: boolean }): void {
  const immediate = options?.immediate ?? false;
  const lenis = lenisRef;
  if (lenis && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    lenis.scrollTo(top, { immediate });
  } else {
    window.scrollTo({ top, left: 0, behavior: immediate ? "auto" : "smooth" });
  }
}
