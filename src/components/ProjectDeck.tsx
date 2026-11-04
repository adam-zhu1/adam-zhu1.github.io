import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { A, out } from "../lib/router";
import { morphInto } from "../lib/morph";
import { TrueLine } from "./TrueLine";
import { Clarity } from "./Clarity";
import { NistFigure } from "./ProjectStage";
import { WORK, type Entry } from "../data/work";

const num = (i: number) => String(i + 1).padStart(2, "0");

/**
 * The projects as a deck of cards, one screen each. A card holds still at the top of the
 * screen while it is read, so it is the only project in view; scrolling on slides the next
 * card up over it, and the one underneath sinks back and dims as it is covered. Nothing is
 * taken from the scroll: the page moves exactly as far as you scroll it, the whole way. A
 * card taller than the screen (a phone) is read to its end before it holds. Details swaps a
 * card's short words for the full write-up in place, so a card never grows.
 * `onActive` hands the card on top to the page for its colour.
 */
export function ProjectDeck({ onActive }: { onActive: (e: Entry | null) => void }) {
  const cards = useRef<(HTMLElement | null)[]>([]);
  const titles = useRef<(HTMLSpanElement | null)[]>([]);
  const [top, setTop] = useState(-1);
  const [details, setDetails] = useState<number | null>(null);

  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const h = innerHeight;
      let cur = -1;
      cards.current.forEach((c, i) => {
        if (!c) return;
        /* hold where the card's bottom meets the screen's, or at the top if it fits */
        const stick = Math.min(0, h - c.offsetHeight);
        c.style.top = `${stick}px`;
        const r = c.getBoundingClientRect();
        if (r.top <= h * .5 && r.bottom > h * .5) cur = i;
        /* how far the next card has come up over this one */
        const next = cards.current[i + 1];
        const p = next ? Math.min(Math.max((h - next.getBoundingClientRect().top) / h, 0), 1) : 0;
        c.style.setProperty("--p", p.toFixed(3));
      });
      setTop(t => t === cur ? t : cur);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => { onActive(top < 0 ? null : WORK[top]); }, [top, onActive]);
  useEffect(() => () => onActive(null), [onActive]);

  /* the door into TrueLine's page: its name is lifted off the card and flown to its heading */
  const openTrueLine = (ev: MouseEvent<HTMLAnchorElement>) => {
    const i = WORK.findIndex(e => e.id === "p-trueline");
    const t = titles.current[i];
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0 || !t) return;
    ev.preventDefault();
    morphInto("/trueline/", t, cards.current[i]);
  };

  const figure = (e: Entry, i: number) => {
    if (e.demo === "trueline") return <TrueLine held={top !== i} />;
    if (e.demo === "clarity") return <Clarity held={top !== i} />;
    return <NistFigure on={top === i} />;
  };

  return (
    <div className="deck">
      {WORK.map((e, i) => {
        const det = details === i;
        return (
          <section key={e.id} id={e.id} className="dcard" ref={el => { cards.current[i] = el; }}
                   style={{ "--accent": e.accent, zIndex: i + 1 } as CSSProperties} aria-labelledby={`${e.id}-h`}>
            <div className="dcin">
              <div className="plate">{figure(e, i)}</div>
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
            </div>
          </section>
        );
      })}
    </div>
  );
}
