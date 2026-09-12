/**
 * The Clarity sequence: one capture, hotkey to video, drawn live.
 *
 * Nothing here is footage. The desktop, the editor, the two floating windows and the edge
 * glow are rebuilt from the app's own CSS (desktop/clarity/ui/*), at the app's own sizes
 * and timings: the spotlight box is 680x96 and arrives in 180 ms at scale .96, the result
 * box is 440x680 and fades in over 150 ms, the glow is a conic ring that sweeps once every
 * 8 s. The one thing that is not to scale is the clock — the real pipeline takes seconds
 * for the explanation and a minute or more for the video, and the caption says so.
 *
 * Same contract as the TrueLine engine, so the same viewport hook drives both: `run`,
 * `toggle`, `setOffscreen`, `isDone`, `stop`.
 */

type Els = { stage: HTMLElement; steps: HTMLElement; capL: HTMLElement; capR: HTMLElement };

const CODE = [
  ["def ", "binary_search", "(arr, target):"],
  ["    lo, hi = 0, len(arr)"],
  ["    while lo < hi:"],
  ["        mid = (lo + hi) // 2"],
  ["        if arr[mid] == target:"],
  ["            return mid"],
  ["        if arr[mid] < target:"],
  ["            lo = mid"],
  ["        else:"],
  ["            hi = mid"],
  ["    return -1"],
];

const QUESTION = "why is my binary search not working? visualize where it's messing up";

/* The explanation the result box fills with. Illustrative: it is a correct account of this
   bug, written for the page, not a logged model output. */
const STEPS_TEXT = [
  ["Step 1 — What the loop is supposed to do.", " Each pass should shrink the window ", "[lo, hi)", " strictly. As long as the window gets smaller every time, the loop has to end."],
  ["Step 2 — Where it stops shrinking.", " ", "mid = (lo + hi) // 2", " rounds down. When ", "hi - lo == 1", ", that makes ", "mid == lo", ". The branch ", "lo = mid", " then assigns ", "lo", " to itself and the window never changes."],
  ["Step 3 — The fix.", " Move past the midpoint you already checked: ", "lo = mid + 1", "."],
  ["Step 4 — Why the hi side is already fine.", " ", "hi = mid", " is correct with a half-open window, because ", "arr[mid]", " has been ruled out and ", "hi", " is exclusive."],
];

/* the status words the real result box shows for each job status (result.js) */
const STATUS: Record<string, string> = {
  queued: "Reading the problem…", transcribing: "Reading the problem…", explaining: "Writing explanation…",
  generating: "Planning the animation…", rendering: "Rendering the animation…", uploading: "Almost there…", done: "Done",
};

const ARR = [1, 3, 4, 7, 9, 12, 15, 20];
const TARGET = 19;
/* the walk the animation shows, with target 19 absent from the array: lo = mid stalls at 6 */
const WALK = [
  { lo: 0, hi: 8, mid: 4, say: "mid = (0 + 8) // 2 = 4    arr[4] = 9 < 19   →  lo = mid" },
  { lo: 4, hi: 8, mid: 6, say: "mid = (4 + 8) // 2 = 6    arr[6] = 15 < 19  →  lo = mid" },
  { lo: 6, hi: 8, mid: 7, say: "mid = (6 + 8) // 2 = 7    arr[7] = 20 > 19  →  hi = mid" },
  { lo: 6, hi: 7, mid: 6, say: "mid = (6 + 7) // 2 = 6    arr[6] = 15 < 19  →  lo = mid" },
  { lo: 6, hi: 7, mid: 6, say: "lo = mid leaves lo at 6. The window never shrinks.", stuck: true },
];

export function createClarity(els: Els) {
  const { stage, steps, capL, capR } = els;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
  const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a), 0, 1);
  const eOut = (t: number) => 1 - Math.pow(1 - t, 3);
  const eInOut = (t: number) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* ---------- the scene, built once ---------- */
  stage.innerHTML = `
    <div class="cl-desk">
      <div class="cl-menubar"><i class="cl-mb-icon"></i><span></span></div>
      <div class="cl-editor">
        <div class="cl-ed-bar"><i></i><i></i><i></i><span>binary_search.py</span></div>
        <pre class="cl-code">${CODE.map((l, i) => `<span class="ln">${i + 1}</span>${l.map((p, j) => l.length > 1 && j === 1 ? `<em>${esc(p)}</em>` : esc(p)).join("")}`).join("\n")}</pre>
      </div>
      <div class="cl-dim"></div>
      <div class="cl-glow"></div>
      <div class="cl-sel"></div>
      <div class="cl-cross"><i></i><i></i></div>
      <div class="cl-keys"><kbd>⌘</kbd><kbd>⇧</kbd><kbd>E</kbd></div>
      <div class="cl-spot">
        <div class="cl-thumb"><i></i><i></i><i></i><i></i></div>
        <div class="cl-field"><span class="cl-line"><span class="cl-typed"></span><i class="cl-caret"></i></span><span class="cl-ph">What's the question?</span></div>
        <div class="cl-mode"><b>Tutor</b><b class="on">Answer</b></div>
        <div class="cl-hint"><kbd>↓</kbd><kbd class="enter">↵</kbd></div>
      </div>
      <div class="cl-result">
        <div class="cl-rhead"><span>Clarity</span><b>–</b><b>✕</b></div>
        <div class="cl-rbody">
          <div class="cl-status"><i class="cl-dial"></i><span>Reading the problem…</span></div>
          <div class="cl-expl">${STEPS_TEXT.map(p => `<p>${p.map((s, j) => j === 0 ? `<b>${esc(s)}</b>` : j % 2 === 0 ? `<code>${esc(s)}</code>` : esc(s)).join("")}</p>`).join("")}</div>
          <div class="cl-video">
            <svg viewBox="0 0 440 248" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg>
            <div class="cl-vbar"><i class="cl-play"></i><span class="cl-time">00:00</span><i class="cl-track"><i></i></i><span class="cl-len">00:12</span></div>
          </div>
        </div>
      </div>
    </div>`;

  const q = <T extends HTMLElement>(s: string) => stage.querySelector(s) as T;
  const desk = q(".cl-desk"), mbIcon = q(".cl-mb-icon"), dim = q(".cl-dim"), glow = q(".cl-glow"), sel = q(".cl-sel"), cross = q(".cl-cross");
  const keys = Array.from(stage.querySelectorAll<HTMLElement>(".cl-keys kbd"));
  const spot = q(".cl-spot"), field = q(".cl-field"), line = q(".cl-line"), typed = q(".cl-typed"), ph = q(".cl-ph"), enter = q(".cl-hint .enter");
  const result = q(".cl-result"), rbody = q(".cl-rbody"), status = q(".cl-status span"), dial = q(".cl-dial"), expl = q(".cl-expl");
  const paras = Array.from(expl.querySelectorAll<HTMLElement>("p"));
  const video = q(".cl-video"), svg = video.querySelector("svg") as SVGSVGElement, vtime = q(".cl-time"), vtrack = q(".cl-track > i");

  /* the selection, in stage percentages: from the top left of the function to past its end */
  const SEL0 = { x: 8.5, y: 15.5 }, SEL1 = { x: 60, y: 47 };

  /* ---------- the clock's landmarks, in seconds ---------- */
  const T = {
    keys: .8,        // the three keycaps go down
    glow: 1.25,      // the screen dims and the edge lights
    drag0: 1.7, drag1: 2.9,
    shot: 3.0,       // the capture
    spot: 3.25,      // the spotlight box arrives
    type0: 3.75, type1: 6.45,
    enter: 6.7,      // ↵
    result: 7.0,     // the result box opens; queued → transcribing
    explaining: 8.1,
    expl: 9.0,       // the explanation lands
    generating: 9.6,
    rendering: 10.4,
    uploading: 12.6,
    done: 13.1,      // the video plays
    end: 18.6,
  };
  const STAGE_AT = [0, T.spot, T.result, T.generating];
  const jobStatus = (t: number) =>
    t < T.result ? "" : t < T.result + .5 ? "queued" : t < T.explaining ? "transcribing" : t < T.generating ? "explaining"
      : t < T.rendering ? "generating" : t < T.uploading ? "rendering" : t < T.done ? "uploading" : "done";

  /* ---------- the "video": an array walk, drawn each frame ---------- */
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag: string, a: Record<string, string | number>) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) n.setAttribute(k, String(v)); return n; };
  const txt = (g: Node, x: number, y: number, s: string, a: Record<string, string | number> = {}) => { const n = el("text", { x, y, "font-family": "Geist Mono, ui-monospace, monospace", "font-size": 10.5, fill: "#a2b3bd", "text-anchor": "start", ...a }); n.textContent = s; g.appendChild(n); return n; };
  const BOX = 40, GAP = 8, X0 = (440 - (ARR.length * BOX + (ARR.length - 1) * GAP)) / 2, Y0 = 108;
  const bx = (i: number) => X0 + i * (BOX + GAP);
  const BEAT = 1.0;

  function drawVideo(v: number) {
    /* v: seconds into the clip */
    const g = document.createDocumentFragment();
    const k = Math.min(WALK.length - 1, Math.floor(v / BEAT)), kf = clamp((v - k * BEAT) / BEAT, 0, 1);
    const cur = WALK[k], prev = WALK[Math.max(0, k - 1)];
    const appear = eOut(seg(v, 0, .6));
    txt(g, 220, 26, `binary_search(arr, target=${TARGET})`, { "text-anchor": "middle", fill: "#c9d6dd", opacity: appear });
    /* the boxes */
    ARR.forEach((n, i) => {
      const o = clamp((v - i * .05) / .4, 0, 1);
      const isMid = i === cur.mid && v > BEAT * .15;
      const inWin = i >= cur.lo && i < cur.hi;
      g.appendChild(el("rect", { x: bx(i), y: Y0, width: BOX, height: BOX, rx: 3, fill: isMid ? "var(--accent)" : "none", "fill-opacity": isMid ? .85 : 0, stroke: inWin ? "#dfe8ec" : "#4a555e", "stroke-width": 1.1, opacity: o }));
      txt(g, bx(i) + BOX / 2, Y0 + BOX / 2 + 4, String(n), { "text-anchor": "middle", fill: isMid ? "#0b1b18" : inWin ? "#eaf0f4" : "#6c7883", "font-size": 12, opacity: o });
    });
    if (v > .5) {
      /* lo and hi pointers slide between beats; hi is exclusive so it sits past its box */
      const ease = eInOut(clamp(kf / .45, 0, 1));
      const lo = prev.lo + (cur.lo - prev.lo) * ease, hi = prev.hi + (cur.hi - prev.hi) * ease;
      const px = (i: number) => X0 + i * (BOX + GAP) + BOX / 2;
      const hx = (i: number) => X0 + i * (BOX + GAP) - GAP / 2;
      txt(g, px(lo), Y0 + BOX + 20, "lo", { "text-anchor": "middle", fill: "var(--accent)" });
      g.appendChild(el("line", { x1: px(lo), y1: Y0 + BOX + 3, x2: px(lo), y2: Y0 + BOX + 9, stroke: "var(--accent)", "stroke-width": 1.2 }));
      txt(g, hx(hi), Y0 + BOX + 20, "hi", { "text-anchor": "middle", fill: "var(--accent)" });
      g.appendChild(el("line", { x1: hx(hi), y1: Y0 + BOX + 3, x2: hx(hi), y2: Y0 + BOX + 9, stroke: "var(--accent)", "stroke-width": 1.2 }));
      if (v > BEAT * .15) txt(g, px(cur.mid), Y0 - 10, "mid", { "text-anchor": "middle", fill: "var(--accent)" });
      /* the stall: the one-wide window pulses, and the fix is offered */
      if (cur.stuck) {
        const pulse = .5 + .5 * Math.sin(v * 5);
        g.appendChild(el("rect", { x: bx(cur.lo) - 4, y: Y0 - 4, width: BOX + 8, height: BOX + 8, rx: 5, fill: "none", stroke: "#ff8a8a", "stroke-width": 1.2, opacity: .35 + .45 * pulse }));
        txt(g, 220, 226, "lo = mid + 1   # the fix", { "text-anchor": "middle", fill: "var(--accent)", opacity: seg(v, k * BEAT + .6, k * BEAT + 1.2) });
      }
      const sayO = clamp(kf / .25, 0, 1);
      txt(g, 220, cur.stuck ? 204 : 212, cur.say, { "text-anchor": "middle", fill: cur.stuck ? "#ff8a8a" : "#c9d6dd", opacity: sayO });
    }
    svg.replaceChildren(g);
  }

  /* ---------- one frame ---------- */
  let lastStatus = "";
  function draw(t: number) {
    /* the keycaps */
    keys.forEach((k, i) => k.classList.toggle("down", t >= T.keys + i * .14 && t < T.glow + .3));
    stage.classList.toggle("keys-on", t >= T.keys - .3 && t < T.glow + .5);
    /* dim and glow: up while a window is open, out at Enter, like the real overlay */
    const working = t >= T.glow && t < T.enter + .05;
    dim.classList.toggle("show", working); glow.classList.toggle("show", working);
    mbIcon.classList.toggle("working", t >= T.glow && t < T.done);
    /* the drag */
    const d = eInOut(seg(t, T.drag0, T.drag1));
    const dragging = t >= T.drag0 - .25 && t < T.shot + .35;
    sel.classList.toggle("show", t >= T.drag0 && t < T.shot + .35);
    sel.classList.toggle("shot", t >= T.shot && t < T.shot + .35);
    cross.classList.toggle("show", dragging);
    const cx = SEL0.x + (SEL1.x - SEL0.x) * d, cy = SEL0.y + (SEL1.y - SEL0.y) * d;
    cross.style.left = `${cx}%`; cross.style.top = `${cy}%`;
    sel.style.left = `${SEL0.x}%`; sel.style.top = `${SEL0.y}%`;
    sel.style.width = `${Math.max(0, cx - SEL0.x)}%`; sel.style.height = `${Math.max(0, cy - SEL0.y)}%`;
    /* the spotlight box */
    spot.classList.toggle("show", t >= T.spot && t < T.enter);
    spot.classList.toggle("leaving", t >= T.enter && t < T.enter + .2);
    const n = Math.round(QUESTION.length * seg(t, T.type0, T.type1));
    const s = QUESTION.slice(0, n);
    if (typed.textContent !== s) {
      typed.textContent = s;
      /* the real field scrolls so the end of what you typed stays in view */
      const over = line.scrollWidth - field.clientWidth;
      line.style.transform = over > 0 ? `translateX(${-over}px)` : "";
    }
    ph.style.opacity = n > 0 ? "0" : "1";
    enter.classList.toggle("down", t >= T.enter - .12 && t < T.enter + .1);
    /* the result box */
    result.classList.toggle("show", t >= T.result);
    const js = jobStatus(t);
    if (js !== lastStatus) {
      lastStatus = js;
      if (js) status.textContent = STATUS[js];
      dial.hidden = js === "done";
      status.classList.toggle("done", js === "done");
      /* the video lands under the explanation, so the box scrolls down to it, the way you
         would in the real window; going back to the top is the replay's job */
      if (js === "done") requestAnimationFrame(() => rbody.scrollTo({ top: rbody.scrollHeight, behavior: reduce ? "auto" : "smooth" }));
      if (!js) rbody.scrollTop = 0;
    }
    paras.forEach((p, i) => p.classList.toggle("show", t >= T.expl + i * .16));
    video.classList.toggle("show", t >= T.done);
    if (t >= T.done) {
      const v = Math.min(t - T.done, 12);
      drawVideo(v);
      vtime.textContent = `00:${String(Math.floor(v)).padStart(2, "0")}`;
      vtrack.style.width = `${(v / 12) * 100}%`;
    }
    /* the desk itself eases back a touch while the result box is up, so the box reads as
       floating over it rather than pasted on */
    desk.classList.toggle("busy", t >= T.result);

    /* ---------- chrome ---------- */
    let st = 0; STAGE_AT.forEach((a, i) => { if (t >= a) st = i; });
    Array.from(steps.children).forEach((c, i) => c.classList.toggle("cur", i === st));
    let L = "", R = "";
    if (t < T.keys) { L = "A binary search that returns the wrong index, open in an editor"; R = "<b>⌘⇧E</b> works in any app"; }
    else if (t < T.spot) { L = "Drag a box around the problem"; R = "<b>screencapture -i</b> · the screen dims, the edge glows"; }
    else if (t < T.enter) { L = "Type what's confusing you, or just press Enter"; R = "<b>680 × 96</b> spotlight box · Tutor or Answer"; }
    else if (t < T.result) { L = "POST /api/jobs: the region you chose, and the question"; R = "<b>202</b> · job j_7f3a9c21"; }
    else if (t < T.explaining) { L = "Gemini reads the problem off the pixels, verbatim"; R = `<b>${js}</b> · polled once a second`; }
    else if (t < T.generating) { L = "The written explanation lands first, in seconds"; R = `<b>${js}</b> · target under 10 s`; }
    else if (t < T.done) { L = "Claude writes Manim for this problem; a sandbox renders it"; R = `<b>${js}</b> · 60 to 90 s, compressed here`; }
    else { L = "The animation plays in the same window"; R = "<b>done</b> · 440 × 680 result box"; }
    if (capL.textContent !== L) capL.textContent = L;
    if (capR.innerHTML !== R) capR.innerHTML = R;
  }

  /* ---------- the clock, identical in shape to TrueLine's ---------- */
  let t0 = 0, raf: number | null = null, tNow = 0;
  let byHand = false, offscreen = false, started = false, done = false;
  const halted = () => byHand || offscreen;

  function frame(now: number) {
    tNow = (now - t0) / 1000;
    draw(Math.min(tNow, T.end));
    if (tNow < T.end) { raf = requestAnimationFrame(frame); return; }
    raf = null; done = true;
  }
  function resume() {
    if (raf || done || !started || halted() || reduce) return;
    t0 = performance.now() - tNow * 1000;
    raf = requestAnimationFrame(frame);
  }
  function halt() { if (raf) cancelAnimationFrame(raf); raf = null; }
  function run() {
    halt();
    lastStatus = ""; started = true; done = false; byHand = false; tNow = 0; rbody.scrollTop = 0;
    if (reduce) { draw(T.end); done = true; return; }
    resume();
  }
  function toggle() { byHand = !byHand; if (byHand) halt(); else resume(); return byHand; }
  function setOffscreen(v: boolean) { if (offscreen === v) return; offscreen = v; if (v) halt(); else resume(); }

  draw(0);
  return { run, toggle, setOffscreen, isDone: () => done, stop: halt };
}
