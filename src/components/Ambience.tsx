import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../lib/useReveal";

/** A soft light that follows the pointer, plus rings and slow dust behind everything. */
export function Ambience({ active }: { active: boolean }) {
  const glow = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const [dust, setDust] = useState<{ cx: number; cy: number; r: number; o: number; dur: number; delay: number }[]>([]);
  const [ring, setRing] = useState({ cx: 0, cy: 0, r: 0 });

  useEffect(() => {
    if (!matchMedia("(hover:hover)").matches) return;
    let tx = innerWidth / 2, ty = innerHeight / 2, x = tx, y = ty, raf = 0;
    const tick = () => {
      x += (tx - x) * 0.16; y += (ty - y) * 0.16;
      glow.current?.style.setProperty("--x", `${x.toFixed(1)}px`);
      glow.current?.style.setProperty("--y", `${y.toFixed(1)}px`);
      raf = Math.abs(tx - x) > 0.4 || Math.abs(ty - y) > 0.4 ? requestAnimationFrame(tick) : 0;
    };
    const move = (e: PointerEvent) => { tx = e.clientX; ty = e.clientY; setOn(true); if (!raf) raf = requestAnimationFrame(tick); };
    const leave = () => setOn(false);
    addEventListener("pointermove", move); addEventListener("pointerleave", leave);
    return () => { removeEventListener("pointermove", move); removeEventListener("pointerleave", leave); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const build = () => {
      const H = document.documentElement.scrollHeight;
      const w = document.querySelector(".wheel")?.getBoundingClientRect();
      setRing({ cx: w ? w.left + w.width / 2 : innerWidth * 0.75, cy: (w ? w.top + w.height / 2 : innerHeight / 2) + scrollY, r: Math.max(innerWidth, innerHeight) * 0.42 });
      const n = Math.min(90, Math.round(H / 90));
      setDust(Array.from({ length: n }, (_, i) => ({
        cx: +(((Math.sin(i * 12.9898) * 43758.5453 % 1) + 1) % 1 * innerWidth).toFixed(1),
        cy: +(((Math.sin(i * 78.233) * 12345.678 % 1) + 1) % 1 * H).toFixed(1),
        r: +(0.7 + (i % 3) * 0.35).toFixed(2),
        o: +(0.05 + (i % 4) * 0.02).toFixed(3),
        dur: 16 + (i % 7) * 3, delay: -(i % 11),
      })));
    };
    build();
    let t: number; const onResize = () => { clearTimeout(t); t = window.setTimeout(build, 200); };
    addEventListener("resize", onResize);
    return () => { removeEventListener("resize", onResize); clearTimeout(t); };
  }, []);

  const H = typeof document !== "undefined" ? document.documentElement.scrollHeight : 0;
  return (
    <>
      <div className={`glow${on ? " on" : ""}`} ref={glow} aria-hidden="true" />
      <div className={`amb${active ? " on" : ""}`} aria-hidden="true">
        <svg viewBox={`0 0 ${innerWidth} ${H}`} style={{ height: H }} preserveAspectRatio="none">
          {[0, 1, 2].map(i => (
            <circle key={i} className="ring" cx={ring.cx} cy={ring.cy} r={ring.r}
                    style={{ transformOrigin: `${ring.cx}px ${ring.cy}px`, animation: `ping 16s cubic-bezier(.2,0,.3,1) ${i * 5.3}s infinite` }} />
          ))}
          {dust.map((d, i) => (
            <circle key={i} className="dust" cx={d.cx} cy={d.cy} r={d.r} opacity={d.o}
                    style={{ animation: `float ${d.dur}s ease-in-out ${d.delay}s infinite alternate` }} />
          ))}
        </svg>
      </div>
    </>
  );
}
