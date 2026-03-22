import type Lenis from "lenis";

let lenisRef: Lenis | null = null;

export function registerLenis(instance: Lenis | null): void {
  lenisRef = instance;
}

export function getLenis(): Lenis | null {
  return lenisRef;
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
