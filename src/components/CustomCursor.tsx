import { useEffect, useRef, useState } from "react";

const ARM = "rgba(255, 255, 255, 0.72)";
const CORE = "#ffffff";
const RING = "rgba(255, 255, 255, 0.9)";
/** Elements that should make the cursor read as clearly clickable. */
const INTERACTIVE_SELECTOR = 'a, button, [role="button"], summary, label, input, textarea, select';

/**
 * Compact white crosshair + dot that morphs into a clear "clickable" ring over links/buttons,
 * so clicking never feels uncertain. Smoothing matches pointer for Lenis-era scroll pages.
 */
export function CustomCursor() {
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef<number>(0);
  const [render, setRender] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onMq = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
      setVisible(true);
      const el = e.target instanceof Element ? e.target.closest(INTERACTIVE_SELECTOR) : null;
      setInteractive(Boolean(el));
    };
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);

    const tick = () => {
      const t = target.current;
      const c = current.current;
      const dx = t.x - c.x;
      const dy = t.y - c.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 0.35) {
        c.x = t.x;
        c.y = t.y;
      } else {
        /** Slightly snappier than before so the dot stays close to the pointer when aiming at links. */
        const lerp = Math.min(0.96, 0.42 + dist * 0.0065);
        c.x += dx * lerp;
        c.y += dy * lerp;
      }

      setRender({ x: c.x, y: c.y });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(raf.current);
    };
  }, [reducedMotion]);

  if (reducedMotion) {
    return null;
  }

  const ease = "0.18s cubic-bezier(0.33, 0.85, 0.3, 1)";

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[100]"
      style={{
        transform: `translate3d(${render.x}px, ${render.y}px, 0) translate(-50%, -50%)`,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.12s ease",
      }}
      aria-hidden
    >
      <svg
        width="44"
        height="44"
        viewBox="-22 -22 44 44"
        fill="none"
        aria-hidden
        style={{
          transform: `scale(${interactive ? 1 : 0.6})`,
          transition: `transform ${ease}`,
        }}
      >
        {/* Crosshair arms — fade out when hovering something clickable */}
        <g style={{ opacity: interactive ? 0 : 1, transition: `opacity ${ease}` }}>
          <line x1="-11" y1="0" x2="-3.5" y2="0" stroke={ARM} strokeWidth="1.4" strokeLinecap="round" />
          <line x1="3.5" y1="0" x2="11" y2="0" stroke={ARM} strokeWidth="1.4" strokeLinecap="round" />
          <line x1="0" y1="-11" x2="0" y2="-3.5" stroke={ARM} strokeWidth="1.4" strokeLinecap="round" />
          <line x1="0" y1="3.5" x2="0" y2="11" stroke={ARM} strokeWidth="1.4" strokeLinecap="round" />
        </g>
        {/* Clickable ring — fades in over links/buttons */}
        <circle
          cx="0"
          cy="0"
          r="13"
          stroke={RING}
          strokeWidth="1.3"
          style={{ opacity: interactive ? 1 : 0, transition: `opacity ${ease}` }}
        />
        <circle cx="0" cy="0" r="1.5" fill={CORE} />
      </svg>
    </div>
  );
}
