import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { A, out } from "../lib/router";
import { morphInto } from "../lib/morph";
import { prefersReducedMotion } from "../lib/useReveal";
import { TrueLine } from "./TrueLine";
import { Clarity } from "./Clarity";
import { NistFigure } from "./ProjectStage";
import { WORK, type Entry } from "../data/work";

const num = (i: number) => String(i + 1).padStart(2, "0");

/**
 * The projects as pages of a lab notebook. A short index comes first, one row each, so the
 * three can be read in a glance and any one jumped to. Then each project gets a page: its
 * number and date along a rule, the name, what it is, the measured results as a table, how
 * it works in steps, and its demo as a captioned figure beside them. Nothing pins and
 * nothing is tied to the scroll; the page reads top to bottom. `onActive` hands the project
 * in the middle of the screen to the page for its colour.
 */
export function ProjectNotebook({ onActive }: { onActive: (e: Entry | null) => void }) {
  const pages = useRef<(HTMLElement | null)[]>([]);
  const titles = useRef<(HTMLSpanElement | null)[]>([]);
  const [seen, setSeen] = useState<boolean[]>(() => WORK.map(() => false));

  // which page owns the middle of the screen sets the colour; a figure starts once it is near
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
    pages.current.forEach(p => { if (p) { mid.observe(p); near.observe(p); } });
    return () => { mid.disconnect(); near.disconnect(); onActive(null); };
  }, [onActive]);

  const jump = (ev: MouseEvent<HTMLAnchorElement>, i: number) => {
    ev.preventDefault();
    pages.current[i]?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
    history.replaceState(null, "", `#${WORK[i].id}`);
  };

  /* the door into TrueLine's page: its name is lifted off the page and flown to its heading */
  const tl = WORK.findIndex(e => e.id === "p-trueline");
  const openTrueLine = (ev: MouseEvent<HTMLAnchorElement>) => {
    const t = titles.current[tl];
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0 || !t) return;
    ev.preventDefault();
    morphInto("/trueline/", t, pages.current[tl]);
  };

  const figure = (e: Entry, i: number) => {
    if (e.demo === "trueline") return <TrueLine />;
    if (e.demo === "clarity") return <Clarity />;
    return <NistFigure on={seen[i]} />;
  };

  return (
    <div className="nb">
      <ol className="nbidx" aria-label="The three projects">
        {WORK.map((e, i) => (
          <li key={e.id} style={{ "--accent": e.accent } as CSSProperties}>
            <a href={`#${e.id}`} onClick={ev => jump(ev, i)}>
              <span className="n">{num(i)}</span>
              <span className="t">{e.name}</span>
              <span className="k">{e.kind}</span>
              <span className="l">{e.line}</span>
              <span className="w">{e.when}</span>
            </a>
          </li>
        ))}
      </ol>

      {WORK.map((e, i) => (
        <article key={e.id} id={e.id} data-i={i} className="nbpage" ref={el => { pages.current[i] = el; }}
                 style={{ "--accent": e.accent } as CSSProperties} aria-labelledby={`${e.id}-h`}>
          <header className="nbrule">
            <span>{num(i)}</span><span>{e.kind}</span><span>{e.when}</span>
          </header>
          <div className="nbbody">
            <div className="nbtext">
              <h3 id={`${e.id}-h`}><span ref={el => { titles.current[i] = el; }}>{e.name}</span></h3>
              <p className="nbdesc">{e.body}</p>

              <h4>Results</h4>
              <dl className="nbfacts">
                {e.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
              </dl>

              <h4>How it works</h4>
              <ol className="nbsteps">
                {e.steps.map(([k, v]) => <li key={k}><span><b>{k}</b> {v}</span></li>)}
              </ol>

              {e.meta && <p className="nbmeta">{e.meta}</p>}
              {e.links?.length ? (
                <div className="nblinks">
                  {e.links.map(l => l.page
                    ? <A key={l.href} href={l.href} onClick={e.id === "p-trueline" ? openTrueLine : undefined}>{l.label}<i aria-hidden="true">&#8594;</i></A>
                    : <a key={l.href} {...out} href={l.href}>{l.label}<i aria-hidden="true">&#8599;</i></a>)}
                </div>
              ) : null}
            </div>
            <figure className={`nbfig ${e.demo}`}>
              <div className="nbplate">{figure(e, i)}</div>
              <figcaption><b>Fig. {i + 1}</b> {e.fig}</figcaption>
            </figure>
          </div>
        </article>
      ))}
    </div>
  );
}
