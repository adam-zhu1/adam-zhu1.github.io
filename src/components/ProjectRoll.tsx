import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { A, out } from "../lib/router";
import { morphInto } from "../lib/morph";
import { TrueLine } from "./TrueLine";
import { Clarity } from "./Clarity";
import { NistFigure } from "./ProjectStage";
import { WORK, type Entry } from "../data/work";

const num = (i: number) => String(i + 1).padStart(2, "0");
/* The stage holds N screens: the section's own title first, then one per project. In screen
   heights: how long a screen holds, and how long the change to the next takes. The hold is long
   enough that a normal scroll lands on each project rather than sailing past it. */
const N = WORK.length + 1;
const HOLD = .45, MOVE = 1;
const SPAN = N * HOLD + (N - 1) * MOVE;
const clamp = (v: number) => Math.min(Math.max(v, 0), 1);
/* where screen s rests, in screen heights from the top of the stage */
const rest = (s: number) => s * (HOLD + MOVE) + HOLD / 2;

/** Text that rolls through a slot a letter at a time, like a departure board. */
function Roll({ text, className }: { text: string; className?: string }) {
  const n = Math.max(text.length - 1, 1);
  return (
    <span className={`roll${className ? ` ${className}` : ""}`} aria-hidden="true">
      {[...text].map((c, k) => <span key={k} style={{ "--k": (k / n).toFixed(3) } as CSSProperties}>{c === " " ? " " : c}</span>)}
    </span>
  );
}

/**
 * The projects one screen at a time, and the screen never moves. Scrolling on rolls the
 * project's name up out of its slot a letter at a time while the next name rolls up into it,
 * and the demo dissolves into the next one, every step of it tied to the scroll and run back
 * if you scroll back. A phone, or a reader who asks for less motion, gets the three as plain
 * screens in a row. `onActive` hands the project in view to the page for its colour.
 */
export function ProjectRoll({ onActive }: { onActive: (e: Entry | null) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const slides = useRef<(HTMLElement | null)[]>([]);
  const titles = useRef<(HTMLSpanElement | null)[]>([]);
  const track = useRef<HTMLOListElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(-1);
  const [details, setDetails] = useState<number | null>(null);
  const [flow, setFlow] = useState(false);

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
      /* how far each project has come in over the one before it */
      /* the title rolls in as the stage rises into view, so the section arrives the way its projects do */
      const enter = clamp((h * .85 - r.top) / (h * .6));
      const into = Array.from({ length: N }, (_, i) => i === 0 ? enter : clamp((y - (i * HOLD + (i - 1) * MOVE) * unit) / (MOVE * unit)));
      slides.current.forEach((s, i) => {
        if (!s) return;
        s.style.setProperty("--r", into[i].toFixed(4));
        s.style.setProperty("--o", (into[i + 1] ?? 0).toFixed(4));
      });
      /* each piece of the track fills as its project is read, and hands on as the next comes in */
      track.current?.querySelectorAll<HTMLElement>("li").forEach((li, p) => {
        const i = p + 1, from = (i * HOLD + (i - 1) * MOVE) * unit, len = (i === N - 1 ? MOVE + HOLD / 2 : MOVE + HOLD) * unit;
        li.style.setProperty("--f", clamp((y - from) / len).toFixed(4));
      });
      /* past the last screen the stage dissolves as it leaves, handing the page to More work */
      stage.current?.style.setProperty("--x", clamp((y - SPAN * unit) / (h * .55)).toFixed(4));
      const seen = r.top < h * .5 && r.bottom > h * .5;
      const cur = seen ? into.reduce((n, a, i) => a >= .5 ? i : n, 0) : -1;
      setTop(t => t === cur ? t : cur);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, [flow]);

  useEffect(() => { onActive(top < 1 ? null : WORK[top - 1]); setDetails(null); }, [top, onActive]);

  useEffect(() => () => onActive(null), [onActive]);

  /* No scroll lock: the page scrolls natively, with the trackpad's own momentum, and every
     change on the stage follows the scroll position. A light settle: once the scroll has fully
     stopped (momentum included), a page left between two projects finishes the change in the
     direction you were going (or, if you barely moved, drifts back), so no screen is left
     half-rolled. Any new input cancels the settle at once; above and below the stage nothing settles. */
  useEffect(() => {
    const w = wrap.current;
    if (!w || flow || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let idle = 0, anim = 0, down = false, lastY = scrollY, dir = 1;
    const stop = () => { cancelAnimationFrame(anim); anim = 0; };
    const settle = () => {
      if (down) return;
      const h = innerHeight, top = w.getBoundingClientRect().top + scrollY, y = scrollY;
      const rests = Array.from({ length: N }, (_, s) => top + rest(s) * h);
      if (y > rests[N - 1] + 2) return;
      let to: number;
      if (y < rests[0]) {
        /* between the hero and the title: only a stop already close to the title settles */
        if (rests[0] - y > h * .2) return;
        to = rests[0];
      } else {
        const i = rests.findIndex(r => r > y);
        const a = rests[i - 1], b = rests[i];
        if (b == null) return;
        const p = (y - a) / (b - a);
        to = dir > 0 ? (p > .18 ? b : a) : (p < .82 ? a : b);
      }
      const d = to - y;
      if (Math.abs(d) < 2) return;
      const t0 = performance.now(), dur = Math.min(260 + Math.abs(d) * .45, 650);
      const tick = (t: number) => {
        const k = Math.min((t - t0) / dur, 1);
        scrollTo({ top: y + d * (1 - (1 - k) ** 3), behavior: "instant" });
        anim = k < 1 ? requestAnimationFrame(tick) : 0;
      };
      anim = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      if (anim) return;
      const y = scrollY; if (y !== lastY) dir = y > lastY ? 1 : -1; lastY = y;
      clearTimeout(idle); idle = window.setTimeout(settle, 180);
    };
    const onInput = () => { stop(); clearTimeout(idle); };
    const onDown = () => { down = true; onInput(); };
    const onUp = () => { down = false; onScroll(); };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("wheel", onInput, { passive: true });
    addEventListener("keydown", onInput);
    addEventListener("touchstart", onDown, { passive: true });
    addEventListener("touchend", onUp);
    return () => {
      stop(); clearTimeout(idle);
      removeEventListener("scroll", onScroll); removeEventListener("wheel", onInput); removeEventListener("keydown", onInput);
      removeEventListener("touchstart", onDown); removeEventListener("touchend", onUp);
    };
  }, [flow]);

  /* the door into TrueLine's page: its name is lifted off the screen and flown to its heading */
  const openTrueLine = (ev: MouseEvent<HTMLAnchorElement>) => {
    const i = WORK.findIndex(e => e.id === "p-trueline");
    const t = titles.current[i];
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button !== 0 || !t) return;
    ev.preventDefault();
    morphInto("/trueline/", t, slides.current[i + 1]);
  };

  const figure = (e: Entry, i: number) => {
    if (e.demo === "trueline") return <TrueLine held={top !== i + 1} />;
    if (e.demo === "clarity") return <Clarity held={top !== i + 1} />;
    return <NistFigure on={top === i + 1} />;
  };

  return (
    <div className={`pwrap proll${flow ? " flow" : ""}`} ref={wrap} style={flow ? undefined : { height: `${(SPAN + 1) * 100}svh` }}>
      {/* where each project starts, for links and the bar's track; the screen itself never moves */}
      {!flow && WORK.map((e, i) => (
        <span key={e.id} id={e.id} className="pmark" aria-hidden="true"
              style={{ top: `${rest(i + 1) * 100}svh`, height: `${(i === WORK.length - 1 ? 1 : HOLD + MOVE) * 100}svh` }} />
      ))}
      <div className="pstage" ref={stage}>
        {!flow && (
          <section className="pslide ptitle" ref={el => { slides.current[0] = el; }} style={{ zIndex: 1 }} aria-label="Projects" inert={top > 0}>
            {/* the section's name, as big as the page's own name, rolling out letter by letter as TrueLine rolls in */}
            <div className="ptbox">
              <p className="rlab" aria-hidden="true"><Roll text={`${WORK.length} projects`} /></p>
              <h2 className="mega" aria-label="Projects"><Roll text="Projects" /></h2>
              <p className="rwhat pcue" aria-hidden="true"><span className="rline"><i />Scroll</span></p>
            </div>
          </section>
        )}
        {WORK.map((e, i) => {
          const det = details === i;
          return (
            <section key={e.id} id={flow ? e.id : undefined} className={`pslide${i === 0 ? " first" : ""}`} ref={el => { slides.current[i + 1] = el; }}
                     style={{ "--accent": e.accent, zIndex: i + 2 } as CSSProperties} aria-labelledby={`${e.id}-h`}
                     inert={!flow && top >= 0 && top !== i + 1}>
              <div className="pin">
                <div className={`pvtext${det ? " det" : ""}`}>
                  <div className="pvsum" inert={det}>
                    <p className="rlab"><Roll text={num(i)} className="rnum" /><Roll text={e.kind} /></p>
                    <h3 id={`${e.id}-h`} aria-label={e.name}><span ref={el => { titles.current[i] = el; }}><Roll text={e.name} /></span></h3>
                    <p className="rwhat"><span className="rline">{e.what}</span></p>
                    <div className="rlinks">
                      <button type="button" className="rmore" onClick={() => setDetails(i)}>Details<b aria-hidden="true">&#8594;</b></button>
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
                    {e.links && (
                      <div className="rowlinks">
                        {e.links.map(l => l.page
                          ? <A key={l.href} href={l.href} onClick={e.id === "p-trueline" ? openTrueLine : undefined}>{l.label}<b aria-hidden="true">&#8594;</b></A>
                          : <a key={l.href} {...out} href={l.href}>{l.label}<b aria-hidden="true">&#8599;</b></a>)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="plate">{figure(e, i)}</div>
              </div>
            </section>
          );
        })}
        {!flow && (
          <ol className={`rtrack${top < 1 ? " pre" : ""}`} ref={track} aria-hidden="true">
            {WORK.map((e, i) => <li key={e.id} className={top === i + 1 ? "on" : ""} style={{ "--accent": e.accent } as CSSProperties}><span>{e.name}</span></li>)}
          </ol>
        )}
      </div>
    </div>
  );
}
