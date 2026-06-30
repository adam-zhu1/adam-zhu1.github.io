/**
 * Native scroll helpers. The site uses CSS scroll-snap (no smooth-scroll library), so these are
 * thin wrappers over `window`. Names are kept stable for existing importers.
 */

const scrollSubscribers = new Set<() => void>();
let scrollAttached = false;

function emitScroll(): void {
  for (const cb of scrollSubscribers) {
    cb();
  }
}

function ensureScrollAttached(): void {
  if (scrollAttached) {
    return;
  }
  window.addEventListener("scroll", emitScroll, { passive: true });
  scrollAttached = true;
}

/** Subscribe to scroll updates (native `scroll` event). Returns an unsubscribe fn. */
export function subscribeLenisScroll(callback: () => void): () => void {
  scrollSubscribers.add(callback);
  ensureScrollAttached();
  return () => {
    scrollSubscribers.delete(callback);
  };
}

/** Document scroll position. */
export function getScrollY(): number {
  return window.scrollY;
}

/** Scroll the window to a Y offset (smooth unless `immediate`). */
export function scrollWindowToY(top: number, options?: { immediate?: boolean }): void {
  const immediate = options?.immediate ?? false;
  window.scrollTo({ top, left: 0, behavior: immediate ? "auto" : "smooth" });
}
