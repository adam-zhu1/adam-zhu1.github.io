import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { WORK, type Entry } from "../data/work";
import { MORE } from "../components/MoreWork";
import { out } from "../lib/router";
import { setTheme, useTheme } from "../lib/theme";
import { Dots } from "./Dots";
import { seenRecently } from "./seen";
import { flow, reach, scene, TITLE } from "./scene";
import { TrueLine } from "../components/TrueLine";
import { Clarity } from "../components/Clarity";
import { NistFigure } from "../components/ProjectStage";
import { LINKS } from "./links";

/**
 * Draft. Home is two things: a first screen that says who this is (the name over the dot
 * object, the school, the major, four links, and the three projects along the bottom), and
 * the projects as full-size cards that stack over one another as the page scrolls. Each
 * project then has a page of its own, in its own colour: its card grows into the page
 * (?concept=studio&p=trueline). Scrolling is smoothed; the first screen recedes under the
 * rest of the page.
 */

const MAIL = LINKS[0].href.replace("mailto:", "");
const d = (i: number) => ({ "--d": `${i * 70}ms` }) as CSSProperties;
const slug = (w: Entry) => w.id.replace(/^p-/, "");
const two = (n: number) => String(n).padStart(2, "0");
const readPage = () => typeof location === "undefined" ? null : new URLSearchParams(location.search).get("p");

const ICON: Record<string, ReactNode> = {
  Resume: <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 1.5h6l3 3v10h-9z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M5.6 7.5h4.8M5.6 9.8h4.8M5.6 12.1h3" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>,
  LinkedIn: <svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M2 5.6h2.5V14H2zM3.25 1.8a1.45 1.45 0 1 1 0 2.9 1.45 1.45 0 0 1 0-2.9zM6.3 5.6h2.4v1.15c.4-.75 1.3-1.35 2.55-1.35 2.3 0 2.75 1.5 2.75 3.5V14h-2.5V9.4c0-.95-.2-1.75-1.25-1.75S8.8 8.4 8.8 9.4V14H6.3z" /></svg>,
  GitHub: <svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" /></svg>,
  Email: <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.6" y="3.2" width="12.8" height="9.6" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.3" /><path d="m2.2 4.4 5.8 4.4 5.8-4.4" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>,
};
const ORDER = ["Resume", "LinkedIn", "GitHub", "Email"].map(l => LINKS.find(x => x.label === l)!);

/* A line of text that settles out of noise, left to right. */
const NOISE = "abcdefghijklmnopqrstuvwxyz";
function Decode({ text, on, delay }: { text: string; on: boolean; delay: number }) {
  const [shown, setShown] = useState(on ? text : "");
  const skip = useRef(on);
  useEffect(() => {
    if (!on || skip.current) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { const id = requestAnimationFrame(() => setShown(text)); return () => cancelAnimationFrame(id); }
    const t0 = performance.now() + delay, dur = 26 * text.length;
    let raf = 0, last = 0;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0) / dur)), n = Math.floor(p * text.length);
      if (now - last > 34) {
        last = now;
        let tail = "";
        for (let i = n; i < Math.min(text.length, n + 5) && p > 0; i++) tail += text[i] === " " ? " " : NOISE[Math.floor(Math.random() * NOISE.length)];
        setShown(text.slice(0, n) + tail);
      }
      if (p < 1) raf = requestAnimationFrame(tick); else setShown(text);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, text, delay]);
  return <span className="st-dec" aria-hidden="true">{shown || "\u00a0"}</span>;
}

/* Projects show one at a time on screens with room for it: each is a card a screen tall, and
   one push of the wheel brings the next one to the middle. Smaller screens get a plain list. */
const PAGED = "(min-width: 1000px) and (min-height: 700px)", BAR = 64;
/* the width each demo is laid out at before it is scaled into its preview */
const PV = { trueline: 820, clarity: 800, nist: 600 };
/* the projects with something to watch get a card; NIST, an internship, leads the list under them */
const FEAT = WORK.filter(w => w.demo !== "nist");
const paged = () => matchMedia(PAGED).matches;
/* where to scroll so that project i sits in the middle of the screen */
const deckY = (i: number) => {
  const st = document.querySelector(".st-stack");
  return Math.round((st ? st.getBoundingClientRect().top + scrollY : 0) + i * innerHeight);
};

function Demo({ w }: { w: Entry }) {
  return w.demo === "trueline" ? <TrueLine /> : w.demo === "clarity" ? <Clarity /> : <NistFigure on />;
}

/* The real demo, laid out at desktop width and scaled down until all of it fits its frame. */
function Fit({ width, children }: { width: number; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null), inner = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const b = box.current!, n = inner.current!;
    const fit = () => {
      const h = n.offsetHeight || 1, k = Math.min(b.clientWidth / width, b.clientHeight / h);
      n.style.transform = `translate(${(b.clientWidth - width * k) / 2}px, ${(b.clientHeight - h * k) / 2}px) scale(${k})`;
    };
    const ro = new ResizeObserver(fit);
    ro.observe(b); ro.observe(n); fit();
    return () => ro.disconnect();
  }, [width]);
  return <div className="st-fit" ref={box}><div ref={inner} style={{ width }} inert>{children}</div></div>;
}

export default function Studio() {
  const theme = useTheme();
  const [page, setPage] = useState(readPage);
  const [instant] = useState(() => seenRecently() || !!readPage());
  const [ready, setReady] = useState(instant);
  const root = useRef<HTMLDivElement>(null);
  const cur = WORK.findIndex(w => slug(w) === page);
  const proj = cur < 0 ? null : WORK[cur];

  const lenis = useRef<Lenis | null>(null);

  /* Move between home and a project's page without a reload. Opening a project, its card
     grows into the page's coloured sheet; going back, the sheet shrinks into the card. */
  const go = (to: string | null, anchor?: string) => (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    const from = page, card = (id: string | null) => id ? document.querySelector<HTMLElement>(`[data-card="${id}"]`) : null;
    const u = new URL(location.href);
    if (to) u.searchParams.set("p", to); else u.searchParams.delete("p");
    u.hash = "";
    history.pushState({}, "", u);
    const named: HTMLElement[] = [];
    const name = (el: HTMLElement | null) => { if (el) { el.style.viewTransitionName = "pj-bg"; named.push(el); } };
    name(card(to));
    const apply = () => {
      const fi = FEAT.findIndex(w => slug(w) === from);
      flushSync(() => setPage(to));
      const back = anchor === "projects" ? card(from) : null;
      const top = (el: Element | null) => el ? el.getBoundingClientRect().top + scrollY : 0;
      const y = Math.max(0, back ? (paged() ? deckY(fi) : top(back) - 76) : anchor ? top(document.getElementById(anchor)) : 0);
      lenis.current?.scrollTo(y, { immediate: true, force: true });
      scrollTo(0, y);
      name(back);
    };
    const start = (document as Document & { startViewTransition?: (f: () => void) => { finished: Promise<void> } }).startViewTransition;
    if (start && !matchMedia("(prefers-reduced-motion: reduce)").matches)
      start.call(document, apply).finished.finally(() => named.forEach(el => { el.style.viewTransitionName = ""; }));
    else { apply(); named.forEach(el => { el.style.viewTransitionName = ""; }); }
  };
  const href = (to: string | null) => `?concept=studio${to ? `&p=${to}` : ""}`;

  useEffect(() => {
    const sync = () => setPage(readPage());
    addEventListener("popstate", sync);
    return () => removeEventListener("popstate", sync);
  }, []);

  /* smoothed scrolling */
  useEffect(() => {
    const l = new Lenis({ autoRaf: true, lerp: .2 });
    lenis.current = l;
    return () => { l.destroy(); lenis.current = null; };
  }, []);

  /* what follows the scroll: the first screen fading, which project is showing, the name at the foot rising into place */
  useEffect(() => {
    const el = root.current!;
    let raf = 0;
    const foot = el.querySelector<HTMLElement>(".st-foot");
    const stack = el.querySelector<HTMLElement>(".st-stack"), cards = [...el.querySelectorAll<HTMLElement>(".st-item .card")];
    let idle = 0;
    const clamp = (v: number) => v < 0 ? 0 : v > 1 ? 1 : v;
    const update = () => {
      raf = 0;
      const vh = innerHeight, hs = clamp(scrollY / vh);
      el.style.setProperty("--hs", hs.toFixed(4));
      /* the title's words wait for the dots: they come in once the ribbon is nearly formed */
      el.classList.toggle("flowed", scene(scrollY, vh) > .2);
      if (stack) flow.g = clamp(1 - (stack.getBoundingClientRect().top - BAR) / vh);
      if (stack) flow.pr = (scrollY - deckY(0)) / vh;
      /* a card is at full strength in the middle of the screen and falls back as it leaves */
      const lit = paged() && !matchMedia("(prefers-reduced-motion: reduce)").matches;
      for (const c of cards) {
        if (!lit) { c.style.opacity = c.style.transform = ""; c.classList.add("near"); continue; }
        const r = c.parentElement!.getBoundingClientRect(), l = (r.top + r.height / 2 - vh / 2) / vh, u = Math.abs(l);
        c.classList.toggle("near", u < .3);
        c.style.opacity = Math.min(1, Math.max(.05, 1 - (u - .1) * 2.2)).toFixed(3);
        c.style.transform = `translate3d(0, ${(l * 56).toFixed(1)}px, 0) scale(${(1 - Math.min(u, .7) * .09).toFixed(4)})`;
      }
      if (foot) foot.style.setProperty("--f", clamp((vh - foot.getBoundingClientRect().top) / (vh * .8)).toFixed(4));
    };
    /* once the scrolling stops inside the projects, settle on the nearest one */
    const settle = () => {
      if (!stack || !paged() || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const pr = (scrollY - deckY(0)) / innerHeight;
      if (pr < -.4 || pr > FEAT.length - .55) return;
      const y = deckY(Math.max(0, Math.min(FEAT.length - 1, Math.round(pr))));
      if (Math.abs(y - scrollY) > 6) lenis.current?.scrollTo(y, { duration: .75 });
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); clearTimeout(idle); idle = window.setTimeout(settle, 190); };
    /* Scroll lock: one push of the wheel moves exactly one step, and nothing more until that
       move is done and the wheel has come to rest. On the home page the steps are the first
       screen, the Projects title and each project, and below the last project the page
       scrolls freely. On a project's page they are its title screen, its demo, its results,
       how it works, and the foot of the page. */
    const pageStops = (vh: number) => {
      const top = (q: string, pad: (n: HTMLElement) => number) => { const n = el.querySelector<HTMLElement>(q); if (!n) return -1; let y = 0; for (let o: HTMLElement | null = n; o; o = o.offsetParent as HTMLElement | null) y += o.offsetTop; return y - pad(n); };   /* offsets, so an entrance animation in progress does not move the stop */
      const max = document.documentElement.scrollHeight - vh, out = [0];
      for (const v of [top(".pj-demo", n => Math.max(BAR + 16, (vh + BAR - n.offsetHeight) / 2)), top(".pj-cols", () => BAR + 28), top(".pj-steps", () => BAR + 28), max])
        if (v > out[out.length - 1] + (v >= max ? 240 : 60)) out.push(Math.min(v, max));
      return out;
    };
    /* A mouse wheel sends a few large clicks; a trackpad sends a stream of small moves and
       then keeps sending its glide for a second or two after the fingers lift. To make both
       feel the same, a step needs the same small amount of travel from either (one wheel
       click is already enough, a trackpad gets there within a few events), and after a step
       the leftover glide is swallowed until the wheel rests or is clearly pushed again. */
    const NEED = 24, REST = 140;
    let busy = false, done = 0, lastWheel = 0, acc = 0, dir = 0, bound: number | null = null, run = 0;
    const mags: number[] = [];
    const after = el.querySelector<HTMLElement>("#more");
    const stopsNow = (vh: number) => stack ? [0, vh * 1.2, ...FEAT.map((_, i) => deckY(i)), ...(after ? [Math.round(after.getBoundingClientRect().top + scrollY - BAR)] : [])] : pageStops(vh);
    const target = (d: number) => {
      const vh = innerHeight, y = bound ?? scrollY, stops = stopsNow(vh), end = stops[stops.length - 1];
      if (d > 0) return stops.find(v => v > y + 8);
      return !stack || y < end + vh * .25 ? [...stops].reverse().find(v => v < y - 8) : undefined;
    };
    const step = (to: number) => {
      if (!lenis.current) return;
      const id = ++run, far = Math.abs(to - scrollY) > innerHeight * 1.2, dur = far ? 1.35 : 1.15;
      busy = true; acc = 0; bound = to;
      if (stack) flow.aim = to > innerHeight * .5 ? 1 : 0;   /* the dots set off with the page, not once it has got somewhere */
      lenis.current.scrollTo(to, { duration: dur, easing: reach, lock: true, force: true, onComplete: () => { if (id === run) { bound = null; flow.aim = null; } } });
      /* the page has all but arrived well before the move formally ends, so the next push is taken from then */
      window.setTimeout(() => { if (id === run) { busy = false; done = performance.now(); } }, dur * 620);
      window.setTimeout(() => { if (id === run) { bound = null; flow.aim = null; } }, dur * 1000 + 300);
    };
    const locking = () => paged() && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wheel = (e: WheelEvent) => {
      if (!locking() || e.ctrlKey) return;
      /* some browsers report a mouse wheel in lines or pages, not pixels */
      const dy = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? innerHeight : 1), mag = Math.abs(dy);
      if (Math.abs(e.deltaX) > mag) return;
      const now = performance.now(), gap = now - lastWheel, d = dy > 0 ? 1 : -1; lastWheel = now;
      const avg = mags.length ? mags.reduce((a, b) => a + b, 0) / mags.length : 0;
      mags.push(mag); if (mags.length > 4) mags.shift();
      if (busy) { e.preventDefault(); e.stopPropagation(); return; }
      if (done) {
        /* still the glide from the last push? It is, unless the wheel rested, turned round,
           or is suddenly moving harder than it just was */
        const fresh = gap > REST || d !== dir || mag > 12 && mag > avg * 1.6 || now - done > 1600 && mag > 6 && mag >= avg;   /* the last: a wheel held steadily, not dying away */
        if (!fresh) { e.preventDefault(); e.stopPropagation(); return; }
        done = 0; acc = 0;
      }
      if (gap > REST || d !== dir) acc = 0;
      dir = d; acc += dy;
      const to = target(d);
      if (to === undefined) { acc = 0; return; }
      e.preventDefault(); e.stopPropagation();
      if (Math.abs(acc) >= NEED) step(to);
    };
    /* the keyboard steps the same way */
    const key = (e: KeyboardEvent) => {
      if (!locking() || busy || e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable]")) return;
      const d = e.key === "ArrowDown" || e.key === "PageDown" || e.key === " " && !e.shiftKey ? 1 : e.key === "ArrowUp" || e.key === "PageUp" || e.key === " " && e.shiftKey ? -1 : 0;
      if (e.key === " " && (e.target as HTMLElement | null)?.closest?.("button, a")) return;
      const to = d ? target(d) : undefined;
      if (to === undefined) return;
      e.preventDefault(); step(to);
    };
    addEventListener("keydown", key);
    addEventListener("wheel", wheel, { passive: false, capture: true });
    update();
    addEventListener("scroll", on, { passive: true }); addEventListener("resize", on);
    return () => { flow.aim = null; cancelAnimationFrame(raf); clearTimeout(idle); removeEventListener("scroll", on); removeEventListener("resize", on); removeEventListener("wheel", wheel, { capture: true }); removeEventListener("keydown", key); };
  }, [page]);

  /* things below the first screen rise in as they are reached */
  useEffect(() => {
    const els = root.current?.querySelectorAll<HTMLElement>("[data-rv]") ?? [];
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); }
    }), { threshold: .12, rootMargin: "0px 0px -5% 0px" });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  }, [page]);

  const bar = (
    <header className="st-bar">
      <a className="st-mark" href={href(null)} onClick={go(null)}>Adam Zhu</a>
      <div className="st-theme" role="group" aria-label="Theme">
        <button type="button" className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")}>dark</button>
        <button type="button" className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")}>light</button>
      </div>
      <nav>
        <a className="st-pill" href={`${href(null)}#projects`} onClick={go(null, "projects")}>Projects</a>
        <a className="st-pill" href="/Adam-Zhu-Resume.pdf" {...out}>Resume <i>↗</i></a>
        <a className="st-pill acc" href={LINKS[0].href}>Email</a>
      </nav>
    </header>
  );

  if (proj) {
    const next = WORK[(cur + 1) % WORK.length];
    return (
      <div className="st pj ready" ref={root} key={proj.id} style={{ "--accent": proj.accent } as CSSProperties}>
        <style>{CSS}</style>
        {bar}
        <div className="pj-bg" aria-hidden="true" />
        <main className="pj-main">
          <div className="pj-top">
            <a className="st-pill" href={`${href(null)}#projects`} onClick={go(null, "projects")}><i>←</i> All projects</a>
            <span className="pj-idx"><b>{two(cur + 1)}</b> / {two(WORK.length)}</span>
          </div>

          <div className="pj-head">
            <div>
              <h1 aria-label={proj.name}><span aria-hidden="true">{[...proj.name].map((ch, i) => <span key={i} className="ch" style={{ "--i": i } as CSSProperties}>{ch}</span>)}</span></h1>
              <p className="what">{proj.what}</p>
              <p className="kind">{proj.kind} · {proj.when}</p>
              {proj.links && <div className="st-pills">{proj.links.map(l => <a key={l.label} className="st-pill" href={l.href} {...(l.page ? {} : out)}>{l.label} <i>↗</i></a>)}</div>}
            </div>
            <div className="pj-stat"><b>{proj.big[0]}</b><span>{proj.big[1]}</span></div>
          </div>

          <div className="pj-demo"><Demo w={proj} /></div>

          <div className="pj-cols">
            <section data-rv>
              <h2>What it is</h2>
              <p className="lead">{proj.body}</p>
              {proj.result && <p className="lead">{proj.result}</p>}
              {proj.meta && <p className="meta">{proj.meta}</p>}
            </section>
            <section data-rv style={d(1)}>
              <h2>Results</h2>
              <dl className="pj-facts">{proj.facts.map(([k, v]) => <div key={k}><dd>{v}</dd><dt>{k}</dt></div>)}</dl>
            </section>
          </div>

          <section className="pj-steps">
            <h2>How it works</h2>
            <ol>{proj.steps.map(([k, v], i) => <li key={k} data-rv style={d(i)}><span>{two(i + 1)}</span><b>{k}</b><p>{v}</p></li>)}</ol>
          </section>

          <a className="pj-next" href={href(slug(next))} onClick={go(slug(next))} style={{ "--accent": next.accent } as CSSProperties} data-rv>
            <span>Next project</span>
            <b>{next.name} <i>→</i></b>
            <em>{next.what}</em>
          </a>
        </main>
      </div>
    );
  }

  return (
    <div className={`st${ready ? " ready" : ""}${instant ? " now" : ""}`} ref={root} key="home">
      <style>{CSS}</style>
      {bar}

      <section className="st-hero" id="top">
        <Dots onReady={() => setReady(true)} />
        <h1 aria-label="Adam Zhu">
          {["Adam", "Zhu"].map((word, wi) => (
            <span key={word} aria-hidden="true">{wi > 0 && " "}{[...word].map((ch, i) => <span key={i} className="ch" style={{ "--i": wi * 4 + i } as CSSProperties}>{ch}</span>)}</span>
          ))}
        </h1>
        <div className="st-id">
          <p aria-label="Carnegie Mellon University, Statistics and Machine Learning">
            <Decode text="Carnegie Mellon University" on={ready} delay={520} /><br />
            <Decode text="Statistics and Machine Learning" on={ready} delay={760} />
          </p>
          <div className="st-links">
            {ORDER.map((l, i) => <a key={l.label} href={l.href} style={{ "--i": i } as CSSProperties} {...(l.label === "Email" ? {} : out)}>{ICON[l.label]}<span>{l.label}</span></a>)}
          </div>
        </div>
      </section>

      <div className="st-body">
      <section className="st-title" style={{ "--tt": TITLE } as CSSProperties}>
        <div className="st-tin">
          <h2>Projects</h2>
          <p>Two projects. Each one opens on its own page.</p>
          <span className="st-hint">Scroll to see them <i>↓</i></span>
        </div>
      </section>
      <section className="st-sec" id="projects">
        <div className="st-stack">
          <ol className="st-stage">
            {FEAT.map(w => (
              <li key={w.id} className="st-item">
                <article className="card" data-card={slug(w)}>
                  <div className="tx">
                    <div>
                      <p className="kind">{w.kind}</p>
                      <h3>{w.name}</h3>
                    </div>
                    <div>
                      <p className="what">{w.what}</p>
                      <p className="res">{w.result}</p>
                      <div className="acts">
                        <a className="open" href={href(slug(w))} onClick={go(slug(w))}><span>View {w.name}</span><i>→</i></a>
                        {w.links?.filter(l => !l.page).map(l => <a key={l.label} className="st-pill" href={l.href} {...out}>{l.label} <i>↗</i></a>)}
                      </div>
                    </div>
                  </div>
                  <div className={`pv ${w.demo}`}><Fit width={PV[w.demo]}><Demo w={w} /></Fit></div>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="st-sec" id="more">
        <div className="st-head">
          <h2 data-rv className="mask"><span>More work</span></h2>
          <p data-rv style={d(1)}>A research internship at NIST, a campus AI team, two side projects, a paper, and research at Iowa State.</p>
        </div>
        <ol className="st-rows">
          {WORK.filter(w => !FEAT.includes(w)).map(w => (
            <li key={w.id} data-rv>
              <a href={href(slug(w))} onClick={go(slug(w))}>
                <span className="i">01</span>
                <span className="n">{w.name}<em>{w.kind} · {w.when}</em></span>
                <span className="b">{w.result}</span>
                <span className="go">→</span>
              </a>
            </li>
          ))}
          {MORE.map((m, i) => {
            const row = (
              <>
                <span className="i">{two(i + 2)}</span>
                <span className="n">{m.name}<em>{m.role}{m.org && <> · {m.org}</>} · {m.when}</em></span>
                <span className="b">{m.body}</span>
                <span className="go">{m.href ? "↗" : ""}</span>
              </>
            );
            return <li key={m.name} data-rv>{m.href ? <a href={m.href} {...out}>{row}</a> : <div>{row}</div>}</li>;
          })}
        </ol>
      </section>

      <section className="st-sec st-contact" id="contact">
        <h2 data-rv className="mask"><span>Get in touch</span></h2>
        <div data-rv style={d(1)}>
          <a className="mail" href={LINKS[0].href}>{MAIL}</a>
          <div className="st-links">{ORDER.slice(0, 3).map(l => <a key={l.label} href={l.href} {...out}>{ICON[l.label]}<span>{l.label}</span></a>)}</div>
        </div>
      </section>

      <div className="st-foot">
        <div className="big" aria-hidden="true">Adam Zhu</div>
        <div className="meta"><span>Adam Zhu, Pittsburgh</span><span>2026</span></div>
      </div>
      </div>
    </div>
  );
}

const CSS = `
.st { --bg: #000; --ink: #fff; --mut: #8b8b91; --ln: #26262a; --card: #0b0b0d; --acc: #2b47ff; --onacc: #fff;
  position: relative; background: var(--bg); color: var(--ink); font-family: "Helvetica Neue", var(--sans); letter-spacing: -.01em; overflow-x: clip; }
:root[data-theme="light"] .st { --bg: #f4f4f2; --ink: #0c0c0e; --mut: #6a6a70; --ln: #d6d6d1; --card: #ebebe8; }
html:has(.st), html:has(.st) body { background: #000 !important; }
html[data-theme="light"]:has(.st), html[data-theme="light"]:has(.st) body { background: #f4f4f2 !important; }
.st a { color: inherit; text-decoration: none; }
.st ul, .st ol { list-style: none; margin: 0; padding: 0; }
.st i { font-style: normal; }

/* pills */
.st-pill { display: inline-flex; align-items: center; gap: 7px; height: 34px; padding: 0 15px; border: 1px solid var(--ln); border-radius: 999px; font-size: 13px; white-space: nowrap;
  transition: background .2s, color .2s, border-color .2s, transform .2s cubic-bezier(.2,.7,.2,1); }
.st-pill i { font-size: 11px; transition: transform .2s cubic-bezier(.2,.7,.2,1); }
.st-pill:hover { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.st-pill:hover i { transform: translate(2px, -2px); }
.st-pill:active { transform: scale(.97); }
.st-pill.acc { background: var(--acc); border-color: var(--acc); color: var(--onacc); }
.st-pill.acc:hover { background: var(--ink); border-color: var(--ink); color: var(--bg); }

/* bar */
.st-bar { position: fixed; z-index: 30; top: 0; left: 0; right: 0; height: 64px; padding: 0 22px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
  opacity: 0; transform: translateY(-10px); transition: opacity .6s .15s, transform .6s .15s cubic-bezier(.2,.7,.2,1); }
.st.ready .st-bar { opacity: 1; transform: none; }
.st-mark { font-size: 16px; font-weight: 500; letter-spacing: -.02em; }
.st-bar nav { display: flex; gap: 8px; justify-content: flex-end; }
.st-bar .st-pill { background: color-mix(in srgb, var(--bg) 70%, transparent); backdrop-filter: blur(10px); }
.st-bar .st-pill:hover { background: var(--ink); }
.st-bar .st-pill.acc { background: var(--acc); }
.st-bar .st-pill.acc:hover { background: var(--ink); }
.st-theme { display: flex; padding: 3px; border-radius: 999px; background: color-mix(in srgb, var(--bg) 70%, transparent); backdrop-filter: blur(10px); border: 1px solid var(--ln); }
.st-theme button { all: unset; cursor: pointer; font-size: 12px; padding: 5px 13px; border-radius: 999px; color: var(--mut); transition: background .25s, color .25s; }
.st-theme button.on { background: var(--ink); color: var(--bg); }

/* first screen */
.st-hero { position: relative; height: 100svh; min-height: 620px; overflow: hidden; }
.st-dots { position: fixed; z-index: 0; inset: 0; width: 100%; height: 100%; color: var(--ink); pointer-events: none; }
.st-hud span { position: absolute; font: 400 11px/1 var(--mono); letter-spacing: .04em; text-transform: uppercase; color: var(--mut); transition: opacity .5s; white-space: pre; }
.st-hud b { font-weight: 400; color: var(--ink); }
.st-hud .tl { left: 22px; top: 26px; } .st-hud .tr { right: 22px; top: 26px; } .st-hud .bl { left: 22px; bottom: 26px; }
.st-hud.off span { opacity: 0; }
.st-in { opacity: 0; transform: translateY(18px); filter: blur(6px); transition: opacity .8s var(--d, 0ms), transform .9s var(--d, 0ms) cubic-bezier(.2,.7,.2,1), filter .8s var(--d, 0ms); }
.st.ready .st-in { opacity: 1; transform: none; filter: none; }
.st-hero h1 { position: absolute; left: 0; right: 0; top: 45%; margin: 0; text-align: center; font-weight: 500; font-size: clamp(64px, 12.4vw, 216px); line-height: 1; letter-spacing: -.065em; white-space: nowrap; translate: 0 -54%; pointer-events: none; }
/* how the first screen arrives, once the object has formed: the name's letters swing up out
   of a slot one after another, the two lines settle out of noise, the links pop in, the rule
   along the bottom draws itself and the three projects rise off it */
.st-hero h1 { overflow: hidden; padding: .08em 0 .02em; }
.st-hero h1 .ch { display: inline-block; transform: translateY(118%) rotate(9deg); transform-origin: 0 100%; }
.st.ready .st-hero h1 .ch { animation: st-letter 1.15s cubic-bezier(.16, 1, .3, 1) calc(var(--i) * 55ms) both; }
@keyframes st-letter { from { transform: translateY(118%) rotate(9deg); } to { transform: none; } }
.st-dec { white-space: pre; }
.st-id .st-links a { opacity: 0; }
.st.ready .st-id .st-links a { animation: st-pop .75s cubic-bezier(.2, 1.35, .35, 1) calc(1.15s + var(--i) * 85ms) both; }
@keyframes st-pop { from { opacity: 0; transform: translateY(14px) scale(.72); filter: blur(5px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes st-rule { from { transform: scaleX(0); } to { transform: none; } }
@keyframes st-rise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: none; } }
.st.now .st-hero * { animation-duration: 1ms !important; animation-delay: 0s !important; }
.st-id { position: absolute; left: 0; right: 0; top: calc(45% + clamp(32px, 6.2vw, 108px) + 6px); display: grid; justify-items: center; gap: 22px; padding: 0 22px; text-align: center; }
.st-id p { margin: 0; font-size: clamp(17px, 1.5vw, 23px); line-height: 1.3; letter-spacing: -.02em; }
.st-links { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.st-links a { display: inline-flex; align-items: center; gap: 9px; height: 42px; padding: 0 17px 0 14px; border-radius: 999px; font-size: 15px; border: 1px solid var(--ln);
  background: color-mix(in srgb, var(--bg) 62%, transparent); backdrop-filter: blur(10px); transition: background .2s, color .2s, border-color .2s, transform .2s cubic-bezier(.2,.7,.2,1); }
.st-links svg { width: 17px; height: 17px; flex: none; }
.st-links a:hover { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.st-links a:active { transform: scale(.97); }
.st-pills { display: flex; flex-wrap: wrap; gap: 6px; }

/* sections */
.st-sec { padding: clamp(90px, 14vh, 170px) 22px 0; }
.st-head { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); align-items: end; gap: 32px; margin-bottom: 34px; }
.st h2 { margin: 0; font-weight: 400; font-size: clamp(54px, 8.4vw, 136px); line-height: .95; letter-spacing: -.055em; }
.st h2 i { display: inline-block; font-size: .8em; }
.st-head p { margin: 0 0 12px; font-size: 18px; letter-spacing: -.015em; line-height: 1.4; max-width: 30em; }
[data-rv] { opacity: 0; transform: translateY(34px); transition: opacity .8s var(--d, 0ms), transform 1s var(--d, 0ms) cubic-bezier(.2,.7,.2,1); }
[data-rv].on { opacity: 1; transform: none; }

/* the dots stay behind the whole page; the first screen's words fade as it scrolls away */
.st-hero h1, .st-id { opacity: calc(1 - var(--hs, 0) * 2.4); }
.st-body { position: relative; z-index: 2; }

/* headings come up from behind their own baseline */
[data-rv].mask { opacity: 1; transform: none; overflow: hidden; padding-bottom: .1em; margin-bottom: -.1em; }
[data-rv].mask > span { display: block; transform: translateY(112%) rotate(4deg); transform-origin: 0 100%; transition: transform 1.15s cubic-bezier(.16, 1, .3, 1) var(--d, 0ms); }
[data-rv].mask.on > span { transform: none; }

/* the title screen: it holds still while the dots flow under the words */
.st-title { height: calc(var(--tt) * 100vh); }
.st-tin { position: sticky; top: 0; height: 100svh; display: grid; align-content: start; justify-items: center; gap: 18px; padding: 22vh 22px 0; text-align: center; pointer-events: none;
  opacity: 0; transform: translateY(26px); transition: opacity .35s, transform .5s; }
.st.flowed .st-tin { opacity: 1; transform: none; transition: opacity .9s .3s, transform 1.1s cubic-bezier(.16, 1, .3, 1) .3s; }
.st-tin h2 { margin: 0; font-weight: 500; font-size: clamp(64px, 10.5vw, 190px); line-height: .95; letter-spacing: -.06em; }
.st-tin p { margin: 0; font-size: clamp(16px, 1.4vw, 21px); letter-spacing: -.015em; color: var(--mut); }
.st-hint { margin-top: 14px; display: inline-flex; align-items: center; gap: 10px; font: 400 12px/1 var(--mono); letter-spacing: .06em; text-transform: uppercase; color: var(--mut); }
.st-hint i { font-style: normal; animation: st-nudge 1.8s ease-in-out infinite; }
@keyframes st-nudge { 0%, 100% { transform: none; } 50% { transform: translateY(5px); } }
#projects { padding-top: 0; }

/* projects: one card each. The demo is the card; the words are a short label beside it. */
.st-stack { padding-bottom: 6vh; }
.st-stage { margin: 0; padding: 0; list-style: none; display: grid; gap: 28px; }
.st-item .card { display: grid; border-radius: 30px; overflow: hidden; background: var(--card); border: 1px solid var(--ln); }
.st-item .tx { display: flex; flex-direction: column; gap: 22px; min-width: 0; padding: 26px 24px 28px; background: color-mix(in srgb, var(--ink) 4.5%, var(--card)); }
.st-item .kind { margin: 0 0 14px; font-size: 14px; line-height: 1.3; color: var(--mut); }
.st-item h3 { margin: 0; font-weight: 500; font-size: clamp(44px, 9vw, 64px); line-height: .95; letter-spacing: -.055em; }
.st-item .what { margin: 0; font-size: clamp(18px, 1.5vw, 23px); line-height: 1.3; letter-spacing: -.02em; max-width: 22em; }
.st-item .res { margin: 14px 0 0; font-size: 15px; line-height: 1.45; color: var(--mut); max-width: 30em; }
.st-item .acts { margin: 26px 0 0; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.st-item .open { display: inline-flex; align-items: center; gap: 22px; height: 50px; padding: 0 22px; border-radius: 999px; font-size: 16px; background: var(--ink); color: var(--bg); transition: background .25s, color .25s; }
.st-item .open i { transition: transform .3s cubic-bezier(.16, 1, .3, 1); }
.st-item .open:hover { background: var(--acc); color: var(--onacc); } .st-item .open:hover i { transform: translateX(6px); }
.st-item .acts .st-pill { height: 50px; padding: 0 20px; font-size: 15px; }
/* the demo sits straight on the card's dark side: no panel, no frame round it */
.st-item .pv { position: relative; aspect-ratio: 4 / 3; overflow: hidden; background: #070708; }
.st-item .pv .win { background: none; box-shadow: none; padding: 0; }
.st-item .pv .win > .edge, .st-item .pv .win > .corner { display: none; }
.st-fit { position: absolute; inset: clamp(16px, 2.2vw, 40px); } .st-fit > div { transform-origin: 0 0; pointer-events: none; }
/* a preview shows the demo's picture, large; its readouts and controls are on the project's page */
.st-item .pv .democtl, .st-item .pv .nstats { display: none; }
/* TrueLine's measurements count up in a column beside the throw */
.st-item .pv .tlgrid { display: grid; grid-template-columns: minmax(0, 1fr) 190px; gap: 40px; align-items: center; }
.st-item .pv .app { max-width: 100%; }
.st-item .pv .nums { grid-template-columns: 1fr; gap: 2px; margin: 0 0 30px; }
.st-item .pv .nums .num { padding: 11px 0 9px; } .st-item .pv .nums .num b { font-size: 27px; } .st-item .pv .nums .num small { font-size: 12px; }
@supports (corner-shape: squircle) { .st-item .card { corner-shape: squircle; border-radius: 64px; } }

/* on screens with room, each project is a screen of its own and the wheel moves one at a time */
@media (min-width: 1000px) and (min-height: 700px) {
  .st-stack { margin: 0 clamp(0px, 2.6vw, 64px); padding-bottom: 0; }
  .st-stage { display: block; }
  .st-item { height: 100vh; display: grid; align-items: center; padding: 64px 0 0; }
  .st-item .card { height: calc(100vh - 64px - clamp(40px, 9vh, 96px)); grid-template-columns: minmax(0, 31fr) minmax(0, 69fr); will-change: transform, opacity; }
  .st-item .tx { justify-content: space-between; padding: clamp(28px, 5vh, 56px) clamp(24px, 2.6vw, 52px); }
  .st-item h3 { font-size: clamp(44px, min(4.6vw, 9.5vh), 100px); }
  .st-item .kind { margin-bottom: clamp(12px, 2.2vh, 22px); }
  .st-item .what { font-size: clamp(18px, min(1.5vw, 2.8vh), 26px); }
  .st-item .acts { margin-top: clamp(20px, 3.6vh, 40px); }
  .st-item .pv { aspect-ratio: auto; height: 100%; min-height: 0; }
}
/* a card's words and its demo come in as it reaches the middle */
@media (min-width: 1000px) and (min-height: 700px) and (prefers-reduced-motion: no-preference) {
  .st-item .kind, .st-item h3, .st-item .what, .st-item .res, .st-item .acts { opacity: 0; transform: translateY(22px); transition: opacity .3s, transform .4s; }
  .st-item .pv .st-fit { opacity: 0; transform: scale(.96); transition: opacity .3s, transform .4s; }
  .st-item .near :is(.kind, h3, .what, .res, .acts) { opacity: 1; transform: none; transition: opacity .7s var(--dl, 0s), transform .9s cubic-bezier(.16, 1, .3, 1) var(--dl, 0s); }
  .st-item .near h3 { --dl: .06s; } .st-item .near .what { --dl: .14s; } .st-item .near .res { --dl: .2s; } .st-item .near .acts { --dl: .26s; }
  .st-item .near .pv .st-fit { opacity: 1; transform: none; transition: opacity .8s .1s, transform 1.1s cubic-bezier(.16, 1, .3, 1) .1s; }
}
@media (min-width: 1000px) and (min-height: 700px) { .st.pj .pj-head { min-height: calc(100svh - 175px - 44px); margin-bottom: 150px; } }
.st-foot .big { transform: translateY(calc((1 - var(--f, 1)) * 45%)); will-change: transform; }

/* card to page: the card grows into the page's sheet, then the page's parts come in */
.st-bar { view-transition-name: st-bar; }
.pj-bg { position: fixed; inset: 0; z-index: -1; background: var(--bg); view-transition-name: pj-bg; }
.pj-main { view-transition-name: pj-main; }
::view-transition-group(pj-bg) { animation-duration: .8s; animation-timing-function: cubic-bezier(.7, 0, .15, 1); }
::view-transition-old(pj-bg), ::view-transition-new(pj-bg) { width: 100%; height: 100%; object-fit: cover; object-position: 50% 0; animation-duration: .5s; }
::view-transition-old(root), ::view-transition-new(root) { animation-duration: .45s; }
::view-transition-new(pj-main):only-child { animation: pj-in .01s linear .45s both; }
::view-transition-old(pj-main):only-child { animation: pj-out .28s ease both; }
::view-transition-old(pj-main):not(:only-child) { animation: pj-out .28s ease both; }
::view-transition-new(pj-main):not(:only-child) { animation: pj-in .01s linear .3s both; }
@keyframes pj-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes pj-out { to { opacity: 0; transform: translateY(-24px); } }
.pj .pj-top, .pj .pj-head .what, .pj .pj-head .kind, .pj .pj-head .st-pills, .pj .pj-stat { animation: st-rise .95s cubic-bezier(.16, 1, .3, 1) both; }
.pj .pj-top { animation-delay: .5s; } .pj .pj-head .what { animation-delay: .95s; } .pj .pj-head .kind { animation-delay: 1.05s; } .pj .pj-head .st-pills { animation-delay: 1.15s; } .pj .pj-stat { animation-delay: 1.1s; }
.st.pj h1 { overflow: hidden; padding: .1em .04em .04em; }
.st.pj h1 .ch { display: inline-block; animation: st-letter 1.15s cubic-bezier(.16, 1, .3, 1) calc(.55s + var(--i) * 50ms) both; transform-origin: 0 100%; }
.pj .pj-demo { animation: pj-demo 1.3s cubic-bezier(.16, 1, .3, 1) 1.15s both; }
@keyframes pj-demo { from { opacity: 0; transform: translateY(70px) scale(.93); clip-path: inset(14% 8% 14% 8% round 28px); } to { opacity: 1; transform: none; clip-path: inset(0 0 0 0 round 0px); } }

/* a project's own page */
.st.pj { --bg: color-mix(in srgb, var(--accent) 8%, #000); --card: color-mix(in srgb, var(--accent) 10%, #0b0b0d); --ln: color-mix(in srgb, var(--accent) 20%, #26262a); --hl: var(--accent); min-height: 100svh; }
:root[data-theme="light"] .st.pj { --bg: color-mix(in srgb, var(--accent) 17%, #f4f4f2); --card: color-mix(in srgb, var(--accent) 26%, #ebebe8); --ln: color-mix(in srgb, var(--accent) 35%, #cfcfca); --hl: var(--ink); }
.pj-main { padding: 96px 22px 22px; max-width: 1500px; margin: 0 auto; }
.pj-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: clamp(28px, 5vh, 56px); }
.pj-idx { font: 400 12px/1 var(--mono); letter-spacing: .04em; color: var(--mut); } .pj-idx b { font-weight: 400; color: var(--ink); }
.pj-head { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr); gap: 40px; align-items: end; margin-bottom: clamp(32px, 6vh, 64px); }
.st.pj h1 { margin: -.1em 0 22px; font-weight: 500; font-size: clamp(76px, 15vw, 250px); line-height: .84; letter-spacing: -.065em; color: var(--hl); width: fit-content; margin-left: -.04em; }
.pj-head .what { margin: 0 0 12px; font-size: clamp(22px, 2.3vw, 34px); line-height: 1.2; letter-spacing: -.03em; max-width: 22em; }
.pj-head .kind { margin: 0 0 22px; font-size: 16px; color: var(--mut); }
.pj-stat { padding: 22px 0 6px; border-top: 1px solid var(--ln); }
.pj-stat b { display: block; font-weight: 400; font-size: clamp(56px, 7vw, 112px); line-height: .9; letter-spacing: -.06em; margin-bottom: 12px; white-space: nowrap; }
.pj-stat span { font-size: 17px; line-height: 1.35; }
.pj-demo { max-width: 1180px; margin: 0 auto clamp(48px, 9vh, 100px); }
.st.pj h2 { margin: 0 0 20px; font: 400 12px/1 var(--mono); letter-spacing: .05em; text-transform: uppercase; color: var(--mut); }
.pj-cols { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(32px, 6vw, 96px); padding-top: 26px; border-top: 1px solid var(--ln); margin-bottom: clamp(48px, 9vh, 100px); }
.pj-cols .lead { margin: 0 0 16px; font-size: clamp(18px, 1.5vw, 22px); line-height: 1.42; letter-spacing: -.015em; max-width: 32em; }
.pj-cols .meta { margin: 20px 0 0; font-size: 15px; color: var(--mut); }
.pj-facts { margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.pj-facts div { padding: 18px 18px 16px; border-radius: 16px; background: var(--card); border: 1px solid var(--ln); }
.pj-facts dd { margin: 0 0 8px; font-size: clamp(28px, 2.9vw, 44px); line-height: 1; letter-spacing: -.05em; color: var(--hl); white-space: nowrap; }
.pj-facts dt { font-size: 14.5px; line-height: 1.35; color: var(--mut); }
.pj-steps { padding-top: 26px; border-top: 1px solid var(--ln); margin-bottom: clamp(48px, 9vh, 100px); }
.pj-steps li { display: grid; grid-template-columns: 54px minmax(0, 1fr) minmax(0, 2fr); gap: 20px; align-items: baseline; padding: 20px 0; border-bottom: 1px solid var(--ln); }
.pj-steps li:first-child { border-top: 1px solid var(--ln); }
.pj-steps span { font: 400 11.5px/1 var(--mono); color: var(--mut); }
.pj-steps b { font-weight: 400; font-size: clamp(22px, 2.3vw, 34px); letter-spacing: -.04em; }
.pj-steps p { margin: 0; font-size: 17px; line-height: 1.45; }
.pj-next { display: grid; gap: 10px; padding: clamp(28px, 5vw, 64px); border-radius: 26px; background: color-mix(in srgb, var(--accent) 14%, #0b0b0d); border: 1px solid color-mix(in srgb, var(--accent) 30%, #26262a); transition: border-color .25s, background .25s; }
:root[data-theme="light"] .pj-next { background: color-mix(in srgb, var(--accent) 26%, #ebebe8); border-color: color-mix(in srgb, var(--accent) 40%, #cfcfca); }
.pj-next:hover { border-color: var(--accent); }
.pj-next span { font: 400 12px/1 var(--mono); letter-spacing: .05em; text-transform: uppercase; color: var(--mut); }
.pj-next b { font-weight: 500; font-size: clamp(54px, 9vw, 150px); line-height: .9; letter-spacing: -.06em; }
.pj-next b i { display: inline-block; font-size: .7em; transition: transform .3s cubic-bezier(.2,.7,.2,1); }
.pj-next:hover b i { transform: translateX(.12em); }
.pj-next em { font-style: normal; font-size: 18px; }

.st-rows { border-top: 1px solid var(--ln); }
.st-rows li > * { display: grid; grid-template-columns: 54px minmax(0, 1fr) minmax(0, 1.25fr) 40px; gap: 20px; align-items: start; padding: 24px 0; border-bottom: 1px solid var(--ln); transition: padding .35s cubic-bezier(.2,.7,.2,1), background .25s; }
.st-rows li > a:hover { padding-left: 14px; padding-right: 14px; background: color-mix(in srgb, var(--ink) 5%, transparent); }
.st-rows .i { font: 400 11px/2.6 var(--mono); color: var(--mut); }
.st-rows .n { font-size: clamp(22px, 2.4vw, 34px); letter-spacing: -.04em; line-height: 1.1; }
.st-rows .b { font-size: 16px; line-height: 1.45; }
.st-rows .n em { display: block; font-style: normal; margin-top: 10px; font-size: 14px; letter-spacing: 0; line-height: 1.3; color: var(--mut); }
.st-rows .go { justify-self: end; width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--ln); display: grid; place-items: center; font-size: 12px; transition: background .2s, color .2s, border-color .2s; }
.st-rows .go:empty { visibility: hidden; }
.st-rows a:hover .go { background: var(--acc); border-color: var(--acc); color: var(--onacc); }

.st-contact { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 32px; align-items: end; }
.st-contact .st-links { justify-content: flex-start; }
.st-contact .mail { display: inline-block; font-size: clamp(20px, 2.5vw, 36px); letter-spacing: -.035em; border-bottom: 1px solid var(--ln); padding-bottom: 6px; margin-bottom: 20px; transition: border-color .2s; }
.st-contact .mail:hover { border-color: var(--ink); }
.st-foot { padding: clamp(70px, 12vh, 150px) 22px 22px; }
.st-foot .big { font-weight: 500; font-size: 23.2vw; line-height: .8; letter-spacing: -.07em; white-space: nowrap; margin-left: -.05em; }
.st-foot .meta { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 14px; border-top: 1px solid var(--ln); font-size: 14px; color: var(--mut); }

@media (max-width: 820px) {
  .st-bar { grid-template-columns: auto 1fr; padding: 0 14px; } .st-bar nav { display: none; } .st-theme { justify-self: end; }
  .st-hero h1 { top: 30%; font-size: 19vw; }
  .st-id { top: calc(30% + 9.5vw + 14px); padding: 0 14px; gap: 18px; }
  .pj-main { padding: 80px 14px 14px; }
  .pj-head, .pj-cols { grid-template-columns: 1fr; gap: 28px; }
  .pj-steps li { grid-template-columns: 30px minmax(0, 1fr); } .pj-steps p { grid-column: 2; }
  .st-hud .tl { left: 14px; } .st-hud .tr { right: 14px; top: 46px; } .st-hud .bl { left: 14px; bottom: 18px; }
  .st-sec { padding-left: 14px; padding-right: 14px; }
  .st-head, .st-contact { grid-template-columns: 1fr; gap: 16px; align-items: start; }
  .st-rows li > * { grid-template-columns: 30px minmax(0, 1fr) 34px; }
  .st-rows .b { grid-column: 2 / 3; grid-row: 2; }
  .st-foot { padding-left: 14px; padding-right: 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .st-in, [data-rv], .st-bar { transition: none; filter: none; transform: none; }
  .st-hero h1 .ch, .st-id .st-links a { animation: none !important; opacity: 1; transform: none; }
  .st-hero h1, .st-id { opacity: 1; } .st-foot .big { transform: none; }
  .st-title { height: auto; } .st-tin { position: static; height: auto; padding: 90px 22px 30px; opacity: 1; transform: none; } .st-hint { display: none; }
  .st-dots { position: absolute; }
  [data-rv].mask > span { transform: none; transition: none; }
  .pj .pj-top, .pj .pj-head .what, .pj .pj-head .kind, .pj .pj-head .st-pills, .pj .pj-stat, .st.pj h1 .ch, .pj .pj-demo { animation: none; }
}
`;
