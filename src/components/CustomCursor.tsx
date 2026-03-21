import { useEffect, useRef, useState } from "react";

const BRAND = "#ffffff";

/**
 * Custom cursor: crosshair “axes” with a red sample point — distinct from a ring+dot,
 * fits a stats/ML vibe. Uses distance-based smoothing so fast moves catch up quickly.
 */
export function CustomCursor() {
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef<number>(0);
  const [render, setRender] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
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

      // Snap when essentially aligned (avoids micro-jitter).
      if (dist < 0.35) {
        c.x = t.x;
        c.y = t.y;
      } else {
        // Further behind → higher lerp: responsive on fast flicks, smooth when close.
        const lerp = Math.min(0.94, 0.34 + dist * 0.0065);
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

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[100]"
      style={{
        transform: `translate3d(${render.x}px, ${render.y}px, 0) translate(-50%, -50%)`,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.15s ease",
      }}
      aria-hidden
    >
      {/* Crosshair + center “sample” — not a ring cursor */}
      <svg width="40" height="40" viewBox="-20 -20 40 40" fill="none" aria-hidden>
        <line x1="-16" y1="0" x2="-5" y2="0" stroke="white" strokeWidth="1.25" strokeLinecap="square" />
        <line x1="5" y1="0" x2="16" y2="0" stroke="white" strokeWidth="1.25" strokeLinecap="square" />
        <line x1="0" y1="-16" x2="0" y2="-5" stroke="white" strokeWidth="1.25" strokeLinecap="square" />
        <line x1="0" y1="5" x2="0" y2="16" stroke="white" strokeWidth="1.25" strokeLinecap="square" />
        <circle cx="0" cy="0" r="3" fill={BRAND} />
      </svg>
    </div>
  );
}
