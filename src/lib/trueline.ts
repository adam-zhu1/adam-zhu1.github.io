/* eslint-disable */
/**
 * The TrueLine sequence. Ported from the prototype and driven entirely by the real
 * analysis: track.json (70 tracked frames of Adam's throw) and the app's own lane
 * geometry, so the overlay on the video and the plan view each match what TrueLine
 * itself draws on that surface.
 */
import TRACK from "../data/trueline-track.json";
import GEO from "../data/trueline-lane.json";

type Els = { vid: HTMLVideoElement; ov: SVGSVGElement; steps: HTMLElement; capL: HTMLElement; capR: HTMLElement; nums: HTMLElement };

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

  const P = TRACK.pts, T_START = TRACK.t_start, CLIP_END = 3.75, M = Object.fromEntries(TRACK.metrics.map(m => [m.n, m]));
  const { vid, ov, steps, capL, capR, nums } = els;
  const NUMS = ["Speed", "Board at Arrows", "Entry Board", "Entry Angle", "Breakpoint", "Hook"];
  const M0 = n => TRACK.metrics.find(m => m.n === n);
  nums.replaceChildren(...NUMS.map(n => { const d = document.createElement("div"); d.className = "num"; const m = M0(n); d.innerHTML = `<small>${m.n}</small><b class="${n === "Entry Angle" ? "mint" : ""}">0.0</b><i>${m.u}</i>`; return d; }));
  function numsShow(k) { [...nums.children].forEach((d, i) => { const o = clamp(k * 6 - i * .9, 0, 1); if (o <= 0) return; d.classList.add("on"); d.querySelector("b").textContent = (M0(NUMS[i]).v * eOut(o)).toFixed(1); }); }
  function numsReset() { [...nums.children].forEach(d => { d.classList.remove("on"); d.querySelector("b").textContent = "0.0"; }); }
  const T = { play: .6, hold: .6 + CLIP_END, cal: .6 + CLIP_END + 1.9, mv: .6 + CLIP_END + 3.6, plan: .6 + CLIP_END + 5.4, met: .6 + CLIP_END + 6.2, end: .6 + CLIP_END + 10.5 };
  const STAGE_AT = [0, T.hold, T.cal + .1, T.met];

  const smooth = (pts: number[][]) => { let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)]; d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`; } return d; };
  function ptAt(t: number): any { if (t <= P[0].t) return P[0]; for (let i = 1; i < P.length; i++) if (P[i].t >= t) { const a = P[i - 1], b = P[i], k = (t - a.t) / (b.t - a.t || 1); return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, r: a.r + (b.r - a.r) * k, b: a.b + (b.b - a.b) * k, f: a.f + (b.f - a.f) * k, m: b.m, c: b.c }; } return P[P.length - 1]; }
  function text(g: any, x: number, y: number, s: string, o: any = {}) { const n = el("text", { x, y, fill: o.fill || WHITE, "font-size": o.size || 12, "font-family": SANS, "font-weight": o.weight || 400, "text-anchor": o.anchor || "start", opacity: o.op ?? 1 }); n.textContent = s; g.appendChild(n); return n; }
  let uid = 0;

  function draw(t) {
    const g = document.createDocumentFragment();
    const defs = el("defs"); g.appendChild(defs);
    const clipT = t < T.hold ? clamp(t - T.play, 0, CLIP_END) : CLIP_END;
    const cal = eOut(seg(t, T.hold, T.cal));
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
    if (cal > .01) {
      const o = cal, vo = 1 - move;                                   // video-only strokes fade as the plan takes over
      /* outline: both gutters, foul line, pin line, in the app's system accent */
      const out = outline.map(it => lerp(V(it.v), Lc(it.l[0], it.l[1]), move));
      cg.appendChild(el("path", { d: `M${out[0]} L${out[1]} L${out[2]} L${out[3]}Z`, fill: "none", stroke: ACCENT, "stroke-width": 2, opacity: o * vo }));
      /* seams: white 22% on video, 5% in the plan */
      seams.forEach((s, i) => { const a = lerp(V(s.v0), Lc(s.b, 0), move), b = lerp(V(s.v1), Lc(s.b, 60), move); const oi = clamp((cal - .1 - i * .04) / .3, 0, 1); cg.appendChild(el("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: WHITE, "stroke-width": 1, opacity: oi * (.22 * (1 - move) + .05 * move) })); });
      /* arrows: stroked triangles on video, filled in the plan, positions from each model */
      arrows.forEach((a, i) => {
        const p = lerp(V(a.v), Lc(a.plan[0], a.plan[1]), move), oi = clamp((cal - .3 - i * .03) / .3, 0, 1);
        const sz = 5 + move * 1.5;
        const d = `M${p[0]} ${p[1] - sz} L${p[0] + sz * .8} ${p[1] + sz * .6} L${p[0] - sz * .8} ${p[1] + sz * .6}Z`;
        if (vo > .02) cg.appendChild(el("path", { d, fill: "none", stroke: ACCENT, "stroke-width": 1.5, opacity: oi * vo }));
        if (move > .02) cg.appendChild(el("path", { d, fill: MINTDIM, opacity: oi * move * .85 }));
      });
      /* pins: white rings on video, filled dots in the plan, pocket pair in mint with glow */
      pins.forEach((pn, i) => {
        const p = lerp(V(pn.v), Lc(pn.plan[0], pn.plan[1]), move), oi = clamp((cal - .42 - i * .02) / .3, 0, 1);
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
      /* the six landmarks, while the fit is being shown */
      const lo = seg(t, T.hold, T.hold + .5) * (1 - seg(t, T.cal + .4, T.mv));
      if (lo > .01) GEO.video.marks.forEach((it, i) => { const p = V(it.v), oi = clamp((t - T.hold - i * .16) / .3, 0, 1) * lo; cg.appendChild(el("circle", { cx: p[0], cy: p[1], r: 7, fill: "none", stroke: ACCENT, "stroke-width": 1.4, opacity: oi * .9 })); cg.appendChild(el("circle", { cx: p[0], cy: p[1], r: 1.8, fill: ACCENT, opacity: oi })); });
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
    else if (t < T.mv) { capL.textContent = "Reference fit, six landmarks \u00b7 1.8 px rms"; capR.innerHTML = "<b>Homography</b>, pixels to boards"; }
    else if (t < T.met) { capL.textContent = "Lane and path leaving the footage"; capR.innerHTML = "<b>Lane view</b>, width shown 3.5 times"; }
    else { capL.textContent = "Six of the nine metrics"; capR.innerHTML = "<b>16.3</b> entry, right of the pocket"; }
    vid.style.opacity = String(clamp(1 - fade * .96 + back * .88, 0, 1));
  }

  let t0 = 0, raf = null, paused = false, tNow = 0;
  function frame(now) {
    if (paused) { raf = requestAnimationFrame(frame); return; }
    tNow = (now - t0) / 1000;
    if (tNow < T.play) { try { vid.currentTime = 0; } catch (e) {} }
    else if (tNow < T.hold) { if (vid.paused) vid.play().catch(() => {}); }
    else if (!vid.paused) vid.pause();
    draw(Math.min(tNow, T.end));
    raf = tNow < T.end ? requestAnimationFrame(frame) : null;
  }
  function run() {
    if (raf) cancelAnimationFrame(raf);
    try { vid.pause(); vid.currentTime = 0; } catch (e) {}
    numsReset();
    if (reduce) { draw(T.end); numsShow(1); return; }
    paused = false;
    t0 = performance.now(); raf = requestAnimationFrame(frame);
  }
  function toggle() { paused = !paused; if (paused) vid.pause(); else { t0 = performance.now() - tNow * 1000; if (tNow >= T.play && tNow < T.hold) vid.play().catch(() => {}); } return paused; }
  draw(0);
  return { run, toggle, stop: () => { if (raf) cancelAnimationFrame(raf); try { vid.pause(); } catch (e) {} } };

}
