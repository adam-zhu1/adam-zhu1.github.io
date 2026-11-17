import { useEffect, useRef } from "react";

/**
 * The bootup and the field behind the name, one canvas. Dots are drawn one at a time from a
 * normal distribution and thrown out from the centre while a counter runs to 100; the small
 * readout is the real running mean and spread of what has been drawn so far, so it settles
 * as the sample grows. When the count is done the page forms and the same dots stay behind
 * the name, turning slowly and moving out of the pointer's way.
 */

const N = 1700, BIG = 64, BOOT = 2300, FLY = 900;

type Dot = { x: number; y: number; s: number; al: number; t0: number; big: boolean; ox: number; oy: number; w: number };

function make(): { dots: Dot[]; mean: Float32Array; sd: Float32Array } {
  const g = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
  const dots: Dot[] = [];
  for (let i = 0; i < N; i++) {
    const wide = Math.random() < .22 ? 3.2 : 1;
    dots.push({ x: g() * wide, y: g() * wide, s: Math.random() < .12 ? 1.8 : 1.1, al: .25 + Math.random() * .6, t0: i / N, big: false, ox: 0, oy: 0, w: 0 });
  }
  /* running mean and spread of x, in the order the dots appear */
  const mean = new Float32Array(N), sd = new Float32Array(N);
  let sum = 0, sq = 0;
  dots.forEach((d, i) => { sum += d.x; sq += d.x * d.x; const m = sum / (i + 1); mean[i] = m; sd[i] = Math.sqrt(Math.max(0, sq / (i + 1) - m * m)); });
  for (let i = 0; i < BIG; i++) {
    const a = Math.random() * Math.PI * 2, r = 1.6 + Math.random() * 6.5;
    dots.push({ x: Math.cos(a) * r, y: Math.sin(a) * r * .75, s: 1.6 + Math.random() * 3.2, al: .35 + Math.random() * .65, t0: Math.random() * .9, big: true, ox: 0, oy: 0, w: 0 });
  }
  dots.forEach(d => { d.w = (Math.random() < .5 ? -1 : 1) * .000012 / (.4 + Math.hypot(d.x, d.y) * .25); });
  return { dots, mean, sd };
}

export function Dots({ onDone }: { onDone: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const hud = useRef<HTMLDivElement>(null);
  const cnt = useRef<HTMLElement>(null);
  const stat = useRef<HTMLSpanElement>(null);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const c = cv.current!, ctx = c.getContext("2d")!;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { dots, mean, sd } = make();
    let w = 0, h = 0, raf = 0, visible = true, finished = false, ink = "#fff", frame = 0;
    let start = performance.now() - (still ? BOOT + FLY : 0), doneAt = 0;
    const mouse = { x: -9999, y: -9999 };

    const size = () => {
      const r = c.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
      w = r.width; h = r.height; c.width = w * d; c.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    const finish = () => {
      if (finished) return;
      finished = true; doneAt = performance.now();
      document.documentElement.style.overflow = "";
      hud.current?.classList.add("off");
      done.current();
    };
    const skip = () => { if (!finished) start = performance.now() - BOOT - FLY; };

    const draw = (now: number) => {
      raf = 0;
      if (frame++ % 20 === 0) ink = getComputedStyle(c).color;
      const el = now - start, p = Math.min(1, el / BOOT);
      const cx = w / 2, cy = h * (w < 820 ? .3 : .45), u = Math.min(w, h) * .105;
      const rot = finished ? now - doneAt : 0;
      const dim = finished ? Math.max(.62, 1 - (now - doneAt) / 1400 * .38) : 1;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = ink;
      for (const d of dots) {
        const born = d.t0 * BOOT;
        if (el < born) continue;
        const q = Math.min(1, (el - born) / FLY), k = 1 - Math.pow(1 - q, 3);
        const a = rot * d.w, ca = Math.cos(a), sa = Math.sin(a);
        let x = cx + (d.x * ca - d.y * sa) * u * k, y = cy + (d.x * sa + d.y * ca) * u * k;
        const mx = x - mouse.x, my = y - mouse.y, m2 = mx * mx + my * my;
        let tx = 0, ty = 0;
        if (m2 < 22500) { const m = Math.sqrt(m2) || 1, f = (1 - m / 150) ** 2 * 46; tx = mx / m * f; ty = my / m * f; }
        d.ox += (tx - d.ox) * .1; d.oy += (ty - d.oy) * .1;
        x += d.ox; y += d.oy;
        ctx.globalAlpha = d.al * Math.min(1, q * 4) * dim;
        if (d.big) { ctx.beginPath(); ctx.arc(x, y, d.s, 0, 6.2832); ctx.fill(); }
        else ctx.fillRect(x, y, d.s, d.s);
      }
      if (!finished) {
        const n = Math.min(N, Math.max(1, Math.floor(p * N)));
        if (cnt.current) cnt.current.textContent = String(Math.floor(p * 100)).padStart(3, "0");
        if (stat.current) stat.current.textContent = `n ${String(n).padStart(4, "0")}  mean ${(mean[n - 1] >= 0 ? "+" : "") + mean[n - 1].toFixed(3)}  sd ${sd[n - 1].toFixed(3)}`;
        if (el > BOOT + 350) finish();
      }
      if (visible && !still) raf = requestAnimationFrame(draw);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };

    size();
    if (still) finish(); else document.documentElement.style.overflow = "hidden";
    kick();
    const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); });
    io.observe(c);
    const move = (e: PointerEvent) => { const r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const resize = () => { size(); kick(); };
    addEventListener("pointermove", move, { passive: true });
    addEventListener("resize", resize);
    addEventListener("pointerdown", skip);
    addEventListener("keydown", skip);
    return () => {
      cancelAnimationFrame(raf); io.disconnect();
      document.documentElement.style.overflow = "";
      removeEventListener("pointermove", move); removeEventListener("resize", resize);
      removeEventListener("pointerdown", skip); removeEventListener("keydown", skip);
    };
  }, []);

  return (
    <>
      <canvas className="st-dots" ref={cv} aria-hidden="true" />
      <div className="st-hud" ref={hud} aria-hidden="true">
        <span className="tl">Adam Zhu / statistics and machine learning</span>
        <span className="tr">00 &mdash; sampling &nbsp; <b ref={cnt}>000</b> / 100</span>
        <span className="bl" ref={stat} />
      </div>
    </>
  );
}
