import type Lenis from "lenis";

let lenisRef: Lenis | null = null;

const lenisScrollSubscribers = new Set<() => void>();
let lenisScrollUnsub: (() => void) | undefined;

function attachLenisScrollEmitter(): void {
  lenisScrollUnsub?.();
  lenisScrollUnsub = undefined;
  const lenis = lenisRef;
  if (!lenis || lenisScrollSubscribers.size === 0) {
    return;
  }
  lenisScrollUnsub = lenis.on("scroll", () => {
    for (const cb of lenisScrollSubscribers) {
      cb();
    }
  });
}

/**
 * Lenis smooth scroll updates `lenis.scroll` every frame but may not emit a native
 * `window` scroll event each time — subscribe here so scrub-linked UI stays in sync.
 */
export function subscribeLenisScroll(callback: () => void): () => void {
  lenisScrollSubscribers.add(callback);
  attachLenisScrollEmitter();
  return () => {
    lenisScrollSubscribers.delete(callback);
    if (lenisScrollSubscribers.size === 0) {
      lenisScrollUnsub?.();
      lenisScrollUnsub = undefined;
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
