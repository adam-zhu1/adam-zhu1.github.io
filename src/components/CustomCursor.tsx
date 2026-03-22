import { useEffect, useRef, useState } from "react";

const ARM = "rgba(255, 255, 255, 0.72)";
const CORE = "#ffffff";

/**
 * Compact white crosshair + dot. Smoothing matches pointer for Lenis-era scroll pages.
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

      if (dist < 0.35) {
        c.x = t.x;
        c.y = t.y;
      } else {
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
        transition: "opacity 0.12s ease",
      }}
      aria-hidden
    >
      <svg width="26" height="26" viewBox="-13 -13 26 26" fill="none" aria-hidden>
        <line x1="-11" y1="0" x2="-3.5" y2="0" stroke={ARM} strokeWidth="0.9" strokeLinecap="round" />
        <line x1="3.5" y1="0" x2="11" y2="0" stroke={ARM} strokeWidth="0.9" strokeLinecap="round" />
        <line x1="0" y1="-11" x2="0" y2="-3.5" stroke={ARM} strokeWidth="0.9" strokeLinecap="round" />
        <line x1="0" y1="3.5" x2="0" y2="11" stroke={ARM} strokeWidth="0.9" strokeLinecap="round" />
        <circle cx="0" cy="0" r="1.35" fill={CORE} />
      </svg>
    </div>
  );
}
