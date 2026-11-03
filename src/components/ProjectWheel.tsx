import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { A, out } from "../lib/router";
import { morphInto } from "../lib/morph";
import { prefersReducedMotion } from "../lib/useReveal";
import { useLiquidGlass } from "../lib/glass";
import { TrueLine } from "./TrueLine";
import { Clarity } from "./Clarity";
import { NistFigure } from "./ProjectStage";
import { WORK, type Entry } from "../data/work";

/* Where the wheel pins: a real desktop window. Below this every entry lies flat, one after
   another, each with its demo or its figure under it. */
const PIN = "(min-width: 64rem) and (min-height: 600px)";
/* how much scroll each entry holds the wheel for, in screen heights: a demo needs time to
   play; a figure is read at a glance */
const HOLD = (e: Entry) => (e.demo ? 1.15 : 0.6);
const SP = 19;            // degrees between neighbours on the rim
const C = 500, R = 468;   // the wheel, in its own 1000 unit square

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

/** The name decodes itself when its entry comes round: letters run through noise and settle
    left to right, as if read off the wheel. Spaces and the length hold still, so it never jumps. */
function scramble(el: HTMLElement, text: string) {
  if (prefersReducedMotion()) { el.textContent = text; return () => {}; }
  const N = "abcdefghijklmnopqrstuvwxyz0123456789";
  const t0 = performance.now(), dur = 420 + text.length * 18;
  let raf = 0;
  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / dur);
    const fixed = Math.floor(k * text.length);
    el.textContent = [...text].map((ch, i) => (i < fixed || ch === " " ? ch : N[(Math.random() * N.length) | 0])).join("");
    if (k < 1) raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
  return () => { cancelAnimationFrame(raf); el.textContent = text; };
}

/** A figure for the entries with no demo: their own number, set as large as the page allows. */
function BigFigure({ e, on }: { e: Entry; on: boolean }) {
  return (
    <div className={`wbig${on ? " on" : ""}`}>
      {e.big?.map(([v, l], i) => (
        <div key={l} className={i ? "two" : "one"} style={{ "--d": i, "--len": Math.max(v.length, 2) } as CSSProperties}>
          <b>{v}</b><span>{l}</span>
        </div>
      ))}
    </div>
  );
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

/**
 * The work as a wheel. Everything sits on one rim in the order it happened, newest first,
 * and scrolling turns the rim so each entry in turn comes round to the lens at its edge;
 * the one in the lens opens beside it, its words and then its demo or figure. A pill at the
 * foot of the screen trades the wheel for a plain list and back, for when you would rather
 * read the whole thing at once. `onActive` hands the current entry to the page for its colour.
 */
export function ProjectWheel({ onActive }: { onActive: (e: Entry | null) => void }) {
  const pinned = usePinned();
  const [mode, setMode] = useState<"wheel" | "list">("wheel");
  const wheel = pinned && mode === "wheel";
  const stage = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGSVGElement>(null);
  const lens = useRef<HTMLDivElement>(null);
  const foot = useRef<HTMLDivElement>(null);
  const names = useRef<(HTMLSpanElement | null)[]>([]);
  const blocks = useRef<(HTMLElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [near, setNear] = useState(false);
  useLiquidGlass(lens, { kind: "lens", scale: 46, base: "saturate(1.4) brightness(1.06)", on: wheel });
  useLiquidGlass(foot, { scale: 26, bezel: 16, on: near });

  /* where each entry's hold begins, in screen heights from the top of the stage */
  const cum = useMemo(() => WORK.reduce<number[]>((a, e, i) => (a.push(i ? a[i - 1] + HOLD(WORK[i - 1]) : 0), a), []), []);
  const total = cum[cum.length - 1] + HOLD(WORK[WORK.length - 1]);

  /* the rim's ticks, one every 2.5 degrees with the long ones on the entries, and a mark
     where the year turns over */
  const years = useMemo(() => WORK.flatMap((e, i) => i && WORK[i - 1].year !== e.year ? [{ at: i - 0.5, y: WORK[i - 1].year }] : []), []);

  // the turn: scroll position to the rim's angle, every frame, written straight to the SVG
  useEffect(() => {
    const el = stage.current, svg = ringRef.current;
    if (!el || !svg || !wheel) return;
    const nodes = [...svg.querySelectorAll<SVGGElement>(".node")];
    const marks = [...svg.querySelectorAll<SVGGElement>(".yr")];
    const ticks = svg.querySelector<SVGGElement>(".ticks");
    const now = svg.querySelector<SVGGElement>(".now");
    let raf = 0, last = -1;
    const place = (g: SVGGElement, at: number, r: number) => {
      const a = (at * SP) * Math.PI / 180;
      g.setAttribute("transform", `translate(${(C + Math.cos(a) * r).toFixed(1)} ${(C + Math.sin(a) * r).toFixed(1)})`);
    };
    const read = () => {
      raf = 0;
      const vh = innerHeight / 100;
      const s = Math.min(Math.max(-el.getBoundingClientRect().top, 0), total * 100 * vh - 1);
      const u = s / (100 * vh);
      let i = 0; while (i < WORK.length - 1 && u >= cum[i + 1]) i++;
      const f = (u - cum[i]) / HOLD(WORK[i]);
      /* the rim rests while an entry is read, then turns to the next over the last third */
      const q = Math.min(1, Math.max(0, (f - 0.66) / 0.34));
      const ease = prefersReducedMotion() ? (q < 1 ? 0 : 1) : q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
      const r = Math.min(WORK.length - 1, i + (i < WORK.length - 1 ? ease : 0));
      nodes.forEach((g, j) => {
        place(g, j - r, R);
        const d = Math.abs(j - r);
        g.style.opacity = String(Math.max(0, 1 - Math.max(0, d - 1.2) * 0.26));
        g.classList.toggle("cur", d < 0.5);
      });
      marks.forEach(g => place(g, Number(g.dataset.at) - r, R));
      if (now) place(now, -1.1 - r, R);
      ticks?.setAttribute("transform", `rotate(${(-r * SP).toFixed(2)} ${C} ${C})`);
      el.style.setProperty("--hold", f.toFixed(3));
      const k = Math.round(r);
      if (k !== last) { last = k; setActive(k); }
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, [wheel, cum, total]);

  // flat: whichever entry owns the middle of the screen is the current one
  useEffect(() => {
    if (wheel) return;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
    }), { rootMargin: "-45% 0px -45% 0px" });
    stage.current?.querySelectorAll("[data-i]").forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [wheel, mode]);

  // the foot pill shows only while the work is on screen
  useEffect(() => {
    const el = stage.current?.parentElement;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "-30% 0px -30% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => { onActive(near ? WORK[active] : null); }, [active, near, onActive]);

  // the name decodes as its entry arrives
  useLayoutEffect(() => {
    if (!wheel) return;
    const el = names.current[active];
    return el ? scramble(el, WORK[active].name) : undefined;
  }, [active, wheel]);

  const go = useCallback((i: number) => {
    const el = stage.current;
    const smooth: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
    if (!el) return;
    if (!wheel) { blocks.current[i]?.scrollIntoView({ behavior: smooth }); return; }
    scrollTo({ top: el.getBoundingClientRect().top + scrollY + (cum[i] + HOLD(WORK[i]) * 0.1) * innerHeight, behavior: smooth });
  }, [wheel, cum]);

  /* a row in the list opens that entry on the wheel */
  const [pending, setPending] = useState<number | null>(null);
  useEffect(() => {
    if (pending == null || mode !== "wheel") return;
    const t = requestAnimationFrame(() => { go(pending); setPending(null); });
    return () => cancelAnimationFrame(t);
  }, [pending, mode, go]);
  const openFromList = (i: number) => {
    if (!pinned) { blocks.current[i]?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" }); return; }
    setMode("wheel"); setPending(i);
  };

  /* the door into TrueLine's page: the name is lifted off the wheel and flown to its heading */
  const tl = WORK.findIndex(e => e.id === "p-trueline");
  const openTrueLine = (ev: MouseEvent<HTMLAnchorElement>) => {
    const t = names.current[tl];
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0 || !t) return;
    ev.preventDefault();
    morphInto("/trueline/", t, blocks.current[tl]);
  };

  const demo = (e: Entry, i: number) => {
    const held = wheel && active !== i;
    if (e.demo === "trueline") return <TrueLine held={held} />;
    if (e.demo === "clarity") return <Clarity held={held} />;
    if (e.demo === "nist") return <NistFigure on={!wheel || active === i} />;
    return <BigFigure e={e} on={!wheel || active === i} />;
  };

  const cur = WORK[active];

  return (
    <>
      {mode === "list" && pinned ? (
        <ol className="wlist" ref={stage as unknown as React.RefObject<HTMLOListElement>}>
          {WORK.map((e, i) => (
            <li key={e.id} style={{ "--c": e.accent, "--i": i } as CSSProperties}>
              <button type="button" onClick={() => openFromList(i)}>
                <span className="y">{WORK[i - 1]?.year === e.year ? "" : e.year}</span>
                <span className="n"><i />{e.name}</span>
                <span className="k">{e.kind}</span>
                <span className="w">{e.when}</span>
                <span className="go" aria-hidden="true">&#8594;</span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <div className={`wstage${wheel ? " pinned" : ""}`} ref={stage}
             style={wheel ? { height: `calc(100svh + ${total * 100}svh)` } : undefined}>
          <div className="wstick">
            {wheel && (
              <div className="wring" aria-hidden="true">
                <svg ref={ringRef} viewBox="0 0 1000 1000">
                  <circle className="rim" cx={C} cy={C} r={R} />
                  <circle className="rim in" cx={C} cy={C} r={R - 46} />
                  <g className="ticks">
                    {Array.from({ length: 144 }, (_, k) => {
                      const a = (k * 2.5) * Math.PI / 180, long = k % 4 === 0;
                      return <line key={k} x1={C + Math.cos(a) * (R - 10)} y1={C + Math.sin(a) * (R - 10)}
                                   x2={C + Math.cos(a) * (R - (long ? 26 : 18))} y2={C + Math.sin(a) * (R - (long ? 26 : 18))}
                                   className={long ? "long" : undefined} />;
                    })}
                  </g>
                  <g className="now"><circle r="7" /><text x="-22" y="5">Now</text></g>
                  {years.map(y => (
                    <g className="yr" key={y.y} data-at={y.at}>
                      <circle r="4" />
                      <text x="-26" y="6">{y.y}</text>
                    </g>
                  ))}
                  {WORK.map((e, i) => (
                    <g className={`node${e.demo ? " big" : ""}`} key={e.id} style={{ "--c": e.accent } as CSSProperties}
                       onClick={() => go(i)}>
                      <circle className="hit" r="26" />
                      <circle className="dot" r={e.demo ? 9 : 6} />
                      <text x="-52" y="7">{e.short ?? e.name}</text>
                    </g>
                  ))}
                </svg>
                <div className="lens" ref={lens} style={{ "--c": cur.accent } as CSSProperties} />
              </div>
            )}
            <ol className="wtext">
              {WORK.map((e, i) => (
                <li key={e.id} id={e.id} data-i={i} ref={el => { blocks.current[i] = el; }}
                    className={`${active === i ? "on" : ""}${e.demo ? " feat" : ""}`}
                    style={{ "--accent": e.accent } as CSSProperties} inert={wheel && active !== i}>
                  <p className="wk">{e.kind} <span>· {e.when}</span></p>
                  <h3><span ref={el => { names.current[i] = el; }}>{e.name}</span></h3>
                  <p className="desc">{e.body}</p>
                  {e.meta && <p className="meta">{e.meta}</p>}
                  {e.result && <p className="result">{e.result}</p>}
                  <Links e={e} onTrueLine={openTrueLine} />
                  {!wheel && <div className="wflat">{demo(e, i)}</div>}
                </li>
              ))}
            </ol>
            {wheel && (
              <div className="wmedia">
                {WORK.map((e, i) => (
                  <div key={e.id} className={`layer${active === i ? " on" : ""}`}
                       style={{ "--accent": e.accent } as CSSProperties} aria-hidden={active !== i}>
                    {demo(e, i)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {pinned && (
        <div className={`foot glass${near ? " on" : ""}`} ref={foot} inert={!near}>
          <div className="seg" role="radiogroup" aria-label="Show the work as">
            {(["wheel", "list"] as const).map(m => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? "on" : ""}
                      onClick={() => { setMode(m); if (m === "list") stage.current?.parentElement?.scrollIntoView({ behavior: "auto" }); }}>
                {m === "wheel" ? "Wheel" : "List"}
              </button>
            ))}
          </div>
          {mode === "wheel" && (
            <span className="where" style={{ "--c": cur.accent } as CSSProperties}>
              <i /><b key={cur.id}>{cur.name}</b><em>{cur.when}</em>
            </span>
          )}
        </div>
      )}
    </>
  );
}
