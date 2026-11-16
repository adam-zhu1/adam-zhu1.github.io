import { useEffect, useRef } from "react";

export type ArtKind = "trio" | "walks" | "tree" | "galton" | "nn" | "descent" | "ascii" | "contour";

/**
 * The quiet piece beside the Projects title: it says nothing about any project, it only
 * moves. Drafts to compare. `descent` is the default: a loss surface drawn in monospace
 * characters, turning slowly, with a marker running gradient descent (with momentum) down
 * into one of its minima, then starting again from somewhere new; a readout counts the steps
 * and the loss. `ascii` turns a torus in monospace characters, shaded by
 * how much light each point of it catches, and leans toward the pointer. `contour` draws
 * the hairline contours of a slowly shifting terrain. Both run only while the title is the
 * screen in view, and a reader who asks for less motion gets one still frame.
 */
export function TitleArt({ kind, on, onScene }: { kind: ArtKind; on: boolean; onScene?: (i: number, p: number) => void }) {
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const g = c.getContext("2d");
    if (!g) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, w = 0, h = 0, dpr = 1, ink = "#111", mute = "#888", mono = "ui-monospace, monospace", frame = 0, last = 0;
    let px = 0, py = 0, tx = 0, ty = 0; // pointer lean, eased

    const colours = () => {
      const s = getComputedStyle(c);
      ink = s.getPropertyValue("--ink").trim() || ink;
      mute = s.getPropertyValue("--mute").trim() || mute;
      mono = s.getPropertyValue("--mono").trim() || mono;
    };
    const size = () => {
      const r = c.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    /* ---- gradient descent on a loss surface, in characters ---- */
    /* the loss: a bowl, two side wells to get caught in, and a faint ripple. Its domain is a
       disc, so the surface has a clean round edge as it turns */
    const RD = 2.6; // radius of the disc
    /* minus a log-likelihood shaped like a mixture of three Gaussians on a broad base: the
       surface is drawn upside down from it, so its minima stand up as peaks to climb */
    const bump = (x: number, y: number, cx: number, cy: number, s: number) => Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / s);
    const loss = (x: number, y: number) => -(
      1.25 * bump(x, y, .95, -.55, .7)
      + .85 * bump(x, y, -1.25, .95, .55)
      + .55 * bump(x, y, -.35, -1.55, .35)
      + .35 * bump(x, y, 0, 0, 5));
    const grad = (x: number, y: number): [number, number] => {
      const e = 1e-3;
      return [(loss(x + e, y) - loss(x - e, y)) / (2 * e), (loss(x, y + e) - loss(x, y - e)) / (2 * e)];
    };
    const run = { x: 0, y: 0, vx: 0, vy: 0, step: 0, rest: 0, trail: [] as [number, number][] };
    const restart = () => {
      const a = Math.random() * 6.283, r = RD * .93;
      Object.assign(run, { x: Math.cos(a) * r, y: Math.sin(a) * r, vx: 0, vy: 0, step: 0, rest: 0, trail: [] });
    };
    restart();
    const advance = () => {
      if (run.rest > 0) { if (--run.rest === 0) restart(); return; }
      const [gx, gy] = grad(run.x, run.y);
      run.vx = .82 * run.vx - .03 * gx; run.vy = .82 * run.vy - .03 * gy;
      run.x += run.vx; run.y += run.vy;
      const r = Math.hypot(run.x, run.y); if (r > RD) { run.x *= RD / r; run.y *= RD / r; }
      run.step++;
      run.trail.push([run.x, run.y]); if (run.trail.length > 120) run.trail.shift();
      /* settled: hold the result a moment, then begin again from the rim */
      if ((Math.hypot(run.vx, run.vy) < .002 && Math.hypot(gx, gy) < .03) || run.step > 500) run.rest = 70;
    };
    const RAMP2 = ".,-~:;=+*#%"; // no "@" or "o": those are the marker and its trail
    const HK2 = 2.7, PITCH = 1.17;
    let K = 0; // scale, fitted once so the whole bowl stays inside the frame at every angle
    const descent = (t: number) => {
      const cell = 11, cw = cell * .62, cols = Math.floor(w / cw), rows = Math.floor((h - 30) / cell);
      const yaw = t * .00012 + px * .45, pitch = PITCH + py * .08;
      const D = 9;
      const mk = (yw: number, pt: number) => {
        const cy = Math.cos(yw), sy = Math.sin(yw), cp = Math.cos(pt), sp = Math.sin(pt);
        return (x: number, y: number, z: number) => {
          const X = x * cy - y * sy, Y0 = x * sy + y * cy;
          const Yv = z * sp - Y0 * cp, Zv = z * cp + Y0 * sp;
          const o = 1 / (D + Zv);
          return [X * o, Yv * o, o] as const;
        };
      };
      if (!K) {
        /* the bowl's extent over a full turn, in projected units, so K can fit it with a margin */
        let xm = 0, ylo = 1e9, yhi = -1e9;
        for (let q = 0; q < 12; q++) {
          const pr = mk(q * .5236, PITCH);
          for (let k = 0; k < 400; k++) {
            const r = RD * Math.sqrt((k % 20) / 19), a = (Math.floor(k / 20) / 20) * 6.283, x = r * Math.cos(a), y = r * Math.sin(a);
            const [X, Y] = pr(x, y, -loss(x, y) * HK2);
            xm = Math.max(xm, Math.abs(X)); ylo = Math.min(ylo, Y); yhi = Math.max(yhi, Y);
          }
        }
        K = Math.min((cols * cw * .44) / xm, (rows * cell * .86) / (yhi - ylo));
        Yc = (yhi + ylo) / 2;
      }
      const pr = mk(yaw, pitch);
      const proj = (x: number, y: number, z: number) => {
        const [X, Y, o] = pr(x, y, z);
        return [cols / 2 + (K * X) / cw, rows / 2 - (K * (Y - Yc)) / cell, o] as const;
      };
      const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const LN = Math.hypot(-.75, .55, -.55), lx = -.75 / LN, ly = .55 / LN, lz = -.55 / LN;
      const shade = (x: number, y: number) => {
        const [gx, gy] = grad(x, y);
        let nx = gx * HK2, ny = gy * HK2, nz = 1; const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
        const NX = nx * cyw - ny * syw, NY0 = nx * syw + ny * cyw, NYv = nz * sp - NY0 * cp, NZv = nz * cp + NY0 * sp;
        return Math.max(0, NX * lx + NYv * ly + NZv * lz);
      };
      /* sample the disc in rings and spokes; every 8th ring and spoke is a mesh line, drawn brighter */
      const R = 64, A = 200, n = cols * rows;
      const zb = new Float32Array(n), lum = new Float32Array(n).fill(-1);
      const put = (x: number, y: number, boost: number) => {
        const [sx, syy, o] = proj(x, y, -loss(x, y) * HK2);
        const c0 = Math.floor(sx), r0 = Math.floor(syy);
        if (c0 < 0 || c0 >= cols || r0 < 0 || r0 >= rows) return;
        const k = r0 * cols + c0;
        if (o < zb[k] * .997) return;
        if (o > zb[k]) zb[k] = o;
        const L = shade(x, y) * .8 + boost;
        if (L > lum[k] || o > zb[k] * 1.003) lum[k] = Math.max(L, o >= zb[k] ? L : lum[k]);
      };
      for (let i = 1; i <= R; i++) for (let j = 0; j < A; j++) {
        const r = (RD * i) / R, a = (j / A) * 6.283;
        put(r * Math.cos(a), r * Math.sin(a), (i % 8 === 0 || j % 25 === 0 || i === R) ? .14 : 0);
      }
      g.clearRect(0, 0, w, h);
      g.font = `${cell}px ${mono}`;
      g.textBaseline = "top";
      /* stretch the shading over the full ramp each frame, so the slopes read at any angle */
      let lo = 9, hi = -9;
      for (let k = 0; k < n; k++) if (lum[k] >= 0) { if (lum[k] < lo) lo = lum[k]; if (lum[k] > hi) hi = lum[k]; }
      for (let k = 0; k < n; k++) {
        const L = lum[k];
        if (L < 0) continue;
        const v = Math.pow((L - lo) / Math.max(hi - lo, 1e-3), 1.15);
        const l = Math.min(RAMP2.length - 1, Math.floor(v * RAMP2.length));
        g.fillStyle = l < 5 ? mute : ink;
        g.globalAlpha = .3 + .64 * v;
        g.fillText(RAMP2[l], (k % cols) * cw, Math.floor(k / cols) * cell);
      }
      /* the path so far, then the marker, just above the surface so they read over it */
      const mark = (x: number, y: number, c: string, a: number) => {
        const [sx, syy, o] = proj(x, y, -loss(x, y) * HK2 + .05);
        const c0 = Math.floor(sx), r0 = Math.floor(syy);
        if (c0 < 0 || c0 >= cols || r0 < 0 || r0 >= rows || o < zb[r0 * cols + c0] * .99) return;
        g.globalAlpha = 1; g.clearRect(c0 * cw - 1, r0 * cell, cw + 2, cell);
        g.globalAlpha = a; g.fillStyle = ink; g.fillText(c, c0 * cw, r0 * cell);
      };
      run.trail.forEach(([x, y], i) => { if (i % 2 === 0) mark(x, y, "o", .3 + .6 * (i / run.trail.length)); });
      mark(run.x, run.y, "@", 1);
      g.globalAlpha = 1; g.fillStyle = mute; g.font = `11px ${mono}`;
      const txt = `gradient ascent   step ${String(run.step).padStart(3, " ")}   log-likelihood ${(Math.log(Math.max(-loss(run.x, run.y), 1e-6))).toFixed(3)}`;
      g.fillText(txt, (w - g.measureText(txt).width) / 2, h - 16);
    };
    let Yc = 0;

    /* ---- Galton board: balls drop through pegs and pile up into a bell curve ---- */
    const GN = 12; // rows of pegs
    type Ball = { lvl: number; k: number; t: number; dir: number };
    const gal = { balls: [] as Ball[], bins: new Array(GN + 1).fill(0) as number[], n: 0, tick: 0, hold: 0, fade: 1 };
    const galReset = () => { gal.balls = []; gal.bins = new Array(GN + 1).fill(0); gal.n = 0; gal.hold = 0; gal.fade = 1; };
    let galGeo = { cell: 11, cw: 6.82, sx: 6, sy: 2, top: 4, x0: 0, binTop: 0, binH: 0, cap: 0 };
    const galLayout = () => {
      const cell = 11, cw = cell * .62, cols = Math.floor(w / cw), rows = Math.floor((h - 30) / cell);
      const sx = Math.max(4, Math.min(7, Math.floor((cols - 4) / (GN + 1)))), sy = 2;
      /* bins only as tall as the piles get, and the whole board centred in the frame */
      const binH = Math.min(16, rows - (GN * sy + 8));
      const total = 5 + GN * sy + 1 + binH + 1, top = Math.max(5, Math.floor((rows - total) / 2) + 5);
      const binTop = top + GN * sy + 1;
      galGeo = { cell, cw, sx, sy, top, x0: Math.floor(cols / 2), binTop, binH, cap: binH * (sx - 1) };
    };
    const galStep = () => {
      const G = galGeo;
      if (gal.hold > 0) { if (--gal.hold === 0) gal.fade = .999; return; }
      if (gal.fade < 1) { gal.fade -= .05; if (gal.fade <= 0) galReset(); return; }
      /* a new ball every other tick, while the tallest bin still has room */
      if (++gal.tick % 2 === 0) gal.balls.push({ lvl: -2, k: 0, t: 0, dir: 0 });
      for (const b of gal.balls) {
        b.t += .25;
        if (b.t >= 1) {
          b.t = 0; b.lvl++;
          /* after r rows a ball has made r left-or-right choices, so it sits between the pegs of row r */
          if (b.lvl >= 1 && b.lvl <= GN) { const r = Math.random() < .5 ? 0 : 1; b.k += r; b.dir = r ? 1 : -1; } else b.dir = 0;
        }
      }
      gal.balls = gal.balls.filter(b => {
        if (b.lvl <= GN) return true;
        gal.bins[b.k]++; gal.n++;
        return false;
      });
      if (Math.max(...gal.bins) >= G.cap) { gal.hold = 75; gal.balls = []; }
    };
    const galton = () => {
      const G = galGeo, { cell, cw, sx, sy, top, x0, binTop, binH } = G;
      g.clearRect(0, 0, w, h);
      g.font = `${cell}px ${mono}`; g.textBaseline = "top";
      const put = (c: string, col: number, row: number, a: number, col2 = ink) => { g.globalAlpha = a * gal.fade; g.fillStyle = col2; g.fillText(c, col * cw, row * cell); };
      /* the hopper */
      for (let r = 0; r < 4; r++) { put("\\", x0 - 5 + r, top - 5 + r, .5, mute); put("/", x0 + 5 - r, top - 5 + r, .5, mute); }
      /* pegs: row r has r + 1 of them */
      for (let r = 0; r < GN; r++) for (let j = 0; j <= r; j++) put(".", x0 + (j - r / 2) * sx, top + r * sy, .7, mute);
      /* bins: walls, then the stacks, each bin filled a row at a time from the floor */
      for (let j = 0; j <= GN + 1; j++) {
        const cx = x0 + (j - .5 - GN / 2) * sx;
        for (let r = 0; r < binH; r++) put("|", cx, binTop + r, .22, mute);
      }
      for (let j = 0; j <= GN; j++) {
        const left = x0 + (j - .5 - GN / 2) * sx + 1, wdt = sx - 1;
        for (let m = 0; m < gal.bins[j]; m++) put("o", left + (m % wdt), binTop + binH - 1 - Math.floor(m / wdt), .85);
      }
      put("-".repeat((GN + 1) * sx + 1), x0 - (GN / 2 + .5) * sx, binTop + binH, .4, mute);
      /* the bell the stacks are filling toward: the normal curve with the same mean and spread */
      const n = Math.max(gal.n, 1), mu = GN / 2, sd = Math.sqrt(GN) / 2;
      const peak = (Math.max(...gal.bins) || 1);
      if (gal.n > 40) for (let c = 0; c <= (GN + 1) * sx; c++) {
        const xv = c / sx - .5;
        const dens = Math.exp(-((xv - mu) ** 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI));
        const hgt = (dens * n) / (sx - 1);
        if (hgt < .6) continue;
        put("·", x0 - (GN / 2 + .5) * sx + c, binTop + binH - 1 - Math.round(hgt), .75, ink);
      }
      void peak;
      /* the balls in flight, drawn between pegs with a little hop */
      for (const b of gal.balls) {
        let col: number, row: number;
        if (b.lvl < 0) { col = x0; row = top - 4 + (b.lvl + 2 + b.t) * 2 - 1; }
        else {
          const from = b.k - (b.dir > 0 ? 1 : 0), fx = x0 + (from - (b.lvl - 1) / 2) * sx, tx = x0 + (b.k - b.lvl / 2) * sx;
          col = b.lvl === 0 ? x0 : fx + (tx - fx) * b.t;
          row = top + (b.lvl - 1) * sy + sy * b.t - Math.sin(b.t * Math.PI) * .6 - .6;
        }
        g.globalAlpha = gal.fade; g.fillStyle = ink; g.fillText("o", col * cw, row * cell);
      }
      g.globalAlpha = 1; g.fillStyle = mute; g.font = `11px ${mono}`;
      const mean = gal.n ? gal.bins.reduce((s, c, j) => s + c * j, 0) / gal.n : 0;
      const sdv = gal.n ? Math.sqrt(gal.bins.reduce((s, c, j) => s + c * (j - mean) ** 2, 0) / gal.n) : 0;
      const txt = `n ${String(gal.n).padStart(3, " ")}   mean ${mean.toFixed(2)}   sd ${sdv.toFixed(2)}`;
      g.fillText(txt, (w - g.measureText(txt).width) / 2, h - 16);
    };

    /* ---- a small neural network: a forward pass lights the layers left to right, then the
       error goes back right to left and the weights shift; the loss falls epoch by epoch ---- */
    const LAYERS = [3, 5, 5, 2];
    const net = {
      W: LAYERS.slice(0, -1).map((a, l) => Array.from({ length: a }, () => Array.from({ length: LAYERS[l + 1] }, () => Math.random() * 2 - 1))),
      act: LAYERS.map(n => new Array(n).fill(0) as number[]),
      phase: 0, t: 0, epoch: 1, loss: 1.1,
    };
    const nnStep = () => {
      net.t += 1 / 18; // one layer gap every ~0.6s
      const L = LAYERS.length - 1;
      if (net.phase === 0 && net.t >= L) { net.phase = 1; net.t = 0; }
      else if (net.phase === 1 && net.t >= L) {
        /* the update: every weight moves a little, the loss comes down with some noise */
        net.W.forEach(m => m.forEach(r => r.forEach((_, j) => { r[j] = Math.max(-1, Math.min(1, r[j] + (Math.random() - .5) * .35)); })));
        net.epoch++; net.loss = Math.max(.02, net.loss * (.9 + Math.random() * .06));
        if (net.epoch > 40) { net.epoch = 1; net.loss = 1.1; }
        net.phase = 0; net.t = 0;
        net.act = LAYERS.map(n => new Array(n).fill(0));
      }
      if (net.phase === 0) {
        /* activations: the inputs at random, each layer after from the one before */
        const l = Math.floor(net.t);
        if (l === 0 && net.act[0].every(v => v === 0)) net.act[0] = net.act[0].map(() => Math.random());
        for (let q = 1; q <= Math.min(l + (net.t % 1 > .85 ? 1 : 0), L); q++) {
          net.act[q] = net.act[q].map((_, j) => 1 / (1 + Math.exp(-net.act[q - 1].reduce((s, a, i) => s + a * net.W[q - 1][i][j] * 2.2, 0))));
        }
      }
    };
    const neural = () => {
      const cell = 11, cw = cell * .62, cols = Math.floor(w / cw), rows = Math.floor((h - 30) / cell);
      g.clearRect(0, 0, w, h);
      g.font = `${cell}px ${mono}`; g.textBaseline = "top";
      const L = LAYERS.length;
      const lx = (l: number) => Math.round(cols * (.14 + .72 * (l / (L - 1))));
      const ny = (l: number, i: number) => Math.round(rows * .5 + (i - (LAYERS[l] - 1) / 2) * Math.min(9, (rows * .75) / Math.max(...LAYERS)));
      /* the connections: faint dotted lines, a little brighter the stronger the weight */
      for (let l = 0; l < L - 1; l++) for (let i = 0; i < LAYERS[l]; i++) for (let j = 0; j < LAYERS[l + 1]; j++) {
        const x1 = lx(l) + 2, y1 = ny(l, i), x2 = lx(l + 1) - 2, y2 = ny(l + 1, j), wt = net.W[l][i][j];
        const steps = Math.ceil(Math.hypot(x2 - x1, (y2 - y1) * 1.6));
        g.fillStyle = mute; g.globalAlpha = .28 + .4 * Math.abs(wt);
        for (let s2 = 1; s2 < steps; s2 += 2) {
          const u = s2 / steps;
          g.fillText(".", Math.round(x1 + (x2 - x1) * u) * cw, Math.round(y1 + (y2 - y1) * u) * cell);
        }
        /* the signal: each edge's pulse leaves on its own slight delay, so the pass reads as pulses, not a wall */
        const cur = Math.floor(net.t), u = net.t % 1;
        const onEdge = net.phase === 0 ? cur === l : (L - 2 - cur) === l;
        if (onEdge) {
          const lag = (((i * 7 + j * 13 + l * 5) % 10) / 10) * .35;
          const v0 = Math.min(1, Math.max(0, (u - lag) / (1 - .35)));
          if (v0 > 0 && v0 < 1) {
            const v = net.phase === 0 ? v0 : 1 - v0;
            g.globalAlpha = .4 + .5 * Math.abs(wt); g.fillStyle = ink;
            g.fillText(net.phase === 0 ? "*" : "+", Math.round(x1 + (x2 - x1) * v) * cw, Math.round(y1 + (y2 - y1) * v) * cell);
          }
        }
      }
      /* the nodes, filled by how strongly each fires */
      const FILL = " .:o0@";
      for (let l = 0; l < L; l++) for (let i = 0; i < LAYERS[l]; i++) {
        const a = net.act[l][i], c = FILL[Math.min(FILL.length - 1, Math.round(a * (FILL.length - 1)))];
        const x = lx(l), y = ny(l, i);
        g.clearRect((x - 1) * cw - 2, y * cell, cw * 3 + 4, cell);
        g.globalAlpha = .9; g.fillStyle = ink; g.fillText("(", (x - 1) * cw, y * cell); g.fillText(")", (x + 1) * cw, y * cell);
        g.globalAlpha = .4 + .6 * a; g.fillText(c, x * cw, y * cell);
      }
      /* the output it picks */
      const out = net.act[L - 1], best = out.indexOf(Math.max(...out));
      if (net.phase === 1 || net.t > L - 1.2) { g.globalAlpha = .9; g.fillStyle = ink; g.fillText("<", (lx(L - 1) + 3) * cw, ny(L - 1, best) * cell); }
      g.globalAlpha = 1; g.fillStyle = mute; g.font = `11px ${mono}`;
      const txt = `${net.phase === 0 ? "forward pass" : "backprop    "}   epoch ${String(net.epoch).padStart(2, " ")}   loss ${net.loss.toFixed(3)}`;
      g.fillText(txt, (w - g.measureText(txt).width) / 2, h - 16);
    };

    const FONT = () => `10.5px ${mono}`;
    const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283 * v); };
    /* ---- trio: one short scene for each project, in its order, each the method in miniature.
       a: noisy detections down a lane, and a tracking filter drawing the path through them;
       b: a selection on a screen, and an explanation written out beside it;
       c: a stream of requests, split by a classifier into two lanes.
       Nothing is named; the screens after this one say what they were. ---- */
    const SC = 7; // seconds a scene lasts
    const trio = { ts: 0, scene: 0, obs: [] as number[], text: [] as [number, number][] };
    const trioNew = () => {
      trio.obs = Array.from({ length: 64 }, () => (Math.random() < .05 ? gauss() * .22 : gauss() * .065));
      trio.text = Array.from({ length: 16 }, (_, i) => [[0, 1, 1, 2][i % 4], .3 + Math.random() * .55] as [number, number]);
      parts.length = 0; split.n = 0; split.auto = 0; split.tick = 0;
    };
    const parts: { x: number; y: number; t: number; lane: number; jit: number }[] = [];
    const split = { n: 0, auto: 0, tick: 0 };
    const trioStep = () => {
      trio.ts += 1 / 30;
      if (trio.ts >= SC) { trio.ts = 0; trio.scene = (trio.scene + 1) % 3; trioNew(); }
      if (trio.scene === 2) {
        if (++split.tick % 2 === 0 && trio.ts < SC - 1.2) parts.push({ x: 0, y: 0, t: 0, lane: Math.random() < .4 ? 1 : 0, jit: gauss() * .5 });
        for (const q of parts) q.t += .012;
        for (let i = parts.length - 1; i >= 0; i--) if (parts[i].t >= 1) { split.n++; if (parts[i].lane) split.auto++; parts.splice(i, 1); }
      }
      onScene?.(trio.scene, trio.ts / SC);
    };
    trioNew();
    const seg = (x1: number, y1: number, x2: number, y2: number) => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
    const trioDraw = () => {
      g.clearRect(0, 0, w, h);
      const ts = trio.ts, env = Math.min(1, ts / .45, (SC - ts) / .55);
      g.lineCap = "round";
      let left = "", right = "";
      if (trio.scene === 0) {
        /* a lane in light perspective: its boards as faint lines, foul line at the bottom */
        const yT = 36, yB = h - 78, cx = w / 2, wb = Math.min(w * .6, 500), wt = wb * .46;
        const LX = (u: number, b: number) => cx + b * ((wb + (wt - wb) * u) / 2), LY = (u: number) => yB - (yB - yT) * u;
        g.lineWidth = 1;
        for (let k = 0; k <= 20; k++) {
          const b = -1 + k / 10; g.strokeStyle = mute; g.globalAlpha = (k === 0 || k === 20 ? .5 : .14) * env;
          seg(LX(0, b), LY(0), LX(1, b), LY(1));
        }
        g.globalAlpha = .5 * env; seg(LX(0, -1), LY(0), LX(0, 1), LY(0));
        /* the true path: out toward the edge, then the hook back in */
        const truth = (u: number) => u < .65 ? .2 + .5 * Math.sin((Math.PI / 2) * (u / .65)) : .7 - .75 * ((u - .65) / .35) ** 2;
        const prog = Math.min(1, ts / 3.6), N = trio.obs.length;
        let x = truth(0), v = 0, shown = 0, res = 0;
        const est: [number, number][] = [];
        for (let k = 0; k < N; k++) {
          const u = k / (N - 1); if (u > prog) break;
          const z = truth(u) + trio.obs[k];
          /* an alpha-beta filter, the simple cousin of a Kalman filter */
          const pred = x + v, r = z - pred; x = pred + .22 * r; v = v + .025 * r; res += r * r; shown++;
          est.push([LX(u, x), LY(u)]);
          g.strokeStyle = mute; g.globalAlpha = .75 * env; g.lineWidth = 1;
          g.beginPath(); g.arc(LX(u, z), LY(u), 2.4, 0, 6.283); g.stroke();
        }
        if (est.length > 1) {
          g.strokeStyle = ink; g.globalAlpha = .95 * env; g.lineWidth = 1.6; g.beginPath();
          est.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.stroke();
          const [hx2, hy2] = est[est.length - 1]; g.fillStyle = ink; g.beginPath(); g.arc(hx2, hy2, 3, 0, 6.283); g.fill();
        }
        left = `observations ${String(shown).padStart(2, " ")} / ${N}   alpha-beta filter`;
        right = `residual sd ${shown > 2 ? Math.sqrt(res / shown).toFixed(3) : "--"}`;
      } else if (trio.scene === 1) {
        /* a screen with lines of text; a selection traced round three of them; an explanation written out beside it */
        const sx0 = w * .03, sx1 = w * .5, sy0 = h * .1, sy1 = h * .84, lh = (sy1 - sy0 - 60) / 16;
        g.strokeStyle = mute; g.globalAlpha = .45 * env; g.lineWidth = 1;
        g.beginPath(); g.roundRect(sx0, sy0, sx1 - sx0, sy1 - sy0, 8); g.stroke();
        seg(sx0, sy0 + 22, sx1, sy0 + 22);
        const SEL = [6, 7, 8];
        const selA = Math.min(1, Math.max(0, (ts - .6) / .9));
        trio.text.forEach(([ind, len], i) => {
          const y = sy0 + 44 + i * lh, x = sx0 + 22 + ind * 18;
          g.strokeStyle = SEL.includes(i) && selA >= 1 ? ink : mute; g.globalAlpha = (SEL.includes(i) && selA >= 1 ? .8 : .3) * env; g.lineWidth = 2;
          seg(x, y, x + (sx1 - sx0 - 60 - ind * 18) * len, y);
        });
        /* the selection, its edge traced round */
        const ry0 = sy0 + 44 + 6 * lh - lh * .55, ry1 = sy0 + 44 + 8 * lh + lh * .55, rx0 = sx0 + 12, rx1 = sx1 - 12;
        const per = 2 * (rx1 - rx0 + ry1 - ry0); let rem = per * selA;
        g.strokeStyle = ink; g.globalAlpha = .9 * env; g.lineWidth = 1.2; g.beginPath(); g.moveTo(rx0, ry0);
        for (const [ax, ay, bx, by] of [[rx0, ry0, rx1, ry0], [rx1, ry0, rx1, ry1], [rx1, ry1, rx0, ry1], [rx0, ry1, rx0, ry0]]) {
          const L = Math.hypot(bx - ax, by - ay), f = Math.min(1, rem / L); if (f <= 0) break;
          g.lineTo(ax + (bx - ax) * f, ay + (by - ay) * f); rem -= L;
        }
        g.stroke();
        /* the connector out to the explanation */
        const ex0 = w * .6, ex1 = w * .97, cA = Math.min(1, Math.max(0, (ts - 1.6) / .5));
        const my = (ry0 + ry1) / 2, ey = h * .26;
        if (cA > 0) {
          g.strokeStyle = mute; g.globalAlpha = .6 * env; g.lineWidth = 1; g.beginPath(); g.moveTo(rx1, my);
          for (let m = 1; m <= 30 * cA; m++) { const u = m / 30, iu = 1 - u, mx = (rx1 + ex0) / 2;
            g.lineTo(iu ** 3 * rx1 + 3 * iu * iu * u * mx + 3 * iu * u * u * mx + u ** 3 * (ex0 - 8), iu ** 3 * my + 3 * iu * iu * u * my + 3 * iu * u * u * ey + u ** 3 * ey); }
          g.stroke();
        }
        /* the explanation: three short paragraphs written line by line */
        const LINES = [[1, .92], [0, .8], [0, .55], [2, .9], [0, .86], [0, .4], [3, .88], [0, .7], [0, .62]];
        const wA = Math.max(0, (ts - 2.1) / 3.4) * LINES.length;
        let tok = 0;
        LINES.forEach(([step, len], i) => {
          const f = Math.min(1, Math.max(0, wA - i)); if (f <= 0) return;
          const y = ey + i * 26 + (i >= 3 ? 14 : 0) + (i >= 6 ? 14 : 0);
          if (step) { g.fillStyle = mute; g.globalAlpha = .8 * env; g.font = FONT(); g.textBaseline = "middle"; g.fillText(String(step), ex0, y); }
          g.strokeStyle = ink; g.globalAlpha = .6 * env; g.lineWidth = 2;
          seg(ex0 + 22, y, ex0 + 22 + (ex1 - ex0 - 22) * len * f, y);
          tok += Math.round(24 * len * f);
        });
        left = `selection 3 lines   explanation`;
        right = `tokens ${String(tok).padStart(3, " ")}`;
      } else {
        /* requests flow in, a classifier splits them: people one way, automated the other */
        const ix = w * .03, nx = w * .4, ox = w * .86, my = h * .45, uy = h * .2, ly = h * .72;
        const P = (lane: number, u: number): [number, number] => {
          const ty = lane ? ly : uy, iu = 1 - u, mx = (nx + ox) / 2;
          return [iu ** 3 * nx + 3 * iu * iu * u * mx + 3 * iu * u * u * mx + u ** 3 * ox, iu ** 3 * my + 3 * iu * iu * u * my + 3 * iu * u * u * ty + u ** 3 * ty];
        };
        g.strokeStyle = mute; g.lineWidth = 1; g.globalAlpha = .3 * env; seg(ix, my, nx, my);
        for (const lane of [0, 1]) { g.beginPath(); for (let m = 0; m <= 40; m++) { const [a, b] = P(lane, m / 40); m ? g.lineTo(a, b) : g.moveTo(a, b); } g.stroke(); }
        /* the classifier: a node where the stream splits */
        g.globalAlpha = .9 * env; g.strokeStyle = ink; g.lineWidth = 1.2; g.beginPath(); g.arc(nx, my, 7, 0, 6.283); g.stroke();
        for (const q of parts) {
          let px: number, py: number;
          const s1 = .45;
          if (q.t < s1) { px = ix + (nx - ix) * (q.t / s1); py = my + q.jit * 10; }
          else { [px, py] = P(q.lane, (q.t - s1) / (1 - s1)); py += q.jit * 6 * (1 - (q.t - s1) / (1 - s1)); }
          g.globalAlpha = .85 * env;
          if (q.t >= s1 && q.lane) { g.fillStyle = ink; g.beginPath(); g.arc(px, py, 2.3, 0, 6.283); g.fill(); }
          else { g.strokeStyle = q.t < s1 ? mute : ink; g.lineWidth = 1; g.beginPath(); g.arc(px, py, 2.3, 0, 6.283); g.stroke(); }
        }
        g.fillStyle = mute; g.globalAlpha = .9 * env; g.font = FONT(); g.textBaseline = "middle";
        g.fillText(`people     ${split.n - split.auto}`, ox + 10, uy);
        g.fillText(`automated  ${split.auto}`, ox + 10, ly);
        left = `requests ${String(split.n).padStart(3, " ")}   classified`;
        right = `automated share ${split.n ? (split.auto / split.n).toFixed(2) : "--"}`;
      }
      g.globalAlpha = env; g.fillStyle = mute; g.font = FONT(); g.textBaseline = "alphabetic";
      g.fillText(left, 2, h - 14);
      g.fillText(right, w - g.measureText(right).width - 2, h - 14);
      g.globalAlpha = 1;
    };

    /* ---- line art, after simulations drawn as hairlines: many faint runs, one in focus, quiet counters ---- */

    /* A. random walks: paths draw left to right, and where each ends builds a histogram on the right */
    const WSTEPS = 120, WSD = Math.sqrt(WSTEPS), WBINS = 33, WMAX = 1400;
    type Walk = { pts: Float32Array; head: number; feat: boolean };
    const wk = { live: [] as Walk[], done: [] as Walk[], bins: new Array(WBINS).fill(0) as number[], n: 0, sum: 0, sq: 0, tick: 0, fade: 1, hold: 0 };
    const newWalk = (feat: boolean): Walk => {
      const pts = new Float32Array(WSTEPS + 1);
      for (let i = 1; i <= WSTEPS; i++) pts[i] = pts[i - 1] + gauss();
      return { pts, head: 0, feat };
    };
    const walkStep = () => {
      if (wk.hold > 0) { if (--wk.hold === 0) wk.fade = .999; return; }
      if (wk.fade < 1) { wk.fade -= .04; if (wk.fade <= 0) Object.assign(wk, { live: [], done: [], bins: new Array(WBINS).fill(0), n: 0, sum: 0, sq: 0, fade: 1 }); return; }
      if (++wk.tick % 3 === 0 && wk.live.length < 14) wk.live.push(newWalk(!wk.live.some(x => x.feat)));
      for (const x of wk.live) x.head = Math.min(WSTEPS, x.head + 4);
      wk.live = wk.live.filter(x => {
        if (x.head < WSTEPS) return true;
        const end = x.pts[WSTEPS], b = Math.round(((end / WSD) + 3.5) / 7 * (WBINS - 1));
        if (b >= 0 && b < WBINS) wk.bins[b]++;
        wk.n++; wk.sum += end; wk.sq += end * end;
        x.feat = false; wk.done.push(x); if (wk.done.length > 70) wk.done.shift();
        return false;
      });
      if (wk.n >= WMAX) { wk.hold = 90; wk.live = []; }
    };
    const walks = () => {
      g.clearRect(0, 0, w, h);
      const top = 20, bot = h - 52, mid = (top + bot) / 2, half = (bot - top) / 2;
      const x0 = w * .04, x1 = w * .7, hx = x1 + w * .04, hw = w * .22;
      const Y = (v: number) => mid - (v / (3.5 * WSD)) * half;
      const X = (i: number) => x0 + ((x1 - x0) * i) / WSTEPS;
      g.globalAlpha = wk.fade;
      /* the zero line and the end of the run */
      g.strokeStyle = mute; g.lineWidth = 1; g.globalAlpha = .35 * wk.fade;
      g.setLineDash([2, 4]); g.beginPath(); g.moveTo(x0, mid); g.lineTo(x1, mid); g.stroke(); g.setLineDash([]);
      g.beginPath(); g.moveTo(x1 + .5, top); g.lineTo(x1 + .5, bot); g.stroke();
      const path = (x: Walk) => { g.beginPath(); g.moveTo(X(0), Y(0)); for (let i = 1; i <= x.head; i++) g.lineTo(X(i), Y(x.pts[i])); g.stroke(); };
      /* the finished runs, faint; those under way a little stronger; the one in focus in ink */
      g.lineWidth = 1;
      wk.done.forEach((x, i) => { g.strokeStyle = mute; g.globalAlpha = (.06 + .14 * (i / wk.done.length)) * wk.fade; path(x); });
      for (const x of wk.live) if (!x.feat) { g.strokeStyle = mute; g.globalAlpha = .45 * wk.fade; path(x); }
      const f = wk.live.find(x => x.feat);
      if (f) {
        g.strokeStyle = ink; g.globalAlpha = .95 * wk.fade; g.lineWidth = 1.4; path(f);
        g.fillStyle = ink; g.beginPath(); g.arc(X(f.head), Y(f.pts[f.head]), 2.6, 0, 6.283); g.fill();
      }
      /* the histogram of where they ended, and the normal curve it is filling toward */
      const sc = (WBINS - 1) / 7, expPeak = wk.n / (sc * Math.sqrt(2 * Math.PI));
      /* bars and curve share one scale, so the curve sits where the bars should end up */
      const peak = Math.max(...wk.bins, expPeak, 1), bh = (bot - top) / WBINS;
      g.fillStyle = mute;
      wk.bins.forEach((c, b) => {
        if (!c) return;
        const v = ((b / (WBINS - 1)) * 7 - 3.5) * WSD;
        g.globalAlpha = .75 * wk.fade;
        g.fillRect(hx, Y(v) - .75, (c / peak) * hw, 1.5);
      });
      if (wk.n > 60) {
        g.strokeStyle = ink; g.globalAlpha = .7 * wk.fade; g.lineWidth = 1; g.beginPath();
        for (let k = 0; k <= 80; k++) {
          const z = (k / 80) * 7 - 3.5, dens = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI) * (wk.n / sc);
          const xx = hx + (dens / peak) * hw, yy = Y(z * WSD);
          k ? g.lineTo(xx, yy) : g.moveTo(xx, yy);
        }
        g.stroke();
      }
      /* counters */
      g.globalAlpha = 1; g.fillStyle = mute; g.font = FONT(); g.textBaseline = "alphabetic";
      const mean = wk.n ? wk.sum / wk.n : 0, sd = wk.n > 1 ? Math.sqrt(wk.sq / wk.n - mean * mean) : 0;
      g.fillText(`random walks   n ${wk.n.toLocaleString("en-US").padStart(5, " ")}   steps ${WSTEPS}`, x0, h - 14);
      const r = `mean ${mean >= 0 ? "+" : ""}${mean.toFixed(2)}   sd ${sd.toFixed(2)}   (√${WSTEPS} = ${WSD.toFixed(2)})`;
      g.fillText(r, w - g.measureText(r).width - 2, h - 14);
    };

    /* B. a decision tree grown split by split, left to right; branch widths are the samples
       that flow down them; then a sample at a time is classified along its path */
    type TNode = { n: number; p: number; d: number; kids: TNode[]; rule: string; x: number; y: number; born: number; leafIdx: number };
    const tr = { root: null as TNode | null, order: [] as TNode[], t: 0, hold: 0, fade: 1, sample: [] as TNode[], sp: 0, seen: 0, correct: 0 };
    const grow = () => {
      let leaves = 0;
      const mk = (n: number, p: number, d: number): TNode => {
        const node: TNode = { n, p, d, kids: [], rule: "", x: 0, y: 0, born: 0, leafIdx: -1 };
        const stop = d >= 4 || n < 90 || (d >= 2 && Math.random() < .25);
        if (stop) { node.leafIdx = leaves++; return node; }
        const f = 1 + Math.floor(Math.random() * 6), th = (.2 + Math.random() * .6).toFixed(2);
        node.rule = `x${f} ≤ ${th}`;
        const q = .3 + Math.random() * .4, shift = .12 + Math.random() * .2;
        const pa = Math.min(.98, Math.max(.02, p + shift * (Math.random() < .5 ? 1 : -1)));
        const pb = Math.min(.98, Math.max(.02, (p - q * pa) / (1 - q)));
        node.kids = [mk(Math.round(n * q), pa, d + 1), mk(n - Math.round(n * q), pb, d + 1)];
        return node;
      };
      const root = mk(1000, .5, 0);
      /* breadth first, so it grows a level at a time */
      const order: TNode[] = [], qu = [root];
      while (qu.length) { const a = qu.shift()!; order.push(a); qu.push(...a.kids); }
      order.forEach((nd, i) => { nd.born = i * .32; });
      Object.assign(tr, { root, order, t: 0, hold: 0, fade: 1, sample: [], sp: 0, seen: 0, correct: 0 });
      (tr as unknown as { leaves: number }).leaves = leaves;
    };
    grow();
    const treeStep = () => {
      if (tr.hold > 0) { if (--tr.hold === 0) tr.fade = .999; }
      if (tr.fade < 1) { tr.fade -= .04; if (tr.fade <= 0) grow(); return; }
      tr.t += 1 / 30;
      const grown = tr.t > (tr.order.at(-1)!.born + 1);
      if (grown) {
        /* classify: a sample runs from the root to a leaf, picked by the branch sizes */
        if (!tr.sample.length) {
          const path = [tr.root!];
          while (path.at(-1)!.kids.length) { const k = path.at(-1)!.kids; path.push(Math.random() * (k[0].n + k[1].n) < k[0].n ? k[0] : k[1]); }
          tr.sample = path; tr.sp = 0;
        }
        tr.sp += .09;
        if (tr.sp >= tr.sample.length - 1) {
          const leaf = tr.sample.at(-1)!; tr.seen++; if (Math.random() < Math.max(leaf.p, 1 - leaf.p)) tr.correct++;
          tr.sample = [];
          if (tr.seen >= 24 && !tr.hold) tr.hold = 60;
        }
      }
    };
    const tree = () => {
      g.clearRect(0, 0, w, h);
      const root = tr.root!; if (!root) return;
      const leaves = (tr as unknown as { leaves: number }).leaves;
      const top = 28, bot = h - 56, x0 = w * .05, x1 = w * .78, depth = 4;
      /* leaves spread evenly down the right; every split sits level with the middle of its children */
      const place = (nd: TNode): number => {
        nd.x = x0 + ((x1 - x0) * nd.d) / depth;
        if (!nd.kids.length) { nd.x = x1; nd.y = top + ((bot - top) * (nd.leafIdx + .5)) / leaves; return nd.y; }
        nd.y = (place(nd.kids[0]) + place(nd.kids[1])) / 2; return nd.y;
      };
      place(root);
      g.globalAlpha = tr.fade;
      const prog = (nd: TNode) => Math.min(1, Math.max(0, (tr.t - nd.born) / .9));
      const bez = (a: TNode, k: TNode, u: number): [number, number] => {
        const mx = (a.x + k.x) / 2, iu = 1 - u;
        return [iu ** 3 * a.x + 3 * iu * iu * u * mx + 3 * iu * u * u * mx + u ** 3 * k.x,
                iu ** 3 * a.y + 3 * iu * iu * u * a.y + 3 * iu * u * u * k.y + u ** 3 * k.y];
      };
      /* branches: a curve from each split to each child, drawn in as the child is born, as wide as its samples */
      for (const nd of tr.order) for (const k of nd.kids) {
        const a = prog(k); if (a <= 0) continue;
        const ease2 = 1 - (1 - a) ** 3;
        g.strokeStyle = mute; g.globalAlpha = .7 * tr.fade; g.lineWidth = .6 + 3.2 * (k.n / 1000);
        g.beginPath();
        const mx = (nd.x + k.x) / 2, steps = 30;
        for (let i = 0; i <= steps * ease2; i++) {
          const u = i / steps, iu = 1 - u;
          const bx = iu ** 3 * nd.x + 3 * iu * iu * u * mx + 3 * iu * u * u * mx + u ** 3 * k.x;
          const by = iu ** 3 * nd.y + 3 * iu * iu * u * nd.y + 3 * iu * u * u * k.y + u ** 3 * k.y;
          i ? g.lineTo(bx, by) : g.moveTo(bx, by);
        }
        g.stroke();
      }
      /* splits: a tick and the rule; leaves: the count, and a bar for how pure the leaf is */
      g.font = FONT(); g.textBaseline = "middle";
      for (const nd of tr.order) {
        const a = prog(nd); if (a <= 0) continue;
        g.globalAlpha = a * tr.fade; g.fillStyle = ink;
        if (nd.kids.length) {
          g.fillRect(nd.x - 1, nd.y - 6, 2, 12);
          g.fillStyle = mute; g.fillText(nd.rule, nd.x + 6, nd.y - 9);
        } else {
          const pur = Math.max(nd.p, 1 - nd.p);
          g.fillRect(nd.x, nd.y - .5, 6, 1);
          g.fillStyle = ink; g.fillText(`n ${String(nd.n).padStart(3, " ")}`, nd.x + 12, nd.y);
          g.fillStyle = mute; g.globalAlpha = .35 * a * tr.fade; g.fillRect(nd.x + 64, nd.y - 2, 60, 4);
          g.globalAlpha = .85 * a * tr.fade; g.fillStyle = ink; g.fillRect(nd.x + 64, nd.y - 2, 60 * pur, 4);
          g.fillStyle = mute; g.fillText(`${Math.round(pur * 100)}%`, nd.x + 130, nd.y);
        }
      }
      /* the sample being classified, in focus: it runs along the branches it is sent down */
      if (tr.sample.length) {
        const i = Math.floor(tr.sp), u = tr.sp - i;
        g.strokeStyle = ink; g.globalAlpha = .95 * tr.fade; g.lineWidth = 1.5; g.beginPath();
        let hp: [number, number] = [tr.sample[0].x, tr.sample[0].y];
        g.moveTo(hp[0], hp[1]);
        for (let q = 0; q <= i && q < tr.sample.length - 1; q++) {
          const end = q < i ? 1 : u;
          for (let m = 1; m <= 24; m++) { const pt = bez(tr.sample[q], tr.sample[q + 1], (m / 24) * end); g.lineTo(pt[0], pt[1]); hp = pt; }
        }
        g.stroke();
        g.fillStyle = ink; g.beginPath(); g.arc(hp[0], hp[1], 2.8, 0, 6.283); g.fill();
      }
      g.globalAlpha = 1; g.fillStyle = mute; g.font = FONT(); g.textBaseline = "alphabetic";
      const nodes = tr.order.length;
      g.fillText(`decision tree   samples 1,000   splits ${nodes - leaves}   leaves ${leaves}`, x0, h - 14);
      const r = `classified ${String(tr.seen).padStart(2, " ")}   accuracy ${tr.seen ? (tr.correct / tr.seen).toFixed(2) : "--"}`;
      g.fillText(r, w - g.measureText(r).width - 2, h - 14);
    };

    /* ---- ascii torus ---- */
    const RAMP = " .,-~:;=!*#$@";
    const ascii = (t: number) => {
      const cell = 11, cw = cell * .62, cols = Math.floor(w / cw), rows = Math.floor(h / cell);
      const A = t * .00035 + py * .6, B = t * .00022 + px * .8;
      const cA = Math.cos(A), sA = Math.sin(A), cB = Math.cos(B), sB = Math.sin(B);
      const R1 = 1, R2 = 2.1, K2 = 6;
      const K1 = Math.min(cols * cw, rows * cell) * K2 * .3 / (R1 + R2);
      const z = new Float32Array(cols * rows), lum = new Int8Array(cols * rows).fill(-1);
      for (let th = 0; th < 6.283; th += .05) {
        const ct = Math.cos(th), st = Math.sin(th);
        for (let ph = 0; ph < 6.283; ph += .018) {
          const cp = Math.cos(ph), sp = Math.sin(ph);
          const cx = R2 + R1 * ct, cy = R1 * st;
          const x = cx * (cB * cp + sA * sB * sp) - cy * cA * sB;
          const y = cx * (sB * cp - sA * cB * sp) + cy * cA * cB;
          const zz = K2 + cA * cx * sp + cy * sA, oz = 1 / zz;
          const xp = Math.floor(cols / 2 + (K1 * oz * x) / cw), yp = Math.floor(rows / 2 - (K1 * oz * y) / cell);
          if (xp < 0 || xp >= cols || yp < 0 || yp >= rows) continue;
          const L = cp * ct * sB - cA * ct * sp - sA * st + cB * (cA * st - ct * sA * sp);
          const k = yp * cols + xp;
          if (oz > z[k]) { z[k] = oz; lum[k] = L > 0 ? Math.min(Math.floor(L * 8), RAMP.length - 2) + 1 : 0; }
        }
      }
      g.clearRect(0, 0, w, h);
      g.font = `${cell}px ${mono}`;
      g.textBaseline = "top";
      for (let k = 0; k < cols * rows; k++) {
        const l = lum[k];
        if (l < 0) continue;
        g.fillStyle = l < 4 ? mute : ink;
        g.globalAlpha = .35 + .65 * (l / (RAMP.length - 1));
        g.fillText(l === 0 ? "." : RAMP[l], (k % cols) * cw, Math.floor(k / cols) * cell);
      }
      g.globalAlpha = 1;
    };

    /* ---- contour lines over a drifting field ---- */
    const field = (x: number, y: number, t: number) =>
      Math.sin(x * 1.7 + t * .6) * Math.cos(y * 1.3 - t * .4) +
      .6 * Math.sin((x + y) * 2.3 - t * .5 + Math.sin(x * .7 + t * .2)) +
      .4 * Math.cos(Math.hypot(x - 1.2 - px * .6, y - .8 - py * .6) * 3.1 - t * .7);
    const contour = (t: number) => {
      const s = 7, cols = Math.ceil(w / s) + 1, rows = Math.ceil(h / s) + 1, sc = 3.2 / Math.max(w, h), tt = t * .00022;
      const v = new Float32Array(cols * rows);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) v[j * cols + i] = field(i * s * sc, j * s * sc, tt);
      g.clearRect(0, 0, w, h);
      g.lineWidth = 1;
      const LEVELS = 14;
      for (let n = 0; n < LEVELS; n++) {
        const lv = -1.8 + (3.6 * (n + .5)) / LEVELS;
        g.beginPath();
        for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
          const a = v[j * cols + i], b = v[j * cols + i + 1], d = v[(j + 1) * cols + i], e = v[(j + 1) * cols + i + 1];
          const idx = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (e > lv ? 2 : 0) | (d > lv ? 1 : 0);
          if (idx === 0 || idx === 15) continue;
          const x = i * s, y = j * s, f = (p: number, q: number) => (lv - p) / (q - p);
          const T: [number, number] = [x + s * f(a, b), y], Rr: [number, number] = [x + s, y + s * f(b, e)];
          const Bm: [number, number] = [x + s * f(d, e), y + s], L: [number, number] = [x, y + s * f(a, d)];
          const seg = (p: [number, number], q: [number, number]) => { g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); };
          switch (idx) {
            case 1: case 14: seg(L, Bm); break;
            case 2: case 13: seg(Bm, Rr); break;
            case 3: case 12: seg(L, Rr); break;
            case 4: case 11: seg(T, Rr); break;
            case 6: case 9: seg(T, Bm); break;
            case 7: case 8: seg(L, T); break;
            case 5: seg(L, T); seg(Bm, Rr); break;
            case 10: seg(T, Rr); seg(L, Bm); break;
          }
        }
        /* every fourth line is an index contour, a shade darker, the way a survey map draws them */
        g.strokeStyle = n % 4 === 0 ? ink : mute;
        g.globalAlpha = n % 4 === 0 ? .55 : .32;
        g.stroke();
      }
      g.globalAlpha = 1;
    };

    const draw = (t: number) => kind === "trio" ? trioDraw() : kind === "walks" ? walks() : kind === "tree" ? tree() : kind === "galton" ? galton() : kind === "nn" ? neural() : (kind === "descent" ? descent : kind === "ascii" ? ascii : contour)(t);
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (t - last < 33) return; // ~30 fps is plenty for something this slow
      last = t;
      if (++frame % 30 === 1) colours();
      px += (tx - px) * .06; py += (ty - py) * .06;
      if (kind === "descent") advance();
      if (kind === "galton") galStep();
      if (kind === "walks") walkStep();
      if (kind === "trio") trioStep();
      if (kind === "tree") treeStep();
      if (kind === "nn") nnStep();
      draw(t);
    };
    const move = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
      ty = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
    };

    size(); colours();
    const ro = new ResizeObserver(() => { size(); K = 0; galLayout(); draw(performance.now()); });
    ro.observe(c);
    galLayout();
    /* less motion: a board already filled, a network mid-way through its forward pass */
    if (reduce && kind === "galton") { for (let k = 0; k < 4000 && gal.hold === 0; k++) galStep(); }
    if (reduce && kind === "nn") for (let k = 0; k < 40; k++) nnStep();
    if (reduce && kind === "trio") trio.ts = 4.5;
    if (reduce && kind === "walks") for (let k = 0; k < 1200; k++) walkStep();
    if (reduce && kind === "tree") { tr.t = 99; }
    if (reduce && kind === "descent") for (let k = 0; k < 400 && run.rest === 0; k++) advance();
    if (reduce || !on) draw(reduce ? 4000 : performance.now());
    else { raf = requestAnimationFrame(tick); addEventListener("pointermove", move); }
    return () => { cancelAnimationFrame(raf); ro.disconnect(); removeEventListener("pointermove", move); };
  }, [kind, on, onScene]);

  return <canvas ref={cv} className={`tart ${kind}`} aria-hidden="true" />;
}
