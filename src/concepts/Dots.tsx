import { useEffect, useRef } from "react";
import { seenRecently, touch } from "./seen";

/**
 * The bootup and the object behind the name. Sampling: for about a second the screen is only
 * dots, appearing at random all over it while a counter runs to 100 (the small readout is the
 * real running mean and spread of a normal sample being drawn). Form: every dot glides at once, each to its own
 * place, into a turning 3D object, and only then does the page arrive on it. After that the object keeps turning,
 * leans toward the pointer, and every few seconds re-forms into the other shape: a knot and
 * a twisted band. It belongs to no project.
 *
 * The bootup plays on a fresh visit, or on a load after the visitor has been idle a while.
 * Coming back from a project page, or reloading mid-visit, shows the object already formed.
 */

const N = 1900, BIG = 56;
const T_BOOT = 900, T_FORM = 2400, HOLD = 9000, MORPH = 2800;

type Dot = { x: number; y: number; s: number; al: number; t0: number; ox: number; oy: number; lx: number; ly: number };

const rnd = Math.random;
const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
const clamp = (v: number) => v < 0 ? 0 : v > 1 ? 1 : v;
/* slow out of rest, slow into place */
const ease = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function shapes(): Float32Array[] {
  const knot = new Float32Array(N * 3), band = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    /* a trefoil knot, given a little thickness */
    const t = rnd() * Math.PI * 2, r = (2 + Math.cos(3 * t)) / 3, j = .038;
    knot[i * 3] = r * Math.cos(2 * t) + gauss() * j; knot[i * 3 + 1] = r * Math.sin(2 * t) + gauss() * j; knot[i * 3 + 2] = Math.sin(3 * t) * .42 + gauss() * j;
    /* a band with a half twist */
    const u = rnd() * Math.PI * 2, v = (rnd() - .5) * .8, w = 1 + v * Math.cos(u / 2);
    band[i * 3] = w * Math.cos(u) * .82; band[i * 3 + 1] = v * Math.sin(u / 2) * .82; band[i * 3 + 2] = w * Math.sin(u) * .82;
  }
  return [knot, band];
}

export function Dots({ onReady }: { onReady: () => void }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const hud = useRef<HTMLDivElement>(null);
  const stat = useRef<HTMLSpanElement>(null);
  const stage = useRef<HTMLSpanElement>(null);
  const ready = useRef(onReady);
  useEffect(() => { ready.current = onReady; }, [onReady]);

  useEffect(() => {
    const c = cv.current!, ctx = c.getContext("2d")!;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const S = shapes();
    const dots: Dot[] = [];
    for (let i = 0; i < N + BIG; i++) {
      const a = rnd() * 6.2832, r = 1.8 + rnd() * 6.5;
      dots.push(i >= N
        ? { x: Math.cos(a) * r, y: Math.sin(a) * r * .75, s: .45 + rnd() ** 2 * 1.75, al: .3 + rnd() * .6, t0: rnd() * .8, ox: 0, oy: 0, lx: NaN, ly: NaN }
        : { x: (rnd() - .5) * 1.12, y: (rnd() - .5) * 1.12, s: rnd() < .14 ? 1.9 : 1.2, al: .35 + rnd() * .6, t0: i / N, ox: 0, oy: 0, lx: NaN, ly: NaN });
    }
    const mean = new Float32Array(N), sd = new Float32Array(N);
    let sum = 0, sq = 0;
    for (let i = 0; i < N; i++) { const x = gauss(); sum += x; sq += x * x; const m = sum / (i + 1); mean[i] = m; sd[i] = Math.sqrt(Math.max(0, sq / (i + 1) - m * m)); }

    let w = 0, h = 0, raf = 0, visible = true, finished = false, ink = "#fff", frame = 0, lastTouch = 0;
    const END = T_BOOT + T_FORM;
    let start = performance.now() - (still || seenRecently() ? END : 0), landed = false, label = "";
    let from = 0, to = 0, morphAt = 0;
    const mouse = { x: -9999, y: -9999, tx: 0, ty: 0, sx: 0, sy: 0 };

    const size = () => {
      const r = c.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
      w = r.width; h = r.height; c.width = w * d; c.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    const active = () => { const n = Date.now(); if (n - lastTouch > 10000) { lastTouch = n; touch(); } };
    const skip = () => { if (!finished) start = performance.now() - END; };
    const tell = (t: string) => { if (t !== label && stage.current) { label = t; stage.current.textContent = t; } };

    const draw = (now: number) => {
      raf = 0;
      if (frame++ % 20 === 0) ink = getComputedStyle(c).color;
      const el = now - start, b = clamp(el / T_BOOT), p = clamp((el - T_BOOT) / T_FORM), e = ease(p);
      /* the name and the rest of the page arrive once the object has formed */
      if (!landed && el >= T_BOOT + T_FORM * .82) { landed = true; hud.current?.classList.add("off"); ready.current(); }
      const small = w < 820, cx = w / 2, cy = h * (small ? .3 : .45), u = Math.min(w, h) * .105;
      const R = small ? w * .36 : Math.min(w, h) * .34;
      if (!finished && p >= 1) { finished = true; morphAt = now + HOLD; active(); }
      /* the object: which shapes, how far between them, and how it is turned */
      if (finished && now > morphAt + MORPH + 400) { from = to; morphAt = now + HOLD; }
      if (finished && now > morphAt && to === from) to = (from + 1) % S.length;
      const m = to === from ? 0 : ease(clamp((now - morphAt) / MORPH));
      mouse.sx += (mouse.tx - mouse.sx) * .04; mouse.sy += (mouse.ty - mouse.sy) * .04;
      const ay = now * .00022 + mouse.sx * .7, ax = .42 + mouse.sy * .45;
      const cay = Math.cos(ay), say = Math.sin(ay), cax = Math.cos(ax), sax = Math.sin(ax);
      const A = S[from], B = S[to];

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = ink; ctx.strokeStyle = ink;
      /* on the way in, the whole field turns a little about the centre, so every path curves
         (no turn at rest, so the dots start spread over the whole screen, not a tilted block) */
      const turn = Math.sin(Math.PI * p) * .35, ct = Math.cos(turn), st = Math.sin(turn), late = e * e * e, moving = p > 0 && p < 1 || m > 0 && m < 1;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        /* each dot switches on at its own moment during the count, a little large, then settles */
        const q = clamp((el - d.t0 * T_BOOT) / 260);
        if (q <= 0) continue;
        let x: number, y: number, s = d.s * (1 + (1 - q) * 1.2), al = d.al * q;
        if (i < N) {
          const j = i * 3;
          const px = A[j] + (B[j] - A[j]) * m, py = A[j + 1] + (B[j + 1] - A[j + 1]) * m, pz = A[j + 2] + (B[j + 2] - A[j + 2]) * m;
          const rx = px * cay + pz * say, rz = pz * cay - px * say;
          const ry = py * cax - rz * sax, rz2 = py * sax + rz * cax;
          const f = 3 / (3 + rz2);
          /* from its place in the cloud to its place on the object */
          const hx = d.x * w, hy = (d.y + .05) * h;
          x = cx + hx * ct - hy * st; y = cy + hx * st + hy * ct;
          x += (cx + rx * R * f - x) * e; y += (cy + ry * R * f - y) * e;
          /* it keeps its own size and brightness for the trip; depth only shows once it is nearly home */
          s *= 1 + (f * 1.15 - 1.1) * late; al *= (1 + ((.25 + .75 * clamp(.5 - rz2 * .6)) - 1) * late) * (1 - .2 * late);
        } else {
          const a = now * .000012 * (i % 2 ? 1 : -1), ca = Math.cos(a), sa = Math.sin(a);
          x = cx + (d.x * ca - d.y * sa) * u * 1.4; y = cy + (d.x * sa + d.y * ca) * u * 1.4; al *= .8;
        }
        const mx = x - mouse.x, my = y - mouse.y, m2 = mx * mx + my * my;
        let tx = 0, ty = 0;
        if (m2 < 16900) { const mm = Math.sqrt(m2) || 1, f = (1 - mm / 130) ** 2 * 34; tx = mx / mm * f; ty = my / mm * f; }
        d.ox += (tx - d.ox) * .1; d.oy += (ty - d.oy) * .1;
        const fx = x + d.ox, fy = y + d.oy;
        /* a short tail behind a travelling dot, as long as it is fast */
        if (i < N && moving && d.lx === d.lx) {
          const vx = d.lx - fx, vy = d.ly - fy, vl = Math.sqrt(vx * vx + vy * vy);
          if (vl > 1.2) { const g = Math.min(26, vl * 2.2) / vl; ctx.globalAlpha = al * .5; ctx.lineWidth = s * .8; ctx.beginPath(); ctx.moveTo(fx + vx * g, fy + vy * g); ctx.lineTo(fx, fy); ctx.stroke(); }
        }
        d.lx = fx; d.ly = fy;
        ctx.globalAlpha = al;
        if (i >= N || s > 2.2) { ctx.beginPath(); ctx.arc(fx, fy, i >= N ? s : s * .55, 0, 6.2832); ctx.fill(); }
        else ctx.fillRect(fx, fy, s, s);
      }
      if (!finished && stat.current) {
        const n = Math.min(N, Math.max(1, Math.floor(b * N)));
        tell(b < 1 ? `00 — sampling   ${String(Math.floor(b * 100)).padStart(3, "0")} / 100` : "01 — form · knot");
        stat.current.textContent = `n ${String(n).padStart(4, "0")}  mean ${(mean[n - 1] >= 0 ? "+" : "") + mean[n - 1].toFixed(3)}  sd ${sd[n - 1].toFixed(3)}`;
      }
      if (visible && !still) raf = requestAnimationFrame(draw);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };

    size();
    kick();
    const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); });
    io.observe(c);
    const move = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      mouse.tx = mouse.x / r.width - .5; mouse.ty = mouse.y / r.height - .5;
      if (finished) active();
    };
    const resize = () => { size(); kick(); };
    const press = () => { skip(); active(); };
    const scroll = () => { if (finished) active(); };
    addEventListener("pointermove", move, { passive: true });
    addEventListener("resize", resize);
    addEventListener("pointerdown", press);
    addEventListener("keydown", press);
    addEventListener("scroll", scroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf); io.disconnect();
      removeEventListener("pointermove", move); removeEventListener("resize", resize);
      removeEventListener("pointerdown", press); removeEventListener("keydown", press);
      removeEventListener("scroll", scroll);
    };
  }, []);

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
