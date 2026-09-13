import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../lib/useReveal";

/**
 * Everything that moves behind the page, on every route. Two quiet things: a slow field of
 * circles drifting across the screen, and a ring that rides out from the cursor when you
 * click somewhere that is not a control.
 */

const N = 26;

/** Stable pseudo-random, so a circle keeps its own character across a rebuild. */
const rnd = (i: number, s: number) => {
  let h = Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(s + 1, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 13), 0x297a2d39);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/* The headings, written out rather than rolled. Mostly up — that is the drift worth
   keeping — with two crossing almost level and one falling, cycled over the field and
   jittered per circle so no two run parallel. Twenty-six is far too small a sample for a
   hash to land proportions like "one in ten falls" reliably, and at this size getting it
   wrong is visible: the first pass came out half rings and a third of them sideways. */
const HEADINGS = [-90, -62, -118, -90, -14, -90, -166, -74, -106, -90, 78, -90];

type Orb = { cx: number; cy: number; r: number; ring: boolean; o: number;
             x0: number; y0: number; x1: number; y1: number; dur: number; delay: number };

/**
 * The drift field: every circle crosses the whole screen along its own heading rather than
 * rising straight up, so the field reads as depth instead of a column of bubbles.
 */
function field(w: number, h: number): Orb[] {
  const reach = Math.max(w, h) * 1.3;
  return Array.from({ length: N }, (_, i) => {
    const deg = HEADINGS[i % HEADINGS.length] + (rnd(i, 2) - 0.5) * 34;
    const a = (deg * Math.PI) / 180;
    const dx = (Math.cos(a) * reach) / 2, dy = (Math.sin(a) * reach) / 2;
    const ring = i % 7 < 2;                                        // a shade under a third
    return {
      cx: +(rnd(i, 3) * w).toFixed(1), cy: +(rnd(i, 4) * h).toFixed(1),
      r: ring ? +(6 + rnd(i, 6) * 13).toFixed(1) : +(1 + rnd(i, 6) * 2.2).toFixed(2),
      ring, o: +((ring ? 0.022 : 0.04) + rnd(i, 7) * (ring ? 0.026 : 0.05)).toFixed(3),
      x0: +(-dx).toFixed(1), y0: +(-dy).toFixed(1), x1: +dx.toFixed(1), y1: +dy.toFixed(1),
      dur: +(26 + rnd(i, 8) * 32).toFixed(1),
      delay: +(-rnd(i, 9) * 58).toFixed(1),
    };
  });
}

/* A click on any of these is a click on something, not on the page behind it. */
const CONTROL = "a,button,input,select,textarea,summary,label,video,[role=button],[contenteditable],.wipe,.stills,.idx,.bar,.tip";

type Rip = { id: number; x: number; y: number };

export function Ambience({ active }: { active: boolean }) {
  const [orbs, setOrbs] = useState<Orb[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [rips, setRips] = useState<Rip[]>([]);

  /* ---------- the drift field ---------- */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const build = () => { setSize({ w: innerWidth, h: innerHeight }); setOrbs(field(innerWidth, innerHeight)); };
    build();
    let t = 0;
    const onResize = () => { clearTimeout(t); t = window.setTimeout(build, 250); };
    addEventListener("resize", onResize);
    return () => { removeEventListener("resize", onResize); clearTimeout(t); };
  }, []);

  /* ---------- the ring from the cursor ----------
     Only where there is nothing to click, so it never competes with a link's own feedback.
     It takes the live accent, which means it comes up mint inside a project. */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let id = 0;
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as Element | null)?.closest?.(CONTROL)) return;
      const r = { id: ++id, x: e.clientX, y: e.clientY };
      setRips(v => [...v, r]);
      setTimeout(() => setRips(v => v.filter(p => p.id !== r.id)), 1000);
    };
    addEventListener("pointerdown", down);
    return () => removeEventListener("pointerdown", down);
  }, []);

  return (
    <>
      <div className={`amb${active ? " on" : ""}`} aria-hidden="true">
        {size.w > 0 && (
          <svg viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="none">
            {orbs.map((d, i) => (
              <circle key={i} className={d.ring ? "orb ring" : "orb"} cx={d.cx} cy={d.cy} r={d.r}
                      style={{
                        "--x0": `${d.x0}px`, "--y0": `${d.y0}px`,
                        "--x1": `${d.x1}px`, "--y1": `${d.y1}px`, "--o": d.o,
                        animation: `drift ${d.dur}s linear ${d.delay}s infinite, driftfade ${d.dur}s linear ${d.delay}s infinite`,
                      } as React.CSSProperties} />
            ))}
          </svg>
        )}
      </div>
      <div className="rips" aria-hidden="true">
        {rips.map(r => (
          <span className="rip" key={r.id} style={{ left: r.x, top: r.y }}><i /><i /></span>
        ))}
      </div>
    </>
  );
}
