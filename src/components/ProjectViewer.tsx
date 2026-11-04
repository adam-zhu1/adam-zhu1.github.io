import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { A, out } from "../lib/router";
import { morphInto } from "../lib/morph";
import { TrueLine } from "./TrueLine";
import { Clarity } from "./Clarity";
import { NistFigure } from "./ProjectStage";
import { WORK, type Entry } from "../data/work";

const num = (i: number) => String(i + 1).padStart(2, "0");

/**
 * The projects one at a time, in a viewer the size of the screen. Only the open project is
 * ever in view: its demo on a dark plate, and beside it the name, one line, two numbers and
 * the links. The others are named in the tabs at the top and nowhere else. Moving between
 * them is a deliberate act (a tab, the arrows, the arrow keys, a swipe), never the scroll, so
 * the page itself scrolls past the viewer like any other section. Details swaps the short
 * words for the full write-up in the same place. `onActive` hands the open project to the
 * page for its colour while the viewer is on screen.
 */
export function ProjectViewer({ onActive }: { onActive: (e: Entry | null) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const titles = useRef<(HTMLSpanElement | null)[]>([]);
  const [cur, setCur] = useState(0);
  const [inView, setInView] = useState(false);
  const [details, setDetails] = useState(false);
  const n = WORK.length;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "-35% 0px -35% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => { onActive(inView ? WORK[cur] : null); }, [cur, inView, onActive]);
  useEffect(() => () => onActive(null), [onActive]);

  const go = (i: number, focus = false) => {
    const k = (i + n) % n;
    if (k === cur) return;
    setCur(k);
    setDetails(false);
    if (focus) tabs.current[k]?.focus();
  };

  const onTabKey = (ev: KeyboardEvent) => {
    const to = { ArrowRight: cur + 1, ArrowLeft: cur - 1, Home: 0, End: n - 1 }[ev.key];
    if (to === undefined) return;
    ev.preventDefault();
    go(to, true);
  };

  // a sideways swipe on a touch screen moves on, a vertical one is left to the page
  const start = useRef<{ x: number; y: number } | null>(null);
  const down = (ev: PointerEvent) => { if (ev.pointerType === "touch") start.current = { x: ev.clientX, y: ev.clientY }; };
  const up = (ev: PointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const dx = ev.clientX - s.x, dy = ev.clientY - s.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(cur + (dx < 0 ? 1 : -1));
  };

  /* the door into TrueLine's page: its name is lifted off the viewer and flown to its heading */
  const openTrueLine = (ev: MouseEvent<HTMLAnchorElement>) => {
    const t = titles.current[WORK.findIndex(e => e.id === "p-trueline")];
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0 || !t) return;
    ev.preventDefault();
    morphInto("/trueline/", t, root.current);
  };

  const figure = (e: Entry, i: number) => {
    const held = !inView || cur !== i;
    if (e.demo === "trueline") return <TrueLine held={held} />;
    if (e.demo === "clarity") return <Clarity held={held} />;
    return <NistFigure on={inView && cur === i} />;
  };

  return (
    <div className="pv" ref={root} style={{ "--accent": WORK[cur].accent } as CSSProperties}>
      <div className="pvbar">
        <h2>Projects</h2>
        <div className="pvtabs" role="tablist" aria-label="Projects" onKeyDown={onTabKey}>
          {WORK.map((e, i) => (
            <button key={e.id} type="button" role="tab" id={`${e.id}-tab`} aria-selected={cur === i} aria-controls={e.id}
                    tabIndex={cur === i ? 0 : -1} ref={el => { tabs.current[i] = el; }}
                    style={{ "--c": e.accent } as CSSProperties} onClick={() => go(i)}>
              <i aria-hidden="true" />{e.name}
            </button>
          ))}
        </div>
        <div className="pvnav">
          <span className="pvcount" aria-hidden="true"><b>{num(cur)}</b> / {num(n - 1)}</span>
          <button type="button" aria-label="Previous project" onClick={() => go(cur - 1)}><i className="l" aria-hidden="true" /></button>
          <button type="button" aria-label="Next project" onClick={() => go(cur + 1)}><i aria-hidden="true" /></button>
        </div>
      </div>

      <div className="pvstage" onPointerDown={down} onPointerUp={up} onPointerCancel={() => { start.current = null; }}>
        {WORK.map((e, i) => {
          const on = cur === i;
          return (
            <section key={e.id} id={e.id} role="tabpanel" aria-labelledby={`${e.id}-tab`} inert={!on}
                     className={`pvp${on ? " on" : ""}`} style={{ "--accent": e.accent, "--dir": on ? 0 : i < cur ? -1 : 1 } as CSSProperties}>
              <div className="plate">{figure(e, i)}</div>
              <div className={`pvtext${on && details ? " det" : ""}`}>
                <div className="pvsum" inert={on && details}>
                  <p className="rowk"><span>{num(i)}</span>{e.kind} · {e.when}</p>
                  <h3><span ref={el => { titles.current[i] = el; }}>{e.name}</span></h3>
                  <p className="rowline">{e.line}</p>
                  <dl className="rowstats">
                    {e.facts.slice(0, 2).map(([k, v]) => <div key={k}><dd>{v}</dd><dt>{k}</dt></div>)}
                  </dl>
                  <div className="rowlinks">
                    <button type="button" className="more" onClick={() => setDetails(true)}>Details<i aria-hidden="true" /></button>
                    {e.links?.map(l => l.page
                      ? <A key={l.href} href={l.href} onClick={e.id === "p-trueline" ? openTrueLine : undefined}>{l.label}<b aria-hidden="true">&#8594;</b></A>
                      : <a key={l.href} {...out} href={l.href}>{l.label}<b aria-hidden="true">&#8599;</b></a>)}
                  </div>
                </div>
                <div className="pvdet" inert={!(on && details)}>
                  <button type="button" className="back" onClick={() => setDetails(false)}><i aria-hidden="true" />{e.name}</button>
                  <p className="dbody">{e.body}</p>
                  <h4>Results</h4>
                  <dl className="dfacts">{e.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
                  <h4>How it works</h4>
                  <ol className="dsteps">{e.steps.map(([k, v]) => <li key={k}><span><b>{k}</b> {v}</span></li>)}</ol>
                  {e.meta && <p className="dmeta">{e.meta}</p>}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
