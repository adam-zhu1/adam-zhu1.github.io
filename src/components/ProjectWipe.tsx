import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { A, out } from "../lib/router";
import { morphInto } from "../lib/morph";
import { TrueLine } from "./TrueLine";
import { Clarity } from "./Clarity";
import { NistFigure } from "./ProjectStage";
import { WORK, type Entry } from "../data/work";

const num = (i: number) => String(i + 1).padStart(2, "0");
/* in screen heights: how long a project holds while it is read, and how long the wipe to the next takes */
const HOLD = .6, MOVE = .9;
const SPAN = WORK.length * HOLD + (WORK.length - 1) * MOVE;
const clamp = (v: number) => Math.min(Math.max(v, 0), 1);

/**
 * The projects one screen at a time. The screen holds while you scroll, and each project is a
 * whole screen of its own; scrolling on draws the next one up over it from the bottom edge, the
 * edge going exactly as far as you scroll and back again if you scroll back. While it holds,
 * the words drift a little with the scroll, so the page never stops answering it. A phone, or a
 * reader who asks for less motion, gets the three as plain screens in a row.
 * `onActive` hands the project in view to the page for its colour.
 */
export function ProjectWipe({ onActive }: { onActive: (e: Entry | null) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const slides = useRef<(HTMLElement | null)[]>([]);
  const titles = useRef<(HTMLSpanElement | null)[]>([]);
  const fill = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(-1);
  const [details, setDetails] = useState<number | null>(null);
  const [flow, setFlow] = useState(false);
  /* draft only: which way the screens move on, to compare (?move=fade|zoom|wipe) */
  const [move, setMove] = useState(() => new URLSearchParams(location.search).get("move") ?? "fade");

  useEffect(() => {
    const mq = matchMedia("(max-width: 63.99rem), (prefers-reduced-motion: reduce)");
    const set = () => setFlow(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  useEffect(() => {
    const w = wrap.current;
    if (!w) return;
    if (flow) {
      slides.current.forEach(s => s?.removeAttribute("style"));
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) setTop(slides.current.indexOf(e.target as HTMLElement));
      }), { rootMargin: "-50% 0px -50% 0px" });
      slides.current.forEach(s => s && io.observe(s));
      return () => io.disconnect();
    }
    let raf = 0;
    const read = () => {
      raf = 0;
      const h = innerHeight, r = w.getBoundingClientRect();
      const unit = (w.offsetHeight - h) / SPAN;
      const y = -r.top;
      /* how far each project has been drawn up over the one before it */
      const into = WORK.map((_, i) => i === 0 ? 1 : clamp((y - (i * HOLD + (i - 1) * MOVE) * unit) / (MOVE * unit)));
      slides.current.forEach((s, i) => {
        if (!s) return;
        const a = into[i], b = into[i + 1] ?? 0;
        const held = clamp((y - (i * (HOLD + MOVE)) * unit) / (HOLD * unit));
        /* it rises a little as it comes in, lifts a little as it goes, and drifts while held */
        const lift = (1 - a) * .12 * h - b * (move === "wipe" ? .06 : .1) * h + (.5 - held) * 20;
        s.style.setProperty("--r", a.toFixed(4));
        s.style.setProperty("--o", b.toFixed(4));
        s.style.setProperty("--y", `${lift.toFixed(1)}px`);
      });
      if (fill.current) fill.current.style.setProperty("--f", clamp(y / (SPAN * unit)).toFixed(4));
      const seen = r.top < h * .5 && r.bottom > h * .5;
      const cur = seen ? into.reduce((n, a, i) => a >= .5 ? i : n, 0) : -1;
      setTop(t => t === cur ? t : cur);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, [flow, move]);

  useEffect(() => { onActive(top < 0 ? null : WORK[top]); }, [top, onActive]);
  useEffect(() => () => onActive(null), [onActive]);

  /* the door into TrueLine's page: its name is lifted off the screen and flown to its heading */
  const openTrueLine = (ev: MouseEvent<HTMLAnchorElement>) => {
    const i = WORK.findIndex(e => e.id === "p-trueline");
    const t = titles.current[i];
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0 || !t) return;
    ev.preventDefault();
    morphInto("/trueline/", t, slides.current[i]);
  };

  const figure = (e: Entry, i: number) => {
    if (e.demo === "trueline") return <TrueLine held={top !== i} />;
    if (e.demo === "clarity") return <Clarity held={top !== i} />;
    return <NistFigure on={top === i} />;
  };

  return (
    <div className={`pwrap t-${move}${flow ? " flow" : ""}`} ref={wrap} style={flow ? undefined : { height: `${(SPAN + 1) * 100}svh` }}>
      {/* where each project starts, for links and the bar's track; the screens themselves never move */}
      {!flow && WORK.map((e, i) => (
        <span key={e.id} id={e.id} className="pmark" aria-hidden="true"
              style={{ top: `${(i * (HOLD + MOVE)) * 100}svh`, height: `${(i === WORK.length - 1 ? HOLD + 1 : HOLD + MOVE) * 100}svh` }} />
      ))}
      <div className="pstage">
        {WORK.map((e, i) => {
          const det = details === i;
          return (
            <section key={e.id} id={flow ? e.id : undefined} className="pslide" ref={el => { slides.current[i] = el; }}
                     style={{ "--accent": e.accent, zIndex: i + 1 } as CSSProperties} aria-labelledby={`${e.id}-h`}
                     inert={!flow && top >= 0 && top !== i}>
              <div className="pin">
                <div className={`pvtext${det ? " det" : ""}`}>
                  <div className="pvsum" inert={det}>
                    <p className="rowk"><span>{num(i)} / {num(WORK.length - 1)}</span>{e.kind} · {e.when}</p>
                    <h3 id={`${e.id}-h`}><span ref={el => { titles.current[i] = el; }}>{e.name}</span></h3>
                    <p className="rowline">{e.line}</p>
                    <dl className="rowstats">
                      {e.facts.slice(0, 2).map(([k, v]) => <div key={k}><dd>{v}</dd><dt>{k}</dt></div>)}
                    </dl>
                    <div className="rowlinks">
                      <button type="button" className="more" onClick={() => setDetails(i)}>Details<i aria-hidden="true" /></button>
                      {e.links?.map(l => l.page
                        ? <A key={l.href} href={l.href} onClick={e.id === "p-trueline" ? openTrueLine : undefined}>{l.label}<b aria-hidden="true">&#8594;</b></A>
                        : <a key={l.href} {...out} href={l.href}>{l.label}<b aria-hidden="true">&#8599;</b></a>)}
                    </div>
                  </div>
                  <div className="pvdet" inert={!det}>
                    <button type="button" className="back" onClick={() => setDetails(null)}><i aria-hidden="true" />{e.name}</button>
                    <p className="dbody">{e.body}</p>
                    <h4>Results</h4>
                    <dl className="dfacts">{e.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
                    <h4>How it works</h4>
                    <ol className="dsteps">{e.steps.map(([k, v]) => <li key={k}><span><b>{k}</b> {v}</span></li>)}</ol>
                    {e.meta && <p className="dmeta">{e.meta}</p>}
                  </div>
                </div>
                <div className="plate">{figure(e, i)}</div>
              </div>
            </section>
          );
        })}
        {!flow && (
          <div className="ptrack" ref={fill} aria-hidden="true">
            {WORK.map((e, i) => <span key={e.id} className={top === i ? "on" : ""} style={{ "--accent": e.accent } as CSSProperties}>{num(i)}</span>)}
            <i />
          </div>
        )}
      </div>
      {!flow && (
        <div className="ptry">
          {["fade", "zoom", "wipe"].map(m => <button key={m} type="button" className={move === m ? "on" : ""} onClick={() => setMove(m)}>{m}</button>)}
        </div>
      )}
    </div>
  );
}
