import { useEffect, useState } from "react";
import { SCROLL_DEBUG_OVERLAY } from "../config/site";

/**
 * Live document scroll Y (px).
 * Enabled when `SCROLL_DEBUG_OVERLAY` is true in `src/config/site.ts`.
 */
export function ScrollDebugOverlay() {
  const [y, setY] = useState(0);
  const [maxY, setMaxY] = useState(0);

  useEffect(() => {
    if (!SCROLL_DEBUG_OVERLAY) {
      return;
    }
    const tick = () => {
      setY(Math.round(window.scrollY));
      const vh = window.innerHeight;
      setMaxY(Math.max(0, document.documentElement.scrollHeight - vh));
    };
    tick();
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick, { passive: true });
    return () => {
      window.removeEventListener("scroll", tick);
      window.removeEventListener("resize", tick);
    };
  }, []);

  if (!SCROLL_DEBUG_OVERLAY) {
    return null;
  }

  return (
    <div
      className="pointer-events-auto fixed right-4 top-4 z-[200] max-w-[min(100vw-2rem,22rem)] rounded border border-amber-500/60 bg-black/90 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-amber-100 shadow-lg backdrop-blur-sm"
      aria-live="polite"
    >
      <p className="mb-1.5 text-amber-400/90">Scroll debug</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 normal-case tracking-normal">
        <dt className="text-white/45">scroll Y</dt>
        <dd className="text-right tabular-nums text-white">{y}</dd>
        <dt className="text-white/45">max Y</dt>
        <dd className="text-right tabular-nums text-white/70">{maxY}</dd>
      </dl>
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
        Copy scroll Y
      </button>
    </div>
  );
}
