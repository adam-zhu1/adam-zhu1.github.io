import { useEffect, useRef } from "react";

export const prefersReducedMotion = () =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Adds `.on` to the element (and staggers any `.in` children) the first time it is
 * meaningfully on screen. `threshold` is deliberately high so a frame never draws
 * itself while it is still a sliver at the edge of the viewport.
 */
export function useReveal<T extends HTMLElement>(opts: { threshold?: number; stagger?: number; skip?: boolean } = {}) {
  const { threshold = 0.45, stagger = 90, skip = false } = opts;
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || skip) return;
    const show = () => {
      el.classList.add("on");
      const bits = el.querySelectorAll<HTMLElement>(".in");
      bits.forEach((b, i) => {
        b.style.transitionDelay = prefersReducedMotion() ? "0ms" : `${220 + i * stagger}ms`;
        b.classList.add("on");
      });
    };
    if (prefersReducedMotion()) { show(); return; }
    const io = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) { show(); io.disconnect(); } }),
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, stagger, skip]);
  return ref;
}

/** Fires once when the element's middle band reaches the middle of the viewport. */
export function useCentered<T extends HTMLElement>(fn: () => void, delay = 500) {
  const ref = useRef<T>(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) { fn(); return; }
    const io = new IntersectionObserver(
      es => es.forEach(e => {
        if (e.isIntersecting && !done.current) { done.current = true; io.disconnect(); setTimeout(fn, delay); }
      }),
      { rootMargin: "-32% 0px -32% 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [fn, delay]);
  return ref;
}
