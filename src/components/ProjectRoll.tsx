import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { A, out } from "../lib/router";
import { morphInto } from "../lib/morph";
import { TrueLine } from "./TrueLine";
import { Clarity } from "./Clarity";
import { NistFigure } from "./ProjectStage";
import { WORK, type Entry } from "../data/work";
import { TitleArt, type ArtKind } from "./TitleArt";

/* draft switch while they are compared: the three project scenes by default; ?art=walks, tree, galton, nn, likelihood, donut or contour show the others */
const ART: ArtKind = (() => {
  const a = typeof location === "undefined" ? null : new URLSearchParams(location.search).get("art");
  const map: Record<string, ArtKind> = { walks: "walks", tree: "tree", galton: "galton", nn: "nn", likelihood: "descent", donut: "ascii", contour: "contour" };
  return (a && map[a]) || "trio";
})();

const num = (i: number) => String(i + 1).padStart(2, "0");
/* The stage holds N screens: the section's own title first, then one per project. In screen
   heights: how long a screen holds, and how long the change to the next takes. The scroll is
   locked to whole screens, so a reader rests in the middle of a hold and HOLD is only slack. */
const N = WORK.length + 1;
const HOLD = .2, MOVE = 1;
const SPAN = N * HOLD + (N - 1) * MOVE;
const clamp = (v: number) => Math.min(Math.max(v, 0), 1);
/* quick off the mark, soft landing: a move starts the moment you ask for it */
const ease = (t: number) => 1 - (1 - t) ** 3.2;
/* a page move starts at once (no slow wind-up after the swipe) and settles softly */
const glide = (t: number) => 1 - (1 - t) ** 2.4;
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

  /* while the title screen plays its three scenes, the track below fills the piece for the scene
     playing, in that project's colour, with no names: the screens after it say what each was */
  const cue = useCallback((i: number, p: number) => {
    track.current?.querySelectorAll<HTMLElement>("li").forEach((li, k) => li.style.setProperty("--cue", k === i ? p.toFixed(3) : "0"));
  }, []);
  useEffect(() => { if (top !== 0) track.current?.querySelectorAll<HTMLElement>("li").forEach(li => li.style.setProperty("--cue", "0")); }, [top]);
  useEffect(() => () => onActive(null), [onActive]);

  /* The scroll lock. Inside the stage a swipe, a wheel notch or a key moves exactly one screen,
     gliding there over a fixed time so every change plays whole; the page cannot be flung past
     a project. From the top of the page one move reaches the title; after the last project the
     next move carries the page onto More work, and scrolling back up from there returns to it.
     Inside More work and below, the page scrolls as normal. */
  useEffect(() => {
    const w = wrap.current;
    if (!w || flow) return;
    let anim = 0, busy = false;
    const geo = () => {
      const h = innerHeight, top = w.getBoundingClientRect().top + scrollY;
      const unit = (w.offsetHeight - h) / SPAN;
      const rests = Array.from({ length: N }, (_, s) => Math.round(top + rest(s) * unit));
      const head = document.querySelector<HTMLElement>("#more .sechead");
      const max = document.documentElement.scrollHeight - h;
      const exit = Math.min(head ? Math.round(head.getBoundingClientRect().top + scrollY - 136) : rests[N - 1] + h, max);
      return { h, rests, exit };
    };
    /* where one move in `dir` goes from here, or null to let the page scroll by itself */
    const target = (dir: 1 | -1) => {
      const { rests, exit } = geo(), y = scrollY;
      /* the top of the page counts as the first screen: from it one move reaches the title */
      const stops = [0, ...rests, exit];
      if (y > exit + 4) return null;
      if (dir > 0) return y >= exit - 4 ? null : stops.find(r => r > y + 4) ?? null;
      return y <= 4 ? null : [...stops].reverse().find(r => r < y - 4) ?? null;
    };
    /* a move queued by a fresh gesture that arrived while the last move was still gliding */
    let queued: 1 | -1 | 0 = 0;
    const go = (to: number) => {
      const from = scrollY, dist = Math.abs(to - from);
      /* a move that carries the whole page (onto the stage from the top, or off it to More work)
         runs a little longer and settles more softly; a move between projects, where the screen
         holds still, is quicker. Both start the moment the swipe lands */
      const { rests } = geo();
      const page = Math.min(from, to) < rests[0] - 4 || Math.max(from, to) > rests[N - 1] + 4;
      const dur = page ? 680 : Math.min(Math.max(320 + (dist / innerHeight) * 240, 420), 600);
      const curve = page ? glide : ease;
      const t0 = performance.now();
      busy = true;
      cancelAnimationFrame(anim);
      const tick = (t: number) => {
        const k = Math.min((t - t0) / dur, 1);
        scrollTo({ top: from + (to - from) * curve(k), behavior: "instant" });
        if (k < 1) { anim = requestAnimationFrame(tick); return; }
        busy = false;
        const q = queued; queued = 0;
        const next = q ? target(q) : null;
        if (next != null) go(next);
      };
      anim = requestAnimationFrame(tick);
    };
    /* a panel inside the stage that can still scroll that way (Details, a demo's log) keeps the wheel */
    const scrollsInside = (el: EventTarget | null, dir: number) => {
      for (let n = el as HTMLElement | null; n && n !== w; n = n.parentElement) {
        const o = getComputedStyle(n).overflowY;
        if ((o === "auto" || o === "scroll") && n.scrollHeight > n.clientHeight + 1)
          return dir > 0 ? n.scrollTop + n.clientHeight < n.scrollHeight - 1 : n.scrollTop > 0;
      }
      return false;
    };

    /* Telling one gesture from the next. A trackpad keeps sending a long, fading tail of
       momentum after the fingers lift; that tail belongs to the swipe that already moved the
       stage and must not move it again. A new gesture is a pause, a change of direction, or,
       once the glide is over, deltas that climb again out of a fading tail. */
    let lastT = 0, lastSign = 0, used = false;
    const hist: number[] = [];
    const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / Math.max(a.length, 1);
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      const d = e.deltaY, abs = Math.abs(d), dir = d > 0 ? 1 : -1, now = performance.now();
      const gap = now - lastT;
      hist.push(abs); if (hist.length > 8) hist.shift();
      const rising = !busy && hist.length >= 6 && abs > 6 && mean(hist.slice(-2)) > mean(hist.slice(0, -2)) * 1.6 + 2;
      const fresh = gap > 110 || dir !== lastSign || rising;
      if (gap > 110 || dir !== lastSign) hist.length = 0, hist.push(abs);
      lastT = now; lastSign = dir;
      if (fresh) used = false;
      if (scrollsInside(e.target, dir)) return;
      if (busy) {
        e.preventDefault();
        if (fresh && !used) { queued = dir; used = true; }
        return;
      }
      const to = target(dir);
      if (to == null) {
        /* the coasting tail of a swipe that just landed on More work (or on the title) stops there */
        if (used) e.preventDefault();
        return;
      }
      e.preventDefault();
      /* the first event of a gesture inside the stage moves it, even one already under way when it arrived */
      if (!used && abs >= 1) { used = true; go(to); }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      const k = e.key;
      const dir = k === "ArrowDown" || k === "PageDown" || (k === " " && !e.shiftKey) ? 1
        : k === "ArrowUp" || k === "PageUp" || (k === " " && e.shiftKey) ? -1 : 0;
      if (!dir || (k === " " && t.closest("button, a"))) return;
      if (scrollsInside(t, dir)) return;
      if (busy) { e.preventDefault(); return; }
      const to = target(dir as 1 | -1);
      if (to == null) return;
      e.preventDefault();
      go(to);
    };
    /* a wide touch screen: a swipe is one move, decided when the finger lifts */
    let y0 = 0, moveTo: number | null = null;
    const onTouchStart = (e: TouchEvent) => { y0 = e.touches[0].clientY; moveTo = null; };
    const onTouchMove = (e: TouchEvent) => {
      const dy = y0 - e.touches[0].clientY;
      if (Math.abs(dy) < 6) return;
      const dir = dy > 0 ? 1 : -1;
      if (scrollsInside(e.target, dir)) return;
      if (busy) { e.preventDefault(); return; }
      const to = target(dir);
      if (to == null) return;
      e.preventDefault();
      moveTo = Math.abs(dy) > 36 ? to : null;
    };
    const onTouchEnd = () => { if (moveTo != null && !busy) go(moveTo); moveTo = null; };

    addEventListener("wheel", onWheel, { passive: false });
    addEventListener("keydown", onKey);
    addEventListener("touchstart", onTouchStart, { passive: true });
    addEventListener("touchmove", onTouchMove, { passive: false });
    addEventListener("touchend", onTouchEnd);
    return () => {
      cancelAnimationFrame(anim);
      removeEventListener("wheel", onWheel);
      removeEventListener("keydown", onKey);
      removeEventListener("touchstart", onTouchStart);
      removeEventListener("touchmove", onTouchMove);
      removeEventListener("touchend", onTouchEnd);
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
            <div className="pin">
              <div className="pvtext">
                <div className="pvsum">
                  <p className="rlab" aria-hidden="true"><Roll text={`${WORK.length} projects`} /></p>
                  <h2 aria-label="Projects"><Roll text="Projects" /></h2>
                  <p className="rwhat pcue" aria-hidden="true"><span className="rline"><i />Scroll</span></p>
                </div>
              </div>
              {/* something to look at while the title is read; it gives nothing away about the projects */}
              <div className="tartwrap"><TitleArt kind={ART} on={top === 0} onScene={cue} /></div>
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
