import { useEffect, useState } from "react";
import { SCROLL_DEBUG_OVERLAY } from "../config/site";
import { getScrollY, subscribeLenisScroll } from "../lenisBridge";

/**
 * Live document scroll Y (px), same as `getScrollY()` / Lenis `scrollTo`.
 * Enabled when {@link SCROLL_DEBUG_OVERLAY} is true in `src/config/site.ts`.
 */
export function ScrollDebugOverlay() {
  const [y, setY] = useState(0);
  const [yNative, setYNative] = useState(0);
  const [maxY, setMaxY] = useState(0);

  useEffect(() => {
    if (!SCROLL_DEBUG_OVERLAY) {
      return;
    }
    const tick = () => {
      setY(Math.round(getScrollY()));
      setYNative(Math.round(window.scrollY));
      const vh = window.innerHeight;
      setMaxY(Math.max(0, document.documentElement.scrollHeight - vh));
    };
    tick();
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick, { passive: true });
    const unsub = subscribeLenisScroll(tick);
    return () => {
      window.removeEventListener("scroll", tick);
      window.removeEventListener("resize", tick);
      unsub();
    };
  }, []);

  if (!SCROLL_DEBUG_OVERLAY) {
    return null;
  }

  return (
    <div
      className="pointer-events-auto fixed top-4 right-4 z-[200] max-w-[min(100vw-2rem,22rem)] rounded border border-amber-500/60 bg-black/90 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-amber-100 shadow-lg backdrop-blur-sm"
      aria-live="polite"
    >
      <p className="mb-1.5 text-amber-400/90">Scroll debug</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 normal-case tracking-normal">
        <dt className="text-white/45">lenis Y</dt>
        <dd className="text-right tabular-nums text-white">{y}</dd>
        <dt className="text-white/45">window Y</dt>
        <dd className="text-right tabular-nums text-white/70">{yNative}</dd>
        <dt className="text-white/45">max Y</dt>
        <dd className="text-right tabular-nums text-white/70">{maxY}</dd>
      </dl>
      <p className="mt-2 border-t border-white/10 pt-2 text-[9px] leading-snug text-white/40 normal-case tracking-normal">
        Toggle in <code className="text-amber-200/80">src/config/site.ts</code> (<strong className="text-white/55">SCROLL_DEBUG_OVERLAY</strong>
        ). Use <strong className="text-white/60">lenis Y</strong> when comparing to programmatic scroll.
      </p>
      <button
        type="button"
        className="mt-2 w-full rounded border border-white/20 bg-white/5 py-1.5 text-[9px] text-white/80 hover:bg-white/10"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(String(y));
          } catch {
            /* ignore */
          }
        }}
      >
        Copy lenis Y
      </button>
    </div>
  );
}
