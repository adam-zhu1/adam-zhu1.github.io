import { useEffect, useRef } from "react";
import track from "../data/trueline-track.json";
import { WORK } from "../data/work";
import { MORE } from "../components/MoreWork";
import { out } from "../lib/router";
import { Switcher } from "./Switcher";
import { LINKS } from "./links";

/**
 * Concept: the lane. The page is one bowling lane drawn to scale, 60 feet from the foul line
 * to the pins, running down the right side. The ball is the real throw from the TrueLine
 * track file; it stays at mid-screen and follows the measured path as the page scrolls.
 * The words sit beside the lane at distances.
 */

const IN_W = 41.5, IN_L = 720, IN_DECK = 40;          // lane width, length, pin deck (inches)
const boardX = (b: number) => IN_W - (b - .5) * IN_W / 39; // board 1 on the right, as a right-hander sees it

type P = { f: number; b: number };
const metric = (n: string) => (track.metrics as { n: string; v: number }[]).find(m => m.n === n)?.v ?? 0;

/* the tracked points, distance made strictly increasing, with the foul-line board in front */
const PTS: P[] = (() => {
  const o: P[] = [{ f: 0, b: metric("Foul Line") }];
  for (const p of track.pts as { f: number; b: number }[]) if (p.f > o[o.length - 1].f) o.push({ f: p.f, b: p.b });
  return o;
})();
const END = PTS[PTS.length - 1].f;
const boardAt = (f: number) => {
  let i = 1;
  while (i < PTS.length - 1 && PTS[i].f < f) i++;
  const a = PTS[i - 1], b = PTS[i], k = Math.min(1, Math.max(0, (f - a.f) / (b.f - a.f)));
  return a.b + (b.b - a.b) * k;
};
const PATH = PTS.map((p, i) => `${i ? "L" : "M"}${boardX(p.b).toFixed(2)} ${(p.f * 12).toFixed(1)}`).join("");

const MARKS: { ft: number; note?: string }[] = [
  { ft: 0, note: `Foul line, board ${metric("Foul Line")}` },
  { ft: 5 }, { ft: 10 },
  { ft: 15, note: `Arrows, board ${metric("Board at Arrows")}` },
  { ft: 20 }, { ft: 25 }, { ft: 30 }, { ft: 35 },
  { ft: metric("Breakpoint Distance"), note: `Breakpoint, board ${metric("Breakpoint")}` },
  { ft: 45 }, { ft: 50 }, { ft: 55 },
  { ft: 60, note: `Entry, board ${metric("Entry Board")} at ${metric("Entry Angle")}°` },
];

/* pins: head pin on board 20 at 60 ft, rows 10.39 in apart, 12 in between pins */
const PINS = [0, 1, 2, 3].flatMap(r => Array.from({ length: r + 1 }, (_, i) => ({
  x: IN_W / 2 + (i - r / 2) * 12, y: IN_L + r * 10.39, n: r * (r + 1) / 2 + i + 1,
})));

const ZONES: [number, number][] = [[7, 22], [22, 36], [36, 49]];

export default function Lane() {
  const lane = useRef<HTMLDivElement>(null);
  const ball = useRef<HTMLDivElement>(null);
  const read = useRef<HTMLDivElement>(null);
  const ft = useRef<HTMLSpanElement>(null);
  const bd = useRef<HTMLSpanElement>(null);
  const clip = useRef<SVGRectElement>(null);

  useEffect(() => {
    let raf = 0;
    const draw = () => {
      raf = 0;
      const el = lane.current;
      if (!el) return;
      const W = el.offsetWidth, L = W * IN_L / IN_W;
      const top = el.getBoundingClientRect().top;               // lane start, relative to the viewport
      const f = Math.min(END, Math.max(0, (innerHeight * .5 - top) / L * 60));
      const b = boardAt(f), x = boardX(b) / IN_W * W, y = f / 60 * L;
      if (ball.current) ball.current.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
      if (read.current) read.current.style.transform = `translate3d(0,${y}px,0) translateY(-50%)`;
      if (ft.current) ft.current.textContent = f.toFixed(1);
      if (bd.current) bd.current.textContent = b.toFixed(1);
      clip.current?.setAttribute("height", String(f * 12));
      el.classList.toggle("hit", f >= END - .3);
      el.classList.toggle("rolling", f > .05);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(draw); };
    draw();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="lc">
      <style>{CSS}</style>
      <Switcher />

      <div className="lc-lanecol" aria-hidden="true">
        <div className="lc-approach" />
        <div className="lc-lane" ref={lane}>
          <svg viewBox={`0 0 ${IN_W} ${IN_L + IN_DECK}`} preserveAspectRatio="none">
            <rect x="0" y="-.6" width={IN_W} height="1.2" className="foul" />
            {/* dots at 7.5 ft */}
            {[3, 5, 8, 11, 14, 26, 29, 32, 35, 37].map(b => <circle key={b} cx={boardX(b)} cy={90} r=".38" className="mk" />)}
            {/* the seven arrows, every fifth board */}
            {[5, 10, 15, 20, 25, 30, 35].map(b => {
              const x = boardX(b), y = (16 - Math.abs(b - 20) / 5) * 12;
              return <path key={b} d={`M${x - .55} ${y - 6}L${x + .55} ${y - 6}L${x} ${y}Z`} className="mk" />;
            })}
            {/* range finders */}
            {[[10, 34], [30, 34], [15, 40], [25, 40]].map(([b, f]) =>
              <rect key={`${b}-${f}`} x={boardX(b) - .22} y={f * 12} width=".44" height="36" className="mk" />)}
            <path d={PATH} className="ghost" vectorEffect="non-scaling-stroke" />
            <clipPath id="lc-done"><rect ref={clip} x="0" y="0" width={IN_W} height="0" /></clipPath>
            <path d={PATH} className="done" vectorEffect="non-scaling-stroke" clipPath="url(#lc-done)" />
            {PINS.map(p => (
              <g key={p.n} className="pin" style={{
                "--dx": `${(p.x - boardX(metric("Entry Board"))) * .12 + (p.n % 3 - 1) * 1.2}px`,
                "--dy": `${2.5 + (p.n % 4) * 1.4}px`, "--rot": `${(p.n % 2 ? 1 : -1) * (20 + p.n * 9)}deg`,
              } as React.CSSProperties}>
                <circle cx={p.x} cy={p.y} r="2.38" />
              </g>
            ))}
          </svg>
          <div className="lc-ball" ref={ball} />
          <div className="lc-read" ref={read}>
            <div><span ref={ft}>0.0</span> ft</div>
            <div>board <span ref={bd}>20.9</span></div>
          </div>
          {MARKS.map(m => (
            <div key={m.ft} className="lc-mark" style={{ top: `${m.ft / 60 * 100 * IN_L / (IN_L + IN_DECK)}%` }}>
              <b>{m.ft} ft</b>{m.note && <span>{m.note}</span>}
            </div>
          ))}
        </div>
      </div>

      <header className="lc-hero">
        <h1>Adam Zhu</h1>
        <p className="lc-line"><b>Statistics and machine learning at Carnegie Mellon.</b> Looking for Summer 2027 internships in software, ML, data science, or quant.</p>
        <nav>{LINKS.map(l => <a key={l.label} href={l.href} {...(l.href.startsWith("mailto") ? {} : out)}>{l.label}</a>)}</nav>
        <p className="lc-note">This page is a bowling lane drawn to scale: 60 feet from the foul line to the pins. Scroll, and the ball follows a real throw measured by TrueLine, released at {metric("Speed")} mph.</p>
      </header>

      {WORK.map((w, i) => (
        <section key={w.id} className="lc-zone" style={{ "--a": ZONES[i][0], "--b": ZONES[i][1] } as React.CSSProperties}>
          <div className="lc-stick">
            <p className="lc-k">{w.kind}</p>
            <h2>{w.name}</h2>
            <p className="lc-what">{w.what}</p>
            <p className="lc-big"><b>{w.big[0]}</b><span>{w.big[1]}</span></p>
            <p className="lc-body">{w.body}</p>
            {w.links && <p className="lc-links">{w.links.map(l => <a key={l.label} href={l.href} {...(l.page ? {} : out)}>{l.label}</a>)}</p>}
          </div>
        </section>
      ))}

      <section className="lc-zone lc-more" style={{ "--a": 49.5, "--b": 59 } as React.CSSProperties}>
        <h2>More work</h2>
        <ol>
          {MORE.map(m => (
            <li key={m.name}>
              <span className="y">{m.year}</span>
              <span className="n">{m.href ? <a href={m.href} {...out}>{m.name}</a> : m.name}</span>
              <span className="r">{m.role}{m.org && <> · {m.org}</>}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="lc-end">
        <h2>Contact</h2>
        <a className="lc-mail" href="mailto:adamzhu@andrew.cmu.edu">adamzhu@andrew.cmu.edu</a>
        <nav>{LINKS.slice(1).map(l => <a key={l.label} href={l.href} {...out}>{l.label}</a>)}</nav>
      </div>
    </div>
  );
}

const CSS = `
html, body { background: #0b0b0c !important; }
.lc { --W: clamp(240px, 30vw, 430px); --L: calc(var(--W) * ${(IN_L / IN_W).toFixed(4)}); --G: calc(var(--W) * .2);
  --top: 74svh; --R: clamp(150px, 17vw, 280px); --M: clamp(24px, 6vw, 96px); --wood: #e3d3ad; --mk: #2a2218; --trk: #0c8a58;
  position: relative; background: #0b0b0c; color: #f3f2ee; font-family: var(--sans);
  min-height: calc(var(--top) + var(--L) + var(--W) * ${(IN_DECK / IN_W).toFixed(3)} + 46svh); overflow-x: clip; }
.lc a { color: inherit; text-decoration: none; border-bottom: 1px solid rgba(255,255,255,.28); transition: border-color .15s; }
.lc a:hover { border-color: #fff; }

/* the lane */
.lc-lanecol { position: absolute; top: 0; right: var(--R); width: var(--W); height: 100%;
  box-shadow: calc(var(--G) * -1) 0 0 #19191b, var(--G) 0 0 #19191b, calc(var(--G) * -1 - 1px) 0 0 #2b2b2f, calc(var(--G) + 1px) 0 0 #2b2b2f; }
.lc-approach, .lc-lane { background-color: var(--wood);
  background-image: repeating-linear-gradient(90deg, transparent 0 calc(var(--W) / 39 - 1px), rgba(70,48,16,.2) calc(var(--W) / 39 - 1px) calc(var(--W) / 39)),
    repeating-linear-gradient(90deg, rgba(120,84,30,.05) 0 calc(var(--W) / 39 * 3), transparent 0 calc(var(--W) / 39 * 7), rgba(255,255,255,.06) 0 calc(var(--W) / 39 * 11)); }
.lc-approach { height: var(--top); filter: brightness(.9); }
.lc-lane { position: relative; height: calc(var(--L) + var(--W) * ${(IN_DECK / IN_W).toFixed(3)}); }
.lc-lane svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.lc-lane .foul { fill: var(--mk); }
.lc-lane .mk { fill: var(--mk); opacity: .82; }
.lc-lane .ghost { fill: none; stroke: var(--mk); stroke-width: 1; stroke-dasharray: 2 6; opacity: .35; }
.lc-lane .done { fill: none; stroke: var(--trk); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.lc-lane .pin circle { fill: #fbfaf6; stroke: var(--mk); stroke-width: .28; }
.lc-lane .pin { transform-box: fill-box; transform-origin: center; transition: transform .5s cubic-bezier(.2,.7,.2,1), opacity .5s; }
.lc-lane.hit .pin:not(:nth-of-type(7)) { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(.86); opacity: .28; }
.lc-ball { position: absolute; left: 0; top: 0; width: calc(var(--W) * .205); aspect-ratio: 1; border-radius: 50%;
  background: radial-gradient(circle at 34% 30%, #4a4a52 0, #18181b 46%, #060607 100%);
  box-shadow: 0 10px 18px -6px rgba(40,24,0,.55), 0 2px 3px rgba(40,24,0,.4); will-change: transform; }
.lc-read { position: absolute; right: calc(100% + var(--G) + 18px); top: 0; text-align: right; white-space: nowrap;
  font: 400 13px/1.5 var(--mono); color: #8c8c94; opacity: 0; transition: opacity .3s; will-change: transform; }
.lc-read span { color: #f3f2ee; }
.lc-lane.rolling .lc-read { opacity: 1; }
.lc-mark { position: absolute; left: calc(100% + var(--G) + 14px); transform: translateY(-9px); width: calc(var(--R) - var(--G) - 30px);
  font: 400 12px/1.4 var(--mono); color: #5f5f67; display: flex; flex-direction: column; }
.lc-mark::before { content: ""; position: absolute; right: calc(100% + 4px); top: 9px; width: 8px; height: 1px; background: #4a4a52; }
.lc-mark b { font-weight: 400; }
.lc-mark span { color: #a9a9b0; }

/* the words, beside it */
.lc-hero, .lc-zone, .lc-end { margin-left: var(--M); width: min(640px, calc(100vw - var(--R) - var(--W) - var(--G) - var(--M) - 56px)); }
.lc-hero { height: 100svh; display: flex; flex-direction: column; justify-content: center; position: relative; z-index: 1; }
.lc h1 { font-size: clamp(56px, 8.4vw, 150px); line-height: .9; letter-spacing: -.055em; font-weight: 500; margin: 0 0 28px; white-space: nowrap; }
.lc-line { font-size: clamp(18px, 1.6vw, 23px); line-height: 1.4; color: #8c8c94; margin: 0 0 24px; max-width: 30em; }
.lc-line b { color: #f3f2ee; font-weight: 400; }
.lc nav { display: flex; gap: 22px; font-size: 16px; }
.lc-note { margin: 44px 0 0; font-size: 14px; line-height: 1.55; color: #77777f; max-width: 34em; }
.lc-zone { position: absolute; top: calc(var(--top) + var(--L) * var(--a) / 60); height: calc(var(--L) * (var(--b) - var(--a)) / 60); }
.lc-stick { position: sticky; top: 16svh; }
.lc-k { font: 400 13px/1 var(--mono); color: #8c8c94; margin: 0 0 18px; }
.lc h2 { font-size: clamp(44px, 5.6vw, 96px); line-height: .95; letter-spacing: -.045em; font-weight: 500; margin: 0 0 18px; }
.lc-what { font-size: clamp(18px, 1.5vw, 22px); line-height: 1.4; margin: 0 0 30px; max-width: 26em; }
.lc-big { display: flex; align-items: baseline; gap: 16px; margin: 0 0 22px; padding-top: 22px; border-top: 1px solid #2a2a2e; }
.lc-big b { font-size: clamp(40px, 4.4vw, 68px); font-weight: 500; letter-spacing: -.04em; line-height: 1; white-space: nowrap; }
.lc-big span { color: #a9a9b0; font-size: 16px; line-height: 1.35; }
.lc-body { color: #8c8c94; font-size: 16px; line-height: 1.6; margin: 0 0 20px; max-width: 34em; }
.lc-links { display: flex; gap: 22px; margin: 0; font-size: 16px; }
.lc-more ol { list-style: none; margin: 26px 0 0; padding: 0; border-top: 1px solid #2a2a2e; }
.lc-more li { display: grid; grid-template-columns: 56px minmax(0, 1.1fr) minmax(0, 1fr); gap: 16px; padding: 15px 0; border-bottom: 1px solid #2a2a2e; font-size: 16px; }
.lc-more .y { font-family: var(--mono); font-size: 13px; color: #77777f; padding-top: 3px; }
.lc-more .r { color: #8c8c94; }
.lc-end { position: absolute; bottom: 0; height: calc(46svh + var(--W) * .7); display: flex; flex-direction: column; justify-content: center; }
.lc-mail { font-size: clamp(22px, 2.6vw, 38px); letter-spacing: -.02em; align-self: flex-start; margin-bottom: 22px; }

@media (max-width: 860px) {
  .lc { --W: 34vw; --G: 0px; --R: 14px; --M: 18px; }
  .lc-mark, .lc-read, .lc-body, .lc-more .r { display: none; }
  .lc-hero, .lc-zone, .lc-end { width: calc(66vw - 50px); }
  .lc h1 { font-size: 15vw; white-space: normal; }
  .lc h2 { font-size: 11vw; }
  .lc-stick { top: 12svh; }
  .lc-big { flex-direction: column; gap: 6px; }
  .lc-more li { grid-template-columns: 1fr; gap: 0; padding: 9px 0; font-size: 15px; }
  .lc-more .y { display: none; }
  .lc-mail { font-size: 15px; }
  .lc nav, .lc-links { flex-wrap: wrap; gap: 8px 16px; }
}
@media (prefers-reduced-motion: reduce) { .lc-lane .pin { transition: none; } }
`;
