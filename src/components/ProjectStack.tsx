import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { A, out } from "../lib/router";
import { morphInto } from "../lib/morph";
import { TrueLine } from "./TrueLine";
import { Clarity } from "./Clarity";
import { NistFigure } from "./ProjectStage";
import { WORK, type Entry } from "../data/work";

const num = (i: number) => String(i + 1).padStart(2, "0");

/** Text that rolls up through a slot a letter at a time, driven by the `--r` its section sets (0 to 1). */
function Roll({ text }: { text: string }) {
  const n = Math.max(text.length - 1, 1);
  return (
    <span className="roll" aria-hidden="true">
      {[...text].map((c, k) => <span key={k} style={{ "--k": (k / n).toFixed(3) } as CSSProperties}>{c === " " ? " " : c}</span>)}
    </span>
  );
}

/**
 * The projects, stacked: the section's name set as big as the page's own, an index of the
 * three under it, then one section per project, each its own split screen of words and a
 * result on the left and the working demo on the right. Plain scrolling the whole way; the
 * only motion tied to the scroll is the name rolling up into place. `onActive` hands the
 * project mostly in view to the page for its colour.
 */
export function ProjectStack({ onActive }: { onActive: (e: Entry | null) => void }) {
  const head = useRef<HTMLElement>(null);
  const secs = useRef<(HTMLElement | null)[]>([]);
  const titles = useRef<(HTMLElement | null)[]>([]);
  const [cur, setCur] = useState(-1);
  const [seen, setSeen] = useState<boolean[]>(() => WORK.map(() => false));
  const [open, setOpen] = useState<number | null>(null);

  /* the name rolls up as the header rises into view, and stays */
  useEffect(() => {
    const h = head.current;
    if (!h) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { h.style.setProperty("--r", "1"); return; }
    let raf = 0;
    const read = () => {
      raf = 0;
      const r = h.getBoundingClientRect(), vh = innerHeight;
      h.style.setProperty("--r", Math.min(Math.max((vh * .95 - r.top) / (vh * .5), 0), 1).toFixed(4));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);

  /* which project holds the middle of the screen, and which have been seen at all */
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => {
      const i = secs.current.indexOf(e.target as HTMLElement);
      if (i < 0) return;
      if (e.isIntersecting) {
        setCur(i);
        setSeen(s => s[i] ? s : s.map((v, k) => k === i ? true : v));
      } else setCur(c => c === i ? -1 : c);
    }), { rootMargin: "-45% 0px -45% 0px" });
    secs.current.forEach(s => s && io.observe(s));
    return () => io.disconnect();
  }, []);

  useEffect(() => { onActive(cur < 0 ? null : WORK[cur]); }, [cur, onActive]);
  useEffect(() => () => onActive(null), [onActive]);

  /* the door into TrueLine's page: its name is lifted off the section and flown to its heading */
  const openTrueLine = (ev: MouseEvent<HTMLAnchorElement>) => {
    const i = WORK.findIndex(e => e.id === "p-trueline");
    const t = titles.current[i];
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0 || !t) return;
    ev.preventDefault();
    morphInto("/trueline/", t, secs.current[i]);
  };

  const figure = (e: Entry, i: number) => {
    if (e.demo === "trueline") return <TrueLine />;
    if (e.demo === "clarity") return <Clarity />;
    return <NistFigure on={seen[i]} />;
  };

  return (
    <>
      <header className="pshead" ref={head}>
        <h2 className="mega" aria-label="Projects"><Roll text="Projects" /></h2>
        <ol className="pindex">
          {WORK.map((e, i) => (
            <li key={e.id}>
              <a href={`#${e.id}`}>
                <span className="n">{num(i)}</span>
                <b>{e.name}</b>
                <em>{e.kind}</em>
              </a>
            </li>
          ))}
        </ol>
      </header>

      {WORK.map((e, i) => {
        const [val, cap] = e.big;
        const det = open === i;
        return (
          <section key={e.id} id={e.id} className={`proj${cur === i ? " cur" : ""}`} ref={el => { secs.current[i] = el; }}
                   style={{ "--accent": e.accent } as CSSProperties} aria-labelledby={`${e.id}-h`}>
            <div className="phead">
              <span className="n">{num(i)}</span>
              <span>{e.kind}</span>
              <span className="w">{e.when}</span>
            </div>
            <div className="pmain">
              <div className="ptext">
                <h3 id={`${e.id}-h`}><span ref={el => { titles.current[i] = el; }}>{e.name}</span></h3>
                <p className="pwhat">{e.what}</p>
                <div className="pstat">
                  <b>{val}</b>
                  <span>{cap}</span>
                </div>
                <div className="plinks">
                  <button type="button" className="pmore" aria-expanded={det} aria-controls={`${e.id}-d`} onClick={() => setOpen(det ? null : i)}>
                    {det ? "Less" : "Details"}<i aria-hidden="true">&#8595;</i>
                  </button>
                  {e.links?.map(l => l.page
                    ? <A key={l.href} href={l.href} onClick={e.id === "p-trueline" ? openTrueLine : undefined}>{l.label}<i aria-hidden="true">&#8594;</i></A>
                    : <a key={l.href} {...out} href={l.href}>{l.label}<i aria-hidden="true">&#8599;</i></a>)}
                </div>
              </div>
              <div className="pdemo">{figure(e, i)}</div>
            </div>
            <div className={`pdet${det ? " open" : ""}`} id={`${e.id}-d`} inert={!det}>
              <div>
                <div className="pdgrid">
                  <div>
                    <p className="dbody">{e.body}</p>
                    {e.result && <p className="dres">{e.result}</p>}
                    {e.meta && <p className="dmeta">{e.meta}</p>}
                  </div>
                  <div>
                    <h4>Results</h4>
                    <dl className="dfacts">{e.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
                    <h4>How it works</h4>
                    <ol className="dsteps">{e.steps.map(([k, v]) => <li key={k}><b>{k}</b> {v}</li>)}</ol>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
