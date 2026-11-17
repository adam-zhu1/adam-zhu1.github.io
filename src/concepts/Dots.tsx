import { useEffect, useRef } from "react";

/**
 * The bootup and the object behind the name, one canvas, in three stages. Sampling: dots
 * are drawn from a normal distribution and thrown out from the centre while a counter runs
 * to 100 (the readout is the real running mean and spread of the draws). Scatter: the cloud
 * loosens. Form: the dots pull together into a turning 3D object, and the page lands on it.
 * After that the object keeps turning, leans toward the pointer, and every few seconds
 * re-forms into another shape. It belongs to no project: a knot and a twisted band.
 * Each dot has its own place on the object and flies there in turn, so the object is built
 * dot by dot rather than faded in.
 */

const N = 1900, BIG = 56;
const T_BOOT = 1900, FLY = 800, T_SCAT = 600, SPREAD = 1100, D_FLY = 800, HOLD = 9000, MORPH = 1100;
const NAMES = ["knot", "band"];

type Dot = { x: number; y: number; s: number; al: number; t0: number; fd: number; md: number; ox: number; oy: number; lx: number; ly: number };

const rnd = Math.random;
const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
const clamp = (v: number) => v < 0 ? 0 : v > 1 ? 1 : v;
const out = (t: number) => 1 - Math.pow(1 - t, 4);
const io3 = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function shapes(): Float32Array[] {
  const knot = new Float32Array(N * 3), band = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    /* a trefoil knot, given a little thickness */
    const t = (i + rnd()) / N * Math.PI * 2, r = (2 + Math.cos(3 * t)) / 3, j = .038;
    knot[i * 3] = r * Math.cos(2 * t) + gauss() * j; knot[i * 3 + 1] = r * Math.sin(2 * t) + gauss() * j; knot[i * 3 + 2] = Math.sin(3 * t) * .42 + gauss() * j;
    /* a band with a half twist */
    const u = (i + rnd()) / N * Math.PI * 2, v = (rnd() - .5) * .8, w = 1 + v * Math.cos(u / 2);
    band[i * 3] = w * Math.cos(u) * .82; band[i * 3 + 1] = v * Math.sin(u / 2) * .82; band[i * 3 + 2] = w * Math.sin(u) * .82;
  }
  return [knot, band];
}

export function Dots({ onDone, instant = false }: { onDone: () => void; instant?: boolean }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const hud = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLSpanElement>(null);
  const stat = useRef<HTMLSpanElement>(null);
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; }, [onDone]);

  useEffect(() => {
    const c = cv.current!, ctx = c.getContext("2d")!;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const S = shapes();
    const dots: Dot[] = [];
    for (let i = 0; i < N + BIG; i++) {
      const big = i >= N, wide = !big && rnd() < .22 ? 3.2 : 1, a = rnd() * 6.2832, r = 1.8 + rnd() * 6.5;
      dots.push(big
        ? { x: Math.cos(a) * r, y: Math.sin(a) * r * .75, s: .45 + rnd() ** 2 * 1.75, al: .3 + rnd() * .6, t0: rnd() * .9, fd: 0, md: 0, ox: 0, oy: 0, lx: NaN, ly: NaN }
        : { x: gauss() * wide, y: gauss() * wide, s: rnd() < .14 ? 1.9 : 1.2, al: .35 + rnd() * .6, t0: rnd(), fd: i / N * SPREAD + rnd() * 140, md: i / N * 900 + rnd() * 200, ox: 0, oy: 0, lx: NaN, ly: NaN });
    }
    const mean = new Float32Array(N), sd = new Float32Array(N);
    let sum = 0, sq = 0;
    for (let i = 0; i < N; i++) { const x = dots[i].x; sum += x; sq += x * x; const m = sum / (i + 1); mean[i] = m; sd[i] = Math.sqrt(Math.max(0, sq / (i + 1) - m * m)); }

    const END = T_BOOT + T_SCAT + SPREAD + D_FLY + 300;
    let w = 0, h = 0, raf = 0, visible = true, finished = false, ink = "#fff", frame = 0, label = "";
    let start = performance.now() - (still || instant ? END : 0);
    let from = 0, to = 0, morphAt = 0;
    const mouse = { x: -9999, y: -9999, tx: 0, ty: 0, sx: 0, sy: 0 };

    const size = () => {
      const r = c.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
      w = r.width; h = r.height; c.width = w * d; c.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    const finish = () => {
      if (finished) return;
      finished = true; morphAt = performance.now() + HOLD;
      document.documentElement.style.overflow = "";
      hud.current?.classList.add("off");
      done.current();
    };
    const skip = () => { if (!finished) start = performance.now() - END; };
    const say = (t: string) => { if (t !== label && stage.current) { label = t; stage.current.textContent = t; } };

    const draw = (now: number) => {
      raf = 0;
      if (frame++ % 20 === 0) ink = getComputedStyle(c).color;
      const el = now - start, p = Math.min(1, el / T_BOOT), ft = el - T_BOOT - T_SCAT;
      const small = w < 820, cx = w / 2, cy = h * (small ? .3 : .45), u = Math.min(w, h) * .105;
      const R = small ? w * .36 : Math.min(w, h) * .34;
      const sc = io3(clamp((el - T_BOOT) / T_SCAT)), loose = 1 + .4 * sc, far = 1 + 1.5 * sc;
      /* the object: which shapes, how far between them, and how it is turned */
      if (finished && now > morphAt + MORPH + 1150) { from = to; morphAt = now + HOLD; }
      if (finished && now > morphAt && to === from) to = (from + 1) % S.length;
      mouse.sx += (mouse.tx - mouse.sx) * .04; mouse.sy += (mouse.ty - mouse.sy) * .04;
      const ay = now * .00022 + mouse.sx * .7, ax = .42 + mouse.sy * .45;
      const cay = Math.cos(ay), say_ = Math.sin(ay), cax = Math.cos(ax), sax = Math.sin(ax);
      const A = S[from], B = S[to], dim = finished ? .8 : 1;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = ink; ctx.strokeStyle = ink;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i], born = d.t0 * T_BOOT;
        if (el < born) continue;
        const q = clamp((el - born) / FLY), k = 1 - Math.pow(1 - q, 3);
        const sp = i < N ? far : loose;
        let x = cx + d.x * u * k * sp, y = cy + d.y * u * k * sp, s = d.s, al = d.al * Math.min(1, q * 4), fly = false;
        if (i < N) {
          const e = out(clamp((ft - d.fd) / D_FLY));
          if (e > 0) {
            const m = to === from ? 0 : io3(clamp((now - morphAt - d.md) / MORPH)), j = i * 3;
            fly = (e < .97) || (m > .03 && m < .97);
            const px = A[j] + (B[j] - A[j]) * m, py = A[j + 1] + (B[j + 1] - A[j + 1]) * m, pz = A[j + 2] + (B[j + 2] - A[j + 2]) * m;
            const rx = px * cay + pz * say_, rz = pz * cay - px * say_;
            const ry = py * cax - rz * sax, rz2 = py * sax + rz * cax;
            const f = 3 / (3 + rz2);
            x += (cx + rx * R * f - x) * e; y += (cy + ry * R * f - y) * e;
            s *= 1 + (f * 1.15 - .1 - 1) * e; al *= 1 + ((.25 + .75 * clamp(.5 - rz2 * .6)) - 1) * e;
          }
        } else if (finished) {
          const a = (now - start) * .000012 * (i % 2 ? 1 : -1), ca = Math.cos(a), sa = Math.sin(a);
          x = cx + (d.x * ca - d.y * sa) * u * loose; y = cy + (d.x * sa + d.y * ca) * u * loose;
        }
        const mx = x - mouse.x, my = y - mouse.y, m2 = mx * mx + my * my;
        let tx = 0, ty = 0;
        if (m2 < 16900) { const mm = Math.sqrt(m2) || 1, f = (1 - mm / 130) ** 2 * 34; tx = mx / mm * f; ty = my / mm * f; }
        d.ox += (tx - d.ox) * .1; d.oy += (ty - d.oy) * .1;
        const fx = x + d.ox, fy = y + d.oy;
        /* a dot on its way to its place leaves a short streak, so the trip is visible */
        if (fly && d.lx === d.lx) {
          ctx.globalAlpha = Math.min(1, al * 1.3) * .55; ctx.lineWidth = s * .7;
          const vx = d.lx - fx, vy = d.ly - fy, vl = Math.sqrt(vx * vx + vy * vy) || 1, g = Math.min(22, vl * 1.6) / vl;
          ctx.beginPath(); ctx.moveTo(fx + vx * g, fy + vy * g); ctx.lineTo(fx, fy); ctx.stroke();
        }
        d.lx = fx; d.ly = fy;
        ctx.globalAlpha = fly ? Math.min(1, al * 1.3) : al * dim;
        if (i >= N || s > 2.2) { ctx.beginPath(); ctx.arc(fx, fy, i >= N ? s : s * .55, 0, 6.2832); ctx.fill(); }
        else ctx.fillRect(fx, fy, s, s);
      }
      if (!finished) {
        const n = Math.min(N, Math.max(1, Math.floor(p * N)));
        say(el < T_BOOT ? `00 — sampling   ${String(Math.floor(p * 100)).padStart(3, "0")} / 100` : ft < 0 ? "01 — scatter" : `02 — form · ${NAMES[0]}`);
        if (stat.current) stat.current.textContent = `n ${String(n).padStart(4, "0")}  mean ${(mean[n - 1] >= 0 ? "+" : "") + mean[n - 1].toFixed(3)}  sd ${sd[n - 1].toFixed(3)}`;
        if (ft > SPREAD + D_FLY * .5) finish();
      }
      if (visible && !still) raf = requestAnimationFrame(draw);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };

    size();
    if (still || instant) finish(); else document.documentElement.style.overflow = "hidden";
    kick();
    const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); });
    io.observe(c);
    const move = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      mouse.tx = mouse.x / r.width - .5; mouse.ty = mouse.y / r.height - .5;
    };
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
  }, [instant]);

  return (
    <>
      <canvas className="st-dots" ref={cv} aria-hidden="true" />
      <div className="st-hud" ref={hud} aria-hidden="true">
        <span className="tl">Adam Zhu / statistics and machine learning</span>
        <span className="tr" ref={stage} />
        <span className="bl" ref={stat} />
      </div>
    </>
  );
}
