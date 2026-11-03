import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { A, out } from "../lib/router";
import { morphInto } from "../lib/morph";
import { prefersReducedMotion } from "../lib/useReveal";
import { useLiquidGlass } from "../lib/glass";
import { TrueLine } from "./TrueLine";
import { Clarity } from "./Clarity";
import { NistFigure } from "./ProjectStage";
import { WORK, type Entry } from "../data/work";

/* Where the band pins: a real desktop window. Below this every project lies flat, one after
   another, each with its demo under it. */
const PIN = "(min-width: 64rem) and (min-height: 600px)";
/* how much scroll each project holds the screen for, in screen heights, and the point in
   that hold where the page settles if you let go nearby */
const HOLD = 1.25;
const REST = 0.2;

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

/** The demo's frame: a pane of glass round it, which bends the name passing behind. Only the
    open project's pane is live; the others are plain until they come round. */
function Pane({ on, kind, children }: { on: boolean; kind: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLiquidGlass(ref, { scale: 60, bezel: 26, radius: 26, base: "saturate(1.5) brightness(1.04)", on });
  return <div className={`pane ${kind}`} ref={ref}>{children}</div>;
}

/**
 * The projects as one band across the screen. Each project's name runs behind everything,
 * wider than the window and in its own colour; its words sit on the left and its demo floats
 * in a pane of glass on the right, bending the letters that pass behind the pane's rim.
 * Scrolling slides the band: the name drifts while you read, then carries on out to the left
 * as the next one comes in from the right. Let go near a project and the page settles on it.
 * The pill at the foot names the three and fills the one you are in; any of them jumps there.
 * `onActive` hands the current project to the page for its colour.
 */
export function ProjectBand({ onActive }: { onActive: (e: Entry | null) => void }) {
  const pinned = usePinned();
  const stage = useRef<HTMLDivElement>(null);
  const foot = useRef<HTMLDivElement>(null);
  const scenes = useRef<(HTMLElement | null)[]>([]);
  const titles = useRef<(HTMLSpanElement | null)[]>([]);
  const bigs = useRef<(HTMLSpanElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [near, setNear] = useState(false);
  useLiquidGlass(foot, { scale: 26, bezel: 16, on: near && pinned });

  const total = WORK.length * HOLD;
  const rests = useMemo(() => WORK.map((_, i) => (i + REST) * HOLD), []);

  // the slide: scroll position to each scene's offset from centre, written straight to the DOM
  useEffect(() => {
    const el = stage.current;
    if (!el || !pinned) return;
    let raf = 0, last = -1;
    const read = () => {
      raf = 0;
      const vh = innerHeight / 100;
      const s = Math.min(Math.max(-el.getBoundingClientRect().top, 0), total * 100 * vh - 1);
      const u = s / (100 * vh);
      const i = Math.min(WORK.length - 1, Math.floor(u / HOLD));
      const f = (u - i * HOLD) / HOLD;
      /* each project holds while it is read, then hands over across the last third */
      const q = Math.min(1, Math.max(0, (f - 0.64) / 0.36));
      const ease = prefersReducedMotion() ? (q < 1 ? 0 : 1) : q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
      const r = Math.min(WORK.length - 1, i + (i < WORK.length - 1 ? ease : 0));
      scenes.current.forEach((sc, j) => {
        if (!sc) return;
        const x = j - r;
        sc.style.setProperty("--x", x.toFixed(4));
        /* the name keeps drifting while its project is read, so the band never looks parked */
        sc.style.setProperty("--drift", (j === i ? Math.min(f, .64) / .64 : x < 0 ? 1 : 0).toFixed(4));
        const o = Math.max(0, 1 - Math.abs(x) * 2.2);
        /* opacity only when it is under 1: anything less starts a new backdrop and the pane
           inside would lose the name it bends */
        sc.style.opacity = o >= 1 ? "" : o.toFixed(3);
        sc.style.visibility = Math.abs(x) >= 1 ? "hidden" : "";
      });
      el.style.setProperty("--hold", f.toFixed(3));
      foot.current?.style.setProperty("--f", f.toFixed(3));
      const k = Math.round(r);
      if (k !== last) { last = k; setActive(k); }
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, [pinned, total]);

  // flat: whichever project owns the middle of the screen is the current one
  useEffect(() => {
    if (pinned) return;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
    }), { rootMargin: "-45% 0px -45% 0px" });
    stage.current?.querySelectorAll("[data-i]").forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [pinned]);

  // the foot pill shows only while the band is on screen
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "-40% 0px -40% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => { onActive(near ? WORK[active] : null); }, [active, near, onActive]);

  /* letting go near a project settles on it: the page snaps loosely, only while the band is
     pinned, to a mark at the start of each project's hold */
  useEffect(() => {
    if (!pinned || prefersReducedMotion()) return;
    const html = document.documentElement;
    html.classList.add("snapband");
    return () => html.classList.remove("snapband");
  }, [pinned]);

  const go = useCallback((i: number) => {
    const el = stage.current;
    if (!el) return;
    const smooth: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
    if (!pinned) { scenes.current[i]?.scrollIntoView({ behavior: smooth }); return; }
    scrollTo({ top: el.getBoundingClientRect().top + scrollY + rests[i] * innerHeight, behavior: smooth });
  }, [pinned, rests]);

  /* the door into TrueLine's page: its name is lifted off the band (the big one, when the
     band is pinned) and flown to its heading */
  const tl = WORK.findIndex(e => e.id === "p-trueline");
  const openTrueLine = (ev: MouseEvent<HTMLAnchorElement>) => {
    const t = (pinned ? bigs : titles).current[tl];
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0 || !t) return;
    ev.preventDefault();
    morphInto("/trueline/", t, scenes.current[tl]?.querySelector(".words") as HTMLElement | null);
  };

  const demo = (e: Entry, i: number) => {
    const held = pinned && active !== i;
    if (e.demo === "trueline") return <TrueLine held={held} />;
    if (e.demo === "clarity") return <Clarity held={held} />;
    return <NistFigure on={!pinned || active === i} />;
  };

  return (
    <>
      <div className={`band${pinned ? " pinned" : ""}`} ref={stage}
           style={pinned ? { height: `calc(100svh + ${total * 100}svh)` } : undefined}>
        {pinned && rests.map((r, i) => <i key={i} className="snap" style={{ top: `${r * 100}svh` }} aria-hidden="true" />)}
        <div className="bstick">
          {WORK.map((e, i) => (
            <section key={e.id} id={e.id} data-i={i} ref={el => { scenes.current[i] = el; }}
                     className={`scene${active === i ? " on" : ""}`} style={{ "--accent": e.accent, "--c": e.accent } as CSSProperties}
                     inert={pinned && active !== i} aria-labelledby={`${e.id}-h`}>
              <div className="bigname" aria-hidden="true"><span ref={el => { bigs.current[i] = el; }}>{e.name}</span></div>
              <div className="sgrid">
                <div className="words">
                  <p className="wk">{e.kind} <span>· {e.when}</span></p>
                  <h3 id={`${e.id}-h`}><span ref={el => { titles.current[i] = el; }}>{e.name}</span></h3>
                  <p className="desc">{e.body}</p>
                  {e.meta && <p className="meta">{e.meta}</p>}
                  {e.result && <p className="result">{e.result}</p>}
                  <Links e={e} onTrueLine={openTrueLine} />
                </div>
                <div className="media">
                  {pinned ? <Pane on={active === i} kind={e.demo}>{demo(e, i)}</Pane> : demo(e, i)}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>

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
