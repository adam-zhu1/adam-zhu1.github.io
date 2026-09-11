import { useEffect, useRef } from "react";

export const prefersReducedMotion = () =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The band something has to reach before it counts as being looked at, and the single
 * rule the whole site's timing rests on: nothing animates to an empty room.
 *
 * Inset top and bottom on purpose. An element whose first thirty pixels have crept over
 * the bottom edge is not on screen in any useful sense, and starting a one-second draw
 * there means it has finished by the time it reaches the middle of the page — which is
 * exactly what used to happen to the work-card marks.
 */
export const BAND = "-6% 0px -20% 0px";

/** Runs `fn` the first time `el` is properly inside the band, then stops watching. */
export function whenSeen(el: Element, fn: () => void, threshold = 0.3, band = BAND) {
  if (prefersReducedMotion()) { fn(); return () => {}; }
  const io = new IntersectionObserver(
    es => es.forEach(e => { if (e.isIntersecting) { io.disconnect(); fn(); } }),
    { threshold, rootMargin: band },
  );
  io.observe(el);
  return () => io.disconnect();
}

/**
 * Adds `.on` to the element (and staggers any `.in` children) the first time it is
 * meaningfully on screen.
 */
export function useReveal<T extends HTMLElement>(opts: { threshold?: number; stagger?: number; skip?: boolean } = {}) {
  const { threshold = 0.35, stagger = 90, skip = false } = opts;
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || skip) return;
    return whenSeen(el, () => {
      el.classList.add("on");
      el.querySelectorAll<HTMLElement>(".in").forEach((b, i) => {
        b.style.transitionDelay = prefersReducedMotion() ? "0ms" : `${140 + i * stagger}ms`;
        b.classList.add("on");
      });
    }, threshold);
  }, [threshold, stagger, skip]);
  return ref;
}

/**
 * Reveals every child of a list on its own schedule rather than the container's.
 *
 * A tall grid is the case the container-level reveal gets wrong: by the time 30% of a
 * nine-tile grid is on screen the last row is still a screen and a half away, and it has
 * already spent its entrance. Here each child is watched separately, and children that
 * arrive together in one frame are staggered against each other — so a row that scrolls
 * in as a row still reads as a row, and one that arrives alone just appears.
 */
export function useEachReveal<T extends HTMLElement>(
  opts: { selector?: string; threshold?: number; stagger?: number } = {},
) {
  const { selector = ":scope > *", threshold = 0.25, stagger = 70 } = opts;
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const kids = Array.from(el.querySelectorAll<HTMLElement>(selector));
    if (prefersReducedMotion()) { kids.forEach(k => k.classList.add("on")); return; }
    kids.forEach(k => k.classList.add("rise"));
    const io = new IntersectionObserver(es => {
      /* everything that crossed in this same frame shares one stagger, so the delay is
         about how the items arrived, not about where they sit in the source order */
      let n = 0;
      es.forEach(e => {
        if (!e.isIntersecting) return;
        const k = e.target as HTMLElement;
        k.style.transitionDelay = `${n++ * stagger}ms`;
        k.classList.add("on");
        io.unobserve(k);
      });
    }, { threshold, rootMargin: BAND });
    kids.forEach(k => io.observe(k));
    return () => io.disconnect();
  }, [selector, threshold, stagger]);
  return ref;
}

/**
 * Fires once when the element settles into the middle of the viewport.
 *
 * The delay is armed on entry and disarmed on exit: scrolling straight past something no
 * longer starts its animation half a second after it has left the screen.
 */
export function useCentered<T extends HTMLElement>(fn: () => void, delay = 500) {
  const ref = useRef<T>(null);
  const cb = useRef(fn);
  useEffect(() => { cb.current = fn; }, [fn]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) { cb.current(); return; }
    let timer = 0, done = false;
    const io = new IntersectionObserver(
      es => es.forEach(e => {
        if (done) return;
        clearTimeout(timer);
        if (e.isIntersecting) timer = window.setTimeout(() => { done = true; io.disconnect(); cb.current(); }, delay);
      }),
      { rootMargin: "-28% 0px -28% 0px", threshold: 0 },
    );
    io.observe(el);
    return () => { clearTimeout(timer); io.disconnect(); };
  }, [delay]);
  return ref;
}

/**
 * Reports whether the element is on screen, every time that changes. This is what lets a
 * long sequence pause when you scroll away from it and pick up where it left off when you
 * come back, instead of running to the end behind your back.
 */
export function useVisible<T extends HTMLElement>(
  fn: (visible: boolean) => void,
  opts: { threshold?: number; band?: string } = {},
) {
  const { threshold = 0.25, band = "0px 0px 0px 0px" } = opts;
  const ref = useRef<T>(null);
  const cb = useRef(fn);
  useEffect(() => { cb.current = fn; }, [fn]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      es => es.forEach(e => cb.current(e.isIntersecting)),
      { threshold, rootMargin: band },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, band]);
  return ref;
}

/**
 * Drives a long sequence from the viewport.
 *
 * It starts once, a beat after the window has settled in front of you rather than the
 * moment its top edge clears the bottom of the screen; then it holds the frame whenever it
 * is not on screen and picks up from there when it comes back. The band is expressed as a
 * margin rather than a ratio on purpose — the stage can be taller than the viewport, and a
 * ratio threshold never fires when it is.
 */
export function usePlayInView<T extends HTMLElement>(
  get: () => { run: () => void; setOffscreen: (v: boolean) => void } | null,
  settle = 420,
) {
  const ref = useRef<T>(null);
  const api = useRef(get);
  useEffect(() => { api.current = get; }, [get]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) { api.current()?.run(); return; }
    let started = false, timer = 0;
    const io = new IntersectionObserver(
      es => es.forEach(e => {
        if (started) { api.current()?.setOffscreen(!e.isIntersecting); return; }
        clearTimeout(timer);
        if (e.isIntersecting) timer = window.setTimeout(() => { started = true; api.current()?.run(); }, settle);
      }),
      { rootMargin: "-25% 0px -25% 0px", threshold: 0 },
    );
    io.observe(el);
    return () => { clearTimeout(timer); io.disconnect(); };
  }, [settle]);
  return ref;
}
