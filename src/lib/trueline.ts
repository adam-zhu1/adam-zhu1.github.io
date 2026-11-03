/* eslint-disable */
/**
 * The TrueLine sequence. Ported from the prototype and driven entirely by the real
 * analysis: track.json (70 tracked frames of Adam's throw) and the app's own lane
 * geometry, so the overlay on the video and the plan view each match what TrueLine
 * itself draws on that surface.
 */
import TRACK from "../data/trueline-track.json";
import GEO from "../data/trueline-lane.json";

type Els = { vid: HTMLVideoElement; ov: SVGSVGElement; steps: HTMLElement; capL: HTMLElement; capR: HTMLElement; nums: HTMLElement; onLive?: (t: string) => void };

export function createTrueLine(els: Els) {
  const NS = "http://www.w3.org/2000/svg";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const el = (t: string, a: Record<string, any> = {}) => { const n = document.createElementNS(NS, t); for (const [k, v] of Object.entries(a)) n.setAttribute(k, String(v)); return n as any; };
  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
  const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
  const eOut = (t: number) => 1 - Math.pow(1 - t, 3);
  const eInOut = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const lerp = (a: number[], b: number[], k: number) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  const MINT = "#40e69e", MINTDIM = "#29946b", ACCENT = "#00b878", WHITE = "#ffffff", MUTE = "#63636a", INK2 = "#a3a3a8";
  const SANS = "Geist, sans-serif";
  /* ---------- the two surfaces ---------- */
  const W = 560, H = 560;
  const VID = { x: 0, y: 0, w: 248, h: 542 };                       // 420x780 crop ratio
  const V = (p: number[]) => [VID.x + p[0] * VID.w, VID.y + p[1] * VID.h];
  /* plan view card, built to LaneViewCanvas: width x3.5, deck depth x2.625, lane length true */
  const PV = GEO.plan;
  const CARD = { x: 300, y: 0, w: 260, h: 542, r: 12 };
  const PAD = 26;
  const laneH = (CARD.h - 2 * PAD) / (PV.drawn_feet / 60);          // lane 0..60 ft
  const deckH = laneH * (PV.drawn_feet - 60) / 60;                   // exaggerated rack depth
  const laneW = laneH * (39 * (41.5 / 39) / 720) * PV.width_ex;      // 1:4.96
  const gutW = laneW * PV.gutter_frac;
  const laneX = CARD.x + (CARD.w - laneW) / 2, laneY = CARD.y + PAD + deckH;
  const Lc = (b, f) => [laneX + laneW * (1 - b / 39), laneY + laneH * (1 - f / 60)];   // f may exceed 60 (drawn feet)
  const pinRplan = PV.pin_r_boards * (laneW / 39);

  /* pair each video pin with the plan pin in the same row and nearest board */
  const planPins = PV.pins.slice();
  const rowOf = f => f < 60.5 ? 0 : f < 61.3 ? 1 : f < 62.2 ? 2 : 3;
  const planRowOf = f => f < 61 ? 0 : f < 63.5 ? 1 : f < 65.5 ? 2 : 3;
  const pins = GEO.video.pins.map(vp => {
    const r = rowOf(vp.l[1]);
    const cands = planPins.filter(pp => planRowOf(pp[1]) === r);
    const best = cands.reduce((a, c) => Math.abs(c[0] - vp.l[0]) < Math.abs(a[0] - vp.l[0]) ? c : a, cands[0]);
    return { v: vp.v, plan: best, rv: vp.rv, pocket: (vp.pin === 1 || vp.pin === 3) };
  });
  const arrows = GEO.video.arrows.map((a, i) => ({ v: a.v, plan: PV.arrows[i] }));
  const seams = GEO.video.seams.map((s, i) => ({ v0: s[0].v, v1: s[1].v, b: PV.seams[i] }));
  const outline = GEO.video.outline.map(o => ({ v: o.v, l: o.l }));

  /* the fit as a matrix, lane (board, ft) to the frame, solved from the four outline corners.
     It reproduces every seam, arrow and landmark to within a tenth of a pixel. The first
     guess lays the lane flat and square across the frame; calibrating is shown as one
     becoming the other, so the moment the lane snaps onto the footage is the fit. */
  function solveH(src: number[][], dst: number[][]) {
    const A: number[][] = [];
    src.forEach(([x, y], i) => { const [u, v] = dst[i]; A.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u], [0, 0, 0, x, y, 1, -v * x, -v * y, v]); });
    for (let c = 0; c < 8; c++) {
      const r = A.slice(c).reduce((b, row, j) => Math.abs(row[c]) > Math.abs(A[b][c]) ? c + j : b, c);
      [A[c], A[r]] = [A[r], A[c]];
      for (let j = 0; j < 8; j++) if (j !== c) { const f = A[j][c] / A[c][c]; for (let k = c; k < 9; k++) A[j][k] -= f * A[c][k]; }
    }
    const h = A.map((row, i) => row[8] / row[i]);
    return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
  }
  const H1 = solveH(outline.map(o => o.l), outline.map(o => o.v));
  const H0 = [-.7 / 39, 0, .85, 0, -.5 / 60, .84, 0, 0, 1];
  const proj = (H: number[], [b, f]: number[]) => { const w = H[6] * b + H[7] * f + H[8]; return [(H[0] * b + H[1] * f + H[2]) / w, (H[3] * b + H[4] * f + H[5]) / w]; };
  const MARKS = GEO.video.marks;

  const P = TRACK.pts, T_START = TRACK.t_start, CLIP_END = 3.75, M = Object.fromEntries(TRACK.metrics.map(m => [m.n, m]));
  const { vid, ov, steps, capL, capR, nums } = els;
  let lastSaid = "";
  const NUMS = ["Speed", "Board at Arrows", "Entry Board", "Entry Angle", "Breakpoint", "Hook"];
  const M0 = n => TRACK.metrics.find(m => m.n === n);
  nums.replaceChildren(...NUMS.map(n => { const d = document.createElement("div"); d.className = "num"; const m = M0(n); d.innerHTML = `<small>${m.n}</small><b class="${n === "Entry Angle" ? "mint" : ""}">–</b><i${m.u === "deg" ? ' class="deg"' : ""}>${m.u === "deg" ? "°" : m.u}</i>`; return d; }));
  function numsShow(k) { [...nums.children].forEach((d, i) => { const o = clamp(k * 6 - i * .9, 0, 1); if (o <= 0) return; d.classList.add("on"); d.querySelector("b").textContent = (M0(NUMS[i]).v * eOut(o)).toFixed(1); }); }
  function numsReset() { [...nums.children].forEach(d => { d.classList.remove("on"); d.querySelector("b").textContent = "–"; }); }
  const T = { play: .6, hold: .6 + CLIP_END, cal: .6 + CLIP_END + 2.9, mv: .6 + CLIP_END + 4.3, plan: .6 + CLIP_END + 6.1, met: .6 + CLIP_END + 6.9, end: .6 + CLIP_END + 11.2 };
  /* calibrating, in three beats after the clip: the landmarks are found, the lane is fitted
     to them, and a sweep down the lane lays the arrows and pins in once the fit holds */
  const C = { found: T.hold + 1.0, fit: T.hold + 2.3, swept: T.hold + 2.9 };
  const STAGE_AT = [0, T.hold, T.mv - .3, T.met];

  const smooth = (pts: number[][]) => { let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)]; d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`; } return d; };
  function ptAt(t: number): any { if (t <= P[0].t) return P[0]; for (let i = 1; i < P.length; i++) if (P[i].t >= t) { const a = P[i - 1], b = P[i], k = (t - a.t) / (b.t - a.t || 1); return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, r: a.r + (b.r - a.r) * k, b: a.b + (b.b - a.b) * k, f: a.f + (b.f - a.f) * k, m: b.m, c: b.c }; } return P[P.length - 1]; }
  function text(g: any, x: number, y: number, s: string, o: any = {}) { const n = el("text", { x, y, fill: o.fill || WHITE, "font-size": o.size || 12, "font-family": SANS, "font-weight": o.weight || 400, "text-anchor": o.anchor || "start", opacity: o.op ?? 1 }); n.textContent = s; g.appendChild(n); return n; }
  let uid = 0;
  const found = (t: number) => clamp(Math.floor((t - T.hold) / .15) + 1, 1, 6);

  function draw(t) {
    const g = document.createDocumentFragment();
    const defs = el("defs"); g.appendChild(defs);
    const clipT = t < T.hold ? clamp(t - T.play, 0, CLIP_END) : CLIP_END;
    const fitK = eInOut(seg(t, C.found, C.fit));                     // first guess to the fit
    const geoOn = seg(t, C.found - .1, C.found + .3);
    const sweepF = -2 + seg(t, C.fit, C.swept) * 74;                   // ft down the lane, past the pins
    const Hk = H1.map((v, i) => H0[i] + (v - H0[i]) * fitK);
    const at = (l: number[], v: number[]) => fitK < 1 ? V(proj(Hk, l)) : V(v);
    const move = eInOut(seg(t, T.mv, T.plan));
    const metrics = seg(t, T.met, T.met + 1.6);
    const fade = seg(t, T.mv, T.mv + .9);
    const back = eOut(seg(t, T.plan, T.plan + .9));

    /* ---- plan view card, arriving as the geometry travels in ---- */
    if (move > .01) {
      const o = move;
      const lg = el("linearGradient", { id: "lg" + (++uid), x1: 0, y1: 1, x2: 0, y2: 0 });
      lg.appendChild(el("stop", { offset: 0, "stop-color": "#1c1d1f" })); lg.appendChild(el("stop", { offset: 1, "stop-color": "#141516" })); defs.appendChild(lg);
      g.appendChild(el("rect", { x: CARD.x, y: CARD.y, width: CARD.w, height: CARD.h, rx: CARD.r, fill: "#0d0e0f", opacity: o }));
      g.appendChild(el("rect", { x: laneX - gutW, y: laneY, width: gutW, height: laneH, fill: "#000", opacity: o * .5 }));
      g.appendChild(el("rect", { x: laneX + laneW, y: laneY, width: gutW, height: laneH, fill: "#000", opacity: o * .5 }));
      g.appendChild(el("rect", { x: laneX, y: laneY, width: laneW, height: laneH, fill: `url(#${lg.id})`, opacity: o }));
      /* deck backing: from the top of the rack down to the pin line, spanning lane and gutters */
      g.appendChild(el("rect", { x: laneX - gutW, y: laneY - deckH - pinRplan - 4, width: laneW + 2 * gutW, height: deckH + pinRplan + 4, fill: "#000", opacity: o * .35 }));
      g.appendChild(el("line", { x1: laneX - gutW, y1: laneY + laneH, x2: laneX + laneW + gutW, y2: laneY + laneH, stroke: MINTDIM, "stroke-width": 2, opacity: o }));
    }

    /* ---- video-space clip that releases as things travel ---- */
    const grow = clamp(move / .22, 0, 1);
    const cid = "cl" + (++uid), cp = el("clipPath", { id: cid });
    cp.appendChild(el("rect", { x: VID.x - grow * 40, y: VID.y - grow * 80, width: VID.w + grow * (W - VID.w + 40), height: VID.h + grow * (H - VID.h + 80), rx: 8 }));
    defs.appendChild(cp);
    const cg = el("g", { "clip-path": `url(#${cid})` }); g.appendChild(cg);

    /* ---- lane geometry: video model on the footage, plan model in the card ---- */
    if (t >= T.hold) {
      const vo = 1 - move;                                             // video-only strokes fade as the plan takes over
      /* the landmarks, found one by one, each with a ping; they flash once the fit lands on them */
      const lo = seg(t, T.hold, T.hold + .3) * (1 - seg(t, T.cal + .4, T.mv));
      if (lo > .01) MARKS.forEach((it, i) => {
        const p = V(it.v), u = t - T.hold - i * .15, oi = clamp(u / .25, 0, 1) * lo;
        if (oi <= 0) return;
        const ping = seg(u, 0, .6);
        if (ping < 1) cg.appendChild(el("circle", { cx: p[0], cy: p[1], r: 7 + ping * 16, fill: "none", stroke: ACCENT, "stroke-width": 1.4, opacity: (1 - ping) * .8 }));
        const lock = seg(t, C.fit - .05 + i * .03, C.fit + .45 + i * .03);
        if (lock > 0 && lock < 1) cg.appendChild(el("circle", { cx: p[0], cy: p[1], r: 7 + eOut(lock) * 7, fill: MINT, opacity: (1 - lock) * .45 }));
        cg.appendChild(el("circle", { cx: p[0], cy: p[1], r: 7, fill: "none", stroke: lock > 0 ? MINT : ACCENT, "stroke-width": 1.4, opacity: oi * .9 }));
        cg.appendChild(el("circle", { cx: p[0], cy: p[1], r: 1.8, fill: lock > 0 ? MINT : ACCENT, opacity: oi }));
      });
      /* while it fits: rules across the lane every 15 ft, and the model's own landmarks, each
         tied to the one found in the footage, so you watch the gaps close */
      const fo = geoOn * (1 - seg(t, C.fit, C.fit + .4));
      if (fo > .01) {
        [15, 30, 45].forEach(f => { const a = V(proj(Hk, [0, f])), b = V(proj(Hk, [39, f])); cg.appendChild(el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: WHITE, "stroke-width": 1, "stroke-dasharray": "3 4", opacity: fo * .35 })); });
        MARKS.forEach(it => {
          const m = V(proj(Hk, it.l)), p = V(it.v);
          cg.appendChild(el("line", { x1: m[0], y1: m[1], x2: p[0], y2: p[1], stroke: WHITE, "stroke-width": 1, "stroke-dasharray": "2 3", opacity: fo * .5 }));
          cg.appendChild(el("rect", { x: m[0] - 3, y: m[1] - 3, width: 6, height: 6, fill: "none", stroke: WHITE, "stroke-width": 1.3, opacity: fo * .9, transform: `rotate(45 ${m[0]} ${m[1]})` }));
        });
      }
      /* the sweep: once the fit holds, a line runs from the foul line to the pins */
      if (sweepF > -2 && sweepF < 72) {
        const f = clamp(sweepF, 0, 63), a = V(proj(H1, [-1, f])), b = V(proj(H1, [40, f]));
        cg.appendChild(el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: MINT, "stroke-width": 2, "stroke-linecap": "round", opacity: Math.sin(Math.PI * (sweepF + 2) / 74) }));
      }
      /* outline: both gutters, foul line, pin line, in the app's system accent */
      const out = outline.map(it => lerp(at(it.l, it.v), Lc(it.l[0], it.l[1]), move));
      cg.appendChild(el("path", { d: `M${out[0]} L${out[1]} L${out[2]} L${out[3]}Z`, fill: "none", stroke: ACCENT, "stroke-width": 2, opacity: geoOn * vo }));
      /* seams: white 22% on video, 5% in the plan */
      seams.forEach((s, i) => { const a = lerp(at([s.b, 0], s.v0), Lc(s.b, 0), move), b = lerp(at([s.b, 60], s.v1), Lc(s.b, 60), move); const oi = clamp((geoOn - i * .04) / .7, 0, 1); cg.appendChild(el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: WHITE, "stroke-width": 1, opacity: oi * (.22 * (1 - move) + .05 * move) })); });
      /* arrows: stroked triangles on video, filled in the plan, positions from each model */
      arrows.forEach((a, i) => {
        const p = lerp(V(a.v), Lc(a.plan[0], a.plan[1]), move), oi = clamp((sweepF - GEO.video.arrows[i].l[1]) / 6, 0, 1);
        const sz = 5 + move * 1.5;
        const d = `M${p[0]} ${p[1] - sz} L${p[0] + sz * .8} ${p[1] + sz * .6} L${p[0] - sz * .8} ${p[1] + sz * .6}Z`;
        if (vo > .02) cg.appendChild(el("path", { d, fill: "none", stroke: ACCENT, "stroke-width": 1.5, opacity: oi * vo }));
        if (move > .02) cg.appendChild(el("path", { d, fill: MINTDIM, opacity: oi * move * .85 }));
      });
      /* pins: white rings on video, filled dots in the plan, pocket pair in mint with glow */
      pins.forEach((pn, i) => {
        const p = lerp(V(pn.v), Lc(pn.plan[0], pn.plan[1]), move), oi = clamp((sweepF - GEO.video.pins[i].l[1]) / 6, 0, 1);
        const r = Math.max(3, pn.rv * VID.w) * (1 - move) + pinRplan * move;
        if (vo > .02) cg.appendChild(el("circle", { cx: p[0], cy: p[1], r, fill: "none", stroke: WHITE, "stroke-width": 1.5, opacity: oi * vo }));
        if (move > .02) {
          if (pn.pocket) {
            const rg = el("radialGradient", { id: "rg" + (++uid) }); rg.appendChild(el("stop", { offset: 0, "stop-color": MINT, "stop-opacity": .28 })); rg.appendChild(el("stop", { offset: 1, "stop-color": MINT, "stop-opacity": 0 })); defs.appendChild(rg);
            cg.appendChild(el("circle", { cx: p[0], cy: p[1], r: r * 2.8, fill: `url(#${rg.id})`, opacity: oi * move }));
            cg.appendChild(el("circle", { cx: p[0], cy: p[1], r, fill: MINT, opacity: oi * move * .92 }));
          } else cg.appendChild(el("circle", { cx: p[0], cy: p[1], r, fill: WHITE, opacity: oi * move * .55 }));
        }
      });
    }

    /* ---- the ball path, travelling ---- */
    const shown = P.filter(p => p.t <= clipT + 1e-6);
    const tracking = clipT >= T_START;
    if (shown.length > 1) {
      const pts = shown.map(p => lerp(V([p.x, p.y]), Lc(p.b, p.f), move)), d = smooth(pts);
      const gw = Math.min(6, laneW * .12) * move + 7 * (1 - move);
      cg.appendChild(el("path", { d, fill: "none", stroke: MINT, "stroke-width": gw, opacity: .16, "stroke-linecap": "round", "stroke-linejoin": "round" }));
      cg.appendChild(el("path", { d, fill: "none", stroke: MINT, "stroke-width": 2.4, "stroke-linecap": "round", "stroke-linejoin": "round" }));
      if (t < T.mv && tracking) { const p = ptAt(clipT), c = V([p.x, p.y]), r = Math.max(9, p.r * VID.w * .95); cg.appendChild(el("circle", { cx: c[0], cy: c[1], r, fill: "none", stroke: MINT, "stroke-width": 1.6, opacity: .9 })); cg.appendChild(el("circle", { cx: c[0], cy: c[1], r: 2.2, fill: MINT })); }
      if (move > .5) { const bp = Lc(M["Breakpoint"].v, M["Breakpoint Distance"].v); cg.appendChild(el("circle", { cx: bp[0], cy: bp[1], r: 3.4, fill: MINT, stroke: WHITE, "stroke-width": 1.2, opacity: (move - .5) * 2 })); }
    }

    /* ---- the replay trail on the returning video ---- */
    if (back > .01) {
      const d = smooth(P.map(p => V([p.x, p.y]))), gg = el("g", { opacity: back });
      gg.appendChild(el("path", { d, fill: "none", stroke: MINT, "stroke-width": 7, opacity: .16, "stroke-linecap": "round" }));
      gg.appendChild(el("path", { d, fill: "none", stroke: MINT, "stroke-width": 2.2, "stroke-linecap": "round" }));
      g.appendChild(gg);
    }

    /* ---- the numbers live under the frame as HTML ---- */
    if (metrics > 0) numsShow(metrics);
    ov.replaceChildren(g);

    /* ---- chrome, kept to one caption ---- */
    let st = 0; STAGE_AT.forEach((a, i) => { if (t >= a) st = i; });
    [...steps.children].forEach((c, i) => c.classList.toggle("cur", i === st));
    if (t < T.hold) {
      const fr = 1 + Math.round(clipT * 30);
      if (!tracking) { capL.textContent = "Run-up"; capR.innerHTML = `<b>Frame ${fr}</b> of 131`; }
      else { const p = ptAt(clipT); capL.textContent = `Board ${p.b.toFixed(1)} at ${p.f.toFixed(1)} ft`; capR.innerHTML = p.m ? `<b>${(p.c ?? 0).toFixed(2)}</b> confidence \u00b7 frame ${fr}` : `<b>coasted</b> \u00b7 frame ${fr}`; }
    }
    else if (t < C.found) { capL.textContent = `Finding landmarks \u00b7 ${found(t)} of 6`; capR.innerHTML = "<b>Reference points</b> on the lane"; }
    else if (t < C.fit) { capL.textContent = "Fitting the lane to them"; capR.innerHTML = "<b>Homography</b>, pixels to boards"; }
    else if (t < T.mv) { capL.textContent = "Reference fit, six landmarks \u00b7 1.8 px rms"; capR.innerHTML = "<b>Homography</b>, pixels to boards"; }
    else if (t < T.met) { capL.textContent = "Lane and path leaving the footage"; capR.innerHTML = "<b>Lane view</b>, width shown 3.5 times"; }
    else { capL.textContent = "Six of the nine metrics"; capR.innerHTML = "<b>16.3</b> entry, right of the pocket"; }
    /* the same moment in a few words, for whoever is listening (the bar's chip) */
    if (els.onLive) {
      const p = tracking && t < T.hold ? ptAt(clipT) : null;
      const said = t < T.hold ? (p ? `Board ${p.b.toFixed(1)} \u00b7 ${p.f.toFixed(1)} ft` : "Run-up")
        : t < C.found ? `Landmarks ${found(t)} of 6` : t < C.fit ? "Fitting the lane" : t < T.mv ? "Fit \u00b7 1.8 px rms" : t < T.met ? "Lane view" : "Entry board 16.3";
      if (said !== lastSaid) { lastSaid = said; els.onLive(said); }
    }
    vid.style.opacity = String(clamp(1 - fade * .96 + back * .88, 0, 1));
  }

  /* ---------- the clock ----------
     Two separate reasons to stop: the Pause button, and the sequence not being on screen.
     They are tracked apart so that scrolling away from a sequence you had paused by hand
     does not quietly resume it when you scroll back. The clock only ever advances while
     you are actually looking at it, which is the whole point: this runs about fifteen
     seconds, and it used to spend most of them playing to nobody. */
  let t0 = 0, raf = null, tNow = 0;
  let byHand = false, offscreen = false, started = false, done = false;
  const halted = () => byHand || offscreen;

  function frame(now) {
    tNow = (now - t0) / 1000;
    if (tNow < T.play) { try { vid.currentTime = 0; } catch (e) {} }
    else if (tNow < T.hold) { if (vid.paused) vid.play().catch(() => {}); }
    else if (!vid.paused) vid.pause();
    draw(Math.min(tNow, T.end));
    if (tNow < T.end) { raf = requestAnimationFrame(frame); return; }
    raf = null; done = true;
  }
  /** Picks the clock back up from wherever it was left. */
  function resume() {
    if (raf || done || !started || halted() || reduce) return;
    t0 = performance.now() - tNow * 1000;
    raf = requestAnimationFrame(frame);
  }
  /** Stops the clock dead, holding the current frame on screen. */
  function halt() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    try { vid.pause(); } catch (e) {}
  }
  /** Start from the top. The Replay button, and the first time you arrive at it. */
  function run() {
    halt();
    try { vid.currentTime = 0; } catch (e) {}
    numsReset();
    started = true; done = false; byHand = false; tNow = 0;
    if (reduce) { draw(T.end); numsShow(1); done = true; return; }
    resume();
  }
  /** The Pause button. Returns the new paused state so the label can follow it. */
  function toggle() {
    byHand = !byHand;
    if (byHand) halt(); else resume();
    return byHand;
  }
  /* Scrolling away is not the same as pausing: it holds the frame, and coming back
     carries on. A sequence that already reached its end stays at its end. */
  function setOffscreen(v) {
    if (offscreen === v) return;
    offscreen = v;
    if (v) halt(); else resume();
  }

  draw(0);
  return { run, toggle, setOffscreen, isDone: () => done, stop: halt };

}
