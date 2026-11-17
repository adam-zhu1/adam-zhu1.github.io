import { useEffect, useRef, useState } from "react";
import track from "../data/trueline-track.json";
import commits from "../data/commits.json";
import { WORK } from "../data/work";
import { MORE } from "../components/MoreWork";
import { out } from "../lib/router";
import { Switcher } from "./Switcher";
import { LINKS } from "./links";

/**
 * Concept: the instrument. The page is the faceplate of a measuring device: a light panel,
 * hairline modules, small labels, large numerals. One display, one three-position selector.
 * Everything on it is a real reading: the clock, the commit history, the TrueLine throw
 * replayed in real time, the NIST shares.
 */

type Pt = { t: number; f: number; b: number };
const PTS = track.pts as Pt[];
const T0 = track.t_start, T1 = track.t_end;
const metric = (n: string) => (track.metrics as { n: string; v: number }[]).find(m => m.n === n)?.v ?? 0;
const X = (f: number) => 8 + f / 60 * 304, Y = (b: number) => 8 + (b - .5) / 39 * 64;
const PATH = PTS.map((p, i) => `${i ? "L" : "M"}${X(p.f).toFixed(1)} ${Y(p.b).toFixed(1)}`).join("");

const C = commits as { r: string; t: string }[];
const LAST = C.reduce((a, c) => c.t > a.t ? c : a, C[0]);
const DAYS = new Set(C.map(c => c.t.slice(0, 10))).size;
const short = (href: string) => href.endsWith(".pdf") ? "PDF" : href.replace(/^mailto:|^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

function useClock() {
  const [s, set] = useState("");
  useEffect(() => {
    const f = new Intl.DateTimeFormat("en-GB", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const tick = () => set(f.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return s;
}

/* the throw, replayed at its real speed, then held */
function Throw() {
  const dot = useRef<SVGCircleElement>(null), done = useRef<SVGPathElement>(null);
  const ft = useRef<HTMLElement>(null), bd = useRef<HTMLElement>(null);
  useEffect(() => {
    let raf = 0;
    const len = done.current?.getTotalLength() ?? 0;
    const start = performance.now();
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw = (now: number) => {
      const span = T1 - T0, t = still ? T1 : T0 + Math.min(span, ((now - start) / 1000) % (span + 1.8));
      let i = 1;
      while (i < PTS.length - 1 && PTS[i].t < t) i++;
      const a = PTS[i - 1], b = PTS[i], k = Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t)));
      const f = a.f + (b.f - a.f) * k, bo = a.b + (b.b - a.b) * k;
      dot.current?.setAttribute("cx", String(X(f)));
      dot.current?.setAttribute("cy", String(Y(bo)));
      if (done.current) done.current.style.strokeDashoffset = String(len * (1 - (i - 1 + k) / (PTS.length - 1)));
      if (ft.current) ft.current.textContent = f.toFixed(1);
      if (bd.current) bd.current.textContent = bo.toFixed(1);
      if (!still) raf = requestAnimationFrame(draw);
    };
    if (done.current) done.current.style.strokeDasharray = String(len);
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <>
      <svg viewBox="0 0 320 80" className="ic-plot">
        <rect x="8" y="8" width="304" height="64" className="box" />
        {[5, 10, 15, 20, 25, 30, 35].map(b => <line key={b} x1="8" x2="312" y1={Y(b)} y2={Y(b)} className="grid" />)}
        {[15, 30, 45].map(f => <line key={f} y1="8" y2="72" x1={X(f)} x2={X(f)} className="grid" />)}
        <path d={PATH} className="ghost" />
        <path d={PATH} className="done" ref={done} />
        <circle r="3.2" className="dot" ref={dot} />
      </svg>
      <dl className="ic-nums">
        <div><dt>Distance, ft</dt><dd ref={ft}>0.0</dd></div>
        <div><dt>Board</dt><dd ref={bd}>0.0</dd></div>
        <div><dt>Release, mph</dt><dd>{metric("Speed")}</dd></div>
      </dl>
    </>
  );
}

function Nist() {
  const rows: [string, number][] = [["Stated identity", 21.7], ["Behavior rules", 30.6], ["After the audit", 41.9]];
  return (
    <>
      <div className="ic-bars">
        {rows.map(([l, v]) => (
          <div key={l}><span>{l}</span><i><b style={{ width: `${v}%` }} /></i><em>{v}%</em></div>
        ))}
        <p>Share of portal requests classified as automated</p>
      </div>
      <dl className="ic-nums">
        <div><dt>Random forest F1</dt><dd>0.94</dd></div>
        <div><dt>Requests</dt><dd>1.04M</dd></div>
        <div><dt>Days of logs</dt><dd>271</dd></div>
      </dl>
    </>
  );
}

function Clarity() {
  return (
    <>
      <div className="ic-steps">
        <div><b>1</b><span>Press the hotkey, drag a box around the problem</span></div>
        <div><b>2</b><span>A written explanation, in seconds</span></div>
        <div><b>3</b><span>An animation made for that problem, about a minute later</span></div>
      </div>
      <dl className="ic-nums">
        <div><dt>Built in, days</dt><dd>2</dd></div>
        <div><dt>Team</dt><dd>4</dd></div>
        <div><dt>My part</dt><dd className="sm">Mac app</dd></div>
      </dl>
    </>
  );
}

export default function Instrument() {
  const clock = useClock();
  const [sel, setSel] = useState(0);
  const w = WORK[sel];
  const since = Math.max(0, Math.round((Date.now() - Date.parse(LAST.t + ":00Z")) / 86_400_000));

  return (
    <div className="ic">
      <style>{CSS}</style>
      <Switcher />

      <div className="ic-plate">
        <div className="ic-row ic-top">
          <span><i className="led" />Adam Zhu</span>
          <span>Pittsburgh <b>{clock}</b></span>
          <span>Last commit <b>{since === 0 ? "today" : `${since} d ago`}</b></span>
          <span>{C.length} commits on {DAYS} days</span>
        </div>

        <div className="ic-main">
          <div className="ic-id">
            <h1>Adam<br />Zhu</h1>
            <p><b>Statistics and machine learning at Carnegie Mellon.</b> Looking for Summer 2027 internships in software, ML, data science, or quant.</p>
            <ul className="ic-ports">
              {LINKS.map(l => <li key={l.label}><a href={l.href} {...(l.href.startsWith("mailto") ? {} : out)}><i /><span>{l.label}</span><em>{short(l.href)}</em></a></li>)}
            </ul>
          </div>

          <div className="ic-unit">
            <div className="ic-screen">
              <div className="ic-shead"><span>{String(sel + 1).padStart(2, "0")} {w.name}</span><span>{w.kind}</span></div>
              {sel === 0 ? <Throw /> : sel === 1 ? <Clarity /> : <Nist />}
            </div>
            <div className="ic-ctl">
              <button type="button" className="ic-knob" aria-label="Next project" onClick={() => setSel((sel + 1) % 3)}>
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" className="ring" />
                  <circle cx="50" cy="50" r="34" className="cap" />
                  <line x1="50" y1="50" x2="50" y2="20" className="ptr" style={{ transform: `rotate(${(sel - 1) * 48}deg)` }} />
                </svg>
              </button>
              <div className="ic-sel">
                {WORK.map((p, i) => (
                  <button type="button" key={p.id} className={i === sel ? "on" : ""} onClick={() => setSel(i)}>
                    <i />{String(i + 1).padStart(2, "0")}<span>{p.name}</span>
                  </button>
                ))}
              </div>
              <p className="ic-what">{w.what}{w.links && <> {w.links.map(l => <a key={l.label} href={l.href} {...(l.page ? {} : out)}>{l.label}</a>)}</>}</p>
            </div>
          </div>
        </div>

        <div className="ic-row ic-spec">
          <h2>Readings</h2>
          <table>
            <tbody>
              {WORK.flatMap(p => p.facts.slice(0, 3).map(([l, v], i) => (
                <tr key={p.id + l}><th>{i === 0 ? p.name : ""}</th><td>{l}</td><td className="v">{v}</td></tr>
              )))}
            </tbody>
          </table>
        </div>

        <div className="ic-row ic-spec">
          <h2>More work</h2>
          <table>
            <tbody>
              {MORE.map(m => (
                <tr key={m.name}><th>{m.year}</th><td>{m.href ? <a href={m.href} {...out}>{m.name}</a> : m.name}</td><td className="r">{m.role}{m.org && <> · {m.org}</>}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const CSS = `
html, body { background: #dedcd6 !important; }
.ic { --ink: #151515; --mut: #6f6d68; --ln: #b9b6ae; --sig: #e8a400;
  min-height: 100svh; background: #dedcd6; color: var(--ink); font-family: var(--sans); padding: clamp(12px, 2.4vw, 36px); box-sizing: border-box; }
.ic a { color: inherit; text-decoration: none; }
.ic-plate { background: #eceae5; border-radius: 22px; border: 1px solid #c9c6be;
  box-shadow: 0 1px 0 #fff inset, 0 30px 60px -40px rgba(0,0,0,.35); overflow: hidden; }
.ic-row { border-top: 1px solid var(--ln); padding: 18px clamp(18px, 3vw, 44px); }
.ic-top { border-top: 0; display: flex; flex-wrap: wrap; gap: 8px 36px; font: 400 12.5px/1.4 var(--mono); color: var(--mut); }
.ic-top span:first-child { color: var(--ink); margin-right: auto; }
.ic-top b { font-weight: 400; color: var(--ink); font-variant-numeric: tabular-nums; }
.ic .led { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--sig); margin-right: 10px; }

.ic-main { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); border-top: 1px solid var(--ln); min-height: calc(100svh - 150px); }
.ic-id { padding: clamp(24px, 3.4vw, 52px) clamp(18px, 3vw, 44px); display: flex; flex-direction: column; border-right: 1px solid var(--ln); }
.ic h1 { font-size: clamp(72px, 12.5vw, 210px); line-height: .82; letter-spacing: -.065em; font-weight: 500; margin: 0 0 auto; }
.ic-id p { font-size: clamp(17px, 1.45vw, 21px); line-height: 1.4; color: var(--mut); max-width: 27em; margin: 40px 0 28px; }
.ic-id p b { font-weight: 400; color: var(--ink); }
.ic-ports { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 28px; border-top: 1px solid var(--ln); }
.ic-ports a { display: flex; align-items: center; gap: 12px; padding: 13px 0; border-bottom: 1px solid var(--ln); font-size: 15px; }
.ic-ports i { width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--ink); box-shadow: inset 0 0 0 3px #eceae5, inset 0 0 0 8px var(--ink); flex: none; transition: box-shadow .15s; }
.ic-ports a:hover i { box-shadow: inset 0 0 0 3px #eceae5, inset 0 0 0 8px var(--sig); }
.ic-ports em { font: normal 400 12.5px/1 var(--mono); color: var(--mut); margin-left: auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.ic-unit { padding: clamp(18px, 2.6vw, 40px); display: flex; flex-direction: column; gap: clamp(18px, 2.4vw, 34px); }
.ic-screen { background: #101011; color: #f1efe9; border-radius: 14px; padding: clamp(16px, 2vw, 28px); flex: 1; display: flex; flex-direction: column; gap: 18px;
  box-shadow: 0 0 0 1px #000, 0 0 0 7px #d6d3cc, 0 0 0 8px #bdb9b0; margin: 8px; }
.ic-shead { display: flex; justify-content: space-between; gap: 16px; font: 400 12.5px/1.3 var(--mono); color: #8d8b85; }
.ic-shead span:first-child { color: var(--sig); }
.ic-plot { width: 100%; height: auto; flex: 1; min-height: 0; }
.ic-plot .box { fill: none; stroke: #3a3936; stroke-width: .6; }
.ic-plot .grid { stroke: #262624; stroke-width: .5; }
.ic-plot .ghost { fill: none; stroke: #55534e; stroke-width: .7; stroke-dasharray: 1.5 3; }
.ic-plot .done { fill: none; stroke: #f1efe9; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
.ic-plot .dot { fill: var(--sig); }
.ic-nums { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0; margin: 0; border-top: 1px solid #2c2b29; }
.ic-nums div { padding: 14px 0 0 16px; border-left: 1px solid #2c2b29; }
.ic-nums div:first-child { padding-left: 0; border-left: 0; }
.ic-nums dt { font: 400 12px/1.2 var(--mono); color: #8d8b85; margin-bottom: 8px; }
.ic-nums dd { margin: 0; font-size: clamp(34px, 4.6vw, 72px); line-height: 1; letter-spacing: -.045em; font-weight: 400; font-variant-numeric: tabular-nums; }
.ic-nums dd.sm { font-size: clamp(22px, 2.6vw, 40px); padding-top: .35em; }
.ic-bars { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 16px; }
.ic-bars div { display: grid; grid-template-columns: 9.5em minmax(0, 1fr) 3.6em; align-items: center; gap: 14px; font-size: 14px; color: #c9c7c1; }
.ic-bars i { height: 10px; background: #232321; border-radius: 2px; overflow: hidden; }
.ic-bars b { display: block; height: 100%; background: #f1efe9; }
.ic-bars div:last-of-type b { background: var(--sig); }
.ic-bars em { font: normal 400 13px/1 var(--mono); text-align: right; }
.ic-bars p { margin: 4px 0 0; font: 400 12px/1.3 var(--mono); color: #8d8b85; }
.ic-steps { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.ic-steps div { display: flex; gap: 18px; align-items: baseline; padding: 14px 0; border-top: 1px solid #2c2b29; font-size: clamp(16px, 1.5vw, 21px); line-height: 1.35; }
.ic-steps div:first-child { border-top: 0; }
.ic-steps b { font: 400 12.5px/1 var(--mono); color: var(--sig); }

.ic-ctl { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 14px 28px; align-items: center; padding: 0 8px; }
.ic-knob { width: clamp(84px, 8vw, 116px); aspect-ratio: 1; padding: 0; border: 0; background: none; cursor: pointer; grid-row: span 2; }
.ic-knob .ring { fill: #e2dfd8; stroke: var(--ln); }
.ic-knob .cap { fill: #1a1a1a; }
.ic-knob .ptr { stroke: var(--sig); stroke-width: 4; stroke-linecap: round; transform-origin: 50px 50px; transition: transform .35s cubic-bezier(.3,1.4,.5,1); }
.ic-knob:active .cap { fill: #000; }
.ic-sel { display: flex; flex-wrap: wrap; gap: 8px; }
.ic-sel button { display: flex; align-items: center; gap: 9px; font: 400 12.5px/1 var(--mono); color: var(--mut); background: none; border: 1px solid var(--ln); border-radius: 999px; padding: 10px 15px; cursor: pointer; transition: color .15s, border-color .15s, background .15s; }
.ic-sel button span { font-family: var(--sans); font-size: 15px; color: var(--ink); }
.ic-sel button i { width: 7px; height: 7px; border-radius: 50%; background: var(--ln); transition: background .15s; }
.ic-sel button.on { border-color: var(--ink); background: #f6f5f1; }
.ic-sel button.on i { background: var(--sig); }
.ic-what { margin: 0; font-size: 16px; line-height: 1.45; color: var(--mut); }
.ic-what a { color: var(--ink); border-bottom: 1px solid var(--ln); margin-left: 12px; white-space: nowrap; }

.ic-spec { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); padding-top: 34px; padding-bottom: 34px; }
.ic-spec h2 { font-size: clamp(30px, 3.4vw, 54px); letter-spacing: -.04em; line-height: 1; font-weight: 500; margin: 0 0 20px; }
.ic-spec table { width: 100%; border-collapse: collapse; font-size: 15.5px; }
.ic-spec tr { border-bottom: 1px solid var(--ln); }
.ic-spec th, .ic-spec td { text-align: left; padding: 12px 12px 12px 0; font-weight: 400; vertical-align: baseline; }
.ic-spec th { width: 6.5em; font-weight: 500; }
.ic-spec td.v { text-align: right; font-family: var(--mono); font-size: 14px; white-space: nowrap; padding-right: 0; }
.ic-spec td.r { color: var(--mut); }
.ic-spec td a { border-bottom: 1px solid var(--ln); }

@media (max-width: 900px) {
  .ic-main, .ic-spec { grid-template-columns: 1fr; }
  .ic-id { border-right: 0; border-bottom: 1px solid var(--ln); }
  .ic h1 { margin-bottom: 8px; }
  .ic-ports { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) { .ic-knob .ptr { transition: none; } }
`;
