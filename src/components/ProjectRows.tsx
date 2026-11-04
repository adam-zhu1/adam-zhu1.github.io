import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { A, out } from "../lib/router";
import { morphInto } from "../lib/morph";
import { TrueLine } from "./TrueLine";
import { Clarity } from "./Clarity";
import { NistFigure } from "./ProjectStage";
import { WORK, type Entry } from "../data/work";

const num = (i: number) => String(i + 1).padStart(2, "0");

/**
 * The projects, one row each, the demo first. Each row is mostly its demo, on a dark plate
 * that opens out as it comes up the screen; beside it sit only the name, one line, two
 * numbers and the links. The rest (what it is in full, every result, how it works, the
 * stack) waits in a drawer under the row, so the page stays quiet until someone asks for
 * more. Rows swap sides down the page. Nothing pins; the page scrolls as a page.
 * `onActive` hands the row in the middle of the screen to the page for its colour.
 */
export function ProjectRows({ onActive }: { onActive: (e: Entry | null) => void }) {
  const rows = useRef<(HTMLElement | null)[]>([]);
  const titles = useRef<(HTMLSpanElement | null)[]>([]);
  const [seen, setSeen] = useState<boolean[]>(() => WORK.map(() => false));
  const [open, setOpen] = useState<number | null>(null);

  // which row owns the middle of the screen sets the colour; a figure starts once it is near
  useEffect(() => {
    let cur = -1;
    const mid = new IntersectionObserver(es => es.forEach(e => {
      const i = Number((e.target as HTMLElement).dataset.i);
      if (e.isIntersecting) { cur = i; onActive(WORK[i]); }
      else if (cur === i) { cur = -1; onActive(null); }
    }), { rootMargin: "-50% 0px -50% 0px" });
    const near = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const i = Number((e.target as HTMLElement).dataset.i);
      setSeen(s => s[i] ? s : s.map((v, k) => k === i || v));
    }), { rootMargin: "0px 0px -20% 0px" });
    rows.current.forEach(r => { if (r) { mid.observe(r); near.observe(r); } });
    return () => { mid.disconnect(); near.disconnect(); onActive(null); };
  }, [onActive]);

  /* the door into TrueLine's page: its name is lifted off the row and flown to its heading */
  const tl = WORK.findIndex(e => e.id === "p-trueline");
  const openTrueLine = (ev: MouseEvent<HTMLAnchorElement>) => {
    const t = titles.current[tl];
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0 || !t) return;
    ev.preventDefault();
    morphInto("/trueline/", t, rows.current[tl]);
  };

  const figure = (e: Entry, i: number) => {
    if (e.demo === "trueline") return <TrueLine />;
    if (e.demo === "clarity") return <Clarity />;
    return <NistFigure on={seen[i]} />;
  };

  return (
    <div className="rows">
      {WORK.map((e, i) => (
        <article key={e.id} id={e.id} data-i={i} className={`row${i % 2 ? " flip" : ""}${open === i ? " open" : ""}`}
                 ref={el => { rows.current[i] = el; }} style={{ "--accent": e.accent } as CSSProperties} aria-labelledby={`${e.id}-h`}>
          <div className="rowmain">
            <div className="plate">{figure(e, i)}</div>
            <div className="rowtext">
              <p className="rowk"><span>{num(i)}</span>{e.kind}</p>
              <h3 id={`${e.id}-h`}><span ref={el => { titles.current[i] = el; }}>{e.name}</span></h3>
              <p className="rowline">{e.line}</p>
              <dl className="rowstats">
                {e.facts.slice(0, 2).map(([k, v]) => <div key={k}><dd>{v}</dd><dt>{k}</dt></div>)}
              </dl>
              <div className="rowlinks">
                <button type="button" className="more" aria-expanded={open === i} aria-controls={`${e.id}-d`}
                        onClick={() => setOpen(o => o === i ? null : i)}>
                  {open === i ? "Less" : "Details"}<i aria-hidden="true" />
                </button>
                {e.links?.map(l => l.page
                  ? <A key={l.href} href={l.href} onClick={e.id === "p-trueline" ? openTrueLine : undefined}>{l.label}<b aria-hidden="true">&#8594;</b></A>
                  : <a key={l.href} {...out} href={l.href}>{l.label}<b aria-hidden="true">&#8599;</b></a>)}
              </div>
            </div>
          </div>

          <div className="drawer" id={`${e.id}-d`} inert={open !== i}>
            <div>
              <div className="dgrid">
                <div><h4>About</h4><p>{e.body}</p>{e.meta && <p className="dmeta">{e.meta}</p>}</div>
                <div><h4>Results</h4>
                  <dl className="dfacts">{e.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></div>
                <div><h4>How it works</h4>
                  <ol className="dsteps">{e.steps.map(([k, v]) => <li key={k}><span><b>{k}</b> {v}</span></li>)}</ol></div>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
