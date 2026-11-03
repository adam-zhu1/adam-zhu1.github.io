import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { A, out } from "../lib/router";
import { morphInto } from "../lib/morph";
import { prefersReducedMotion } from "../lib/useReveal";
import { useLiquidGlass } from "../lib/glass";
import { TrueLine } from "./TrueLine";
import { Clarity } from "./Clarity";
import { NistFigure } from "./ProjectStage";
import { WORK, type Entry } from "../data/work";

/* Where the stage pins: a real desktop window. Below this every project lies flat, one after
   another, its words and then its demo. */
const PIN = "(min-width: 64rem) and (min-height: 600px)";

function usePinned() {
  const [on, set] = useState(false);
  useEffect(() => {
    const mq = matchMedia(PIN);
    const read = () => set(mq.matches);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);
  return on;
}

function Links({ e, onTrueLine }: { e: Entry; onTrueLine?: (ev: MouseEvent<HTMLAnchorElement>) => void }) {
  if (!e.links?.length) return null;
  return (
    <div className="ctas">
      {e.links.map(l => l.page
        ? <A key={l.href} className="more" href={l.href} onClick={e.id === "p-trueline" ? onTrueLine : undefined}>{l.label}<i aria-hidden="true">&#8594;</i></A>
        : <a key={l.href} className="store" {...out} href={l.href}>{l.label}<i aria-hidden="true">&#8599;</i></a>)}
    </div>
  );
}

function Words({ e, title, onTrueLine }: { e: Entry; title?: (el: HTMLSpanElement | null) => void; onTrueLine?: (ev: MouseEvent<HTMLAnchorElement>) => void }) {
  return (
    <>
      <p className="wk">{e.kind} <span>· {e.when}</span></p>
      <h3><span ref={title}>{e.name}</span></h3>
      <p className="desc">{e.body}</p>
      {e.result && <p className="result">{e.result}</p>}
      {e.meta && <p className="meta">{e.meta}</p>}
      <Links e={e} onTrueLine={onTrueLine} />
    </>
  );
}

/**
 * The projects on one screen. The demo is the point, so it gets nearly all of it: a dark
 * stage the width of the page, the demo filling it, and the words in a card of glass laid
 * over its lower left corner, bending and blurring whatever runs beneath. Scrolling a screen
 * moves on a project: the stage lifts the old demo away and settles the next one in, and the
 * card's words change in place. Scrolling only decides which project is up; the change then
 * plays on its own, so nothing is tied to how fast you scroll. The pill at the foot names the
 * three and jumps to any of them. `onActive` hands the current one to the page for its colour.
 */
export function ProjectBand({ onActive }: { onActive: (e: Entry | null) => void }) {
  const pinned = usePinned();
  const stage = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const foot = useRef<HTMLDivElement>(null);
  const blocks = useRef<(HTMLElement | null)[]>([]);
  const titles = useRef<(HTMLSpanElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [near, setNear] = useState(false);
  useLiquidGlass(card, { scale: 44, bezel: 22, radius: 22, base: "blur(16px) saturate(1.6)", on: pinned });
  useLiquidGlass(foot, { scale: 26, bezel: 16, on: near && pinned });

  // pinned: which screen of the run you are in picks the project; the foot pill fills with it
  useEffect(() => {
    const el = stage.current;
    if (!el || !pinned) return;
    let raf = 0, last = -1;
    const read = () => {
      raf = 0;
      const run = el.offsetHeight - innerHeight;
      const u = Math.min(Math.max(-el.getBoundingClientRect().top, 0), run - 1) / (run / WORK.length);
      const i = Math.min(WORK.length - 1, Math.floor(u));
      foot.current?.style.setProperty("--f", (u - i).toFixed(3));
      if (i !== last) { last = i; setActive(i); }
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, [pinned]);

  // flat: whichever project owns the middle of the screen is the current one
  useEffect(() => {
    if (pinned) return;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
    }), { rootMargin: "-45% 0px -45% 0px" });
    stage.current?.querySelectorAll("[data-i]").forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [pinned]);

  // the foot pill shows only while the projects are on screen
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "-40% 0px -40% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [pinned]);

  useEffect(() => { onActive(near ? WORK[active] : null); }, [active, near, onActive]);

  const go = useCallback((i: number) => {
    const el = stage.current;
    if (!el) return;
    const smooth: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
    if (!pinned) { blocks.current[i]?.scrollIntoView({ behavior: smooth }); return; }
    const seg = (el.offsetHeight - innerHeight) / WORK.length;
    scrollTo({ top: el.getBoundingClientRect().top + scrollY + i * seg + seg * 0.05, behavior: smooth });
  }, [pinned]);

  /* the door into TrueLine's page: its name is lifted off the card and flown to its heading */
  const tl = WORK.findIndex(e => e.id === "p-trueline");
  const openTrueLine = (ev: MouseEvent<HTMLAnchorElement>) => {
    const t = titles.current[tl];
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0 || !t) return;
    ev.preventDefault();
    morphInto("/trueline/", t, pinned ? card.current : blocks.current[tl]);
  };

  const demo = (e: Entry, i: number) => {
    const held = pinned && active !== i;
    if (e.demo === "trueline") return <TrueLine held={held} />;
    if (e.demo === "clarity") return <Clarity held={held} />;
    return <NistFigure on={!pinned || active === i} />;
  };

  return (
    <>
      {pinned ? (
        <div className="show pinned" ref={stage} style={{ height: `calc(100svh + ${WORK.length * 100}svh)` }}>
          <div className="sstick">
            <div className="screen">
              {WORK.map((e, i) => (
                <div key={e.id} className={`slide${active === i ? " on" : i < active ? " past" : ""}`}
                     style={{ "--accent": e.accent } as CSSProperties} aria-hidden={active !== i} inert={active !== i}>
                  <i className="glow" aria-hidden="true" />
                  <div className={`sdemo ${e.demo}`}>{demo(e, i)}</div>
                </div>
              ))}
              <div className="card" ref={card}>
                {WORK.map((e, i) => (
                  <section key={e.id} id={e.id} className={active === i ? "on" : ""} style={{ "--accent": e.accent } as CSSProperties}
                           inert={active !== i} aria-hidden={active !== i}>
                    <Words e={e} title={el => { titles.current[i] = el; }} onTrueLine={openTrueLine} />
                  </section>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="show" ref={stage}>
          {WORK.map((e, i) => (
            <section key={e.id} id={e.id} data-i={i} className="flat" ref={el => { blocks.current[i] = el; }}
                     style={{ "--accent": e.accent } as CSSProperties}>
              <Words e={e} title={el => { titles.current[i] = el; }} onTrueLine={openTrueLine} />
              <div className="fdemo">{demo(e, i)}</div>
            </section>
          ))}
        </div>
      )}

      {pinned && (
        <nav className={`foot glass${near ? " on" : ""}`} ref={foot} inert={!near} aria-label="Projects">
          {WORK.map((e, i) => (
            <button key={e.id} type="button" className={active === i ? "on" : ""} aria-current={active === i || undefined}
                    style={{ "--c": e.accent } as CSSProperties} onClick={() => go(i)}>
              <i aria-hidden="true" />{e.name}
            </button>
          ))}
        </nav>
      )}
    </>
  );
}
