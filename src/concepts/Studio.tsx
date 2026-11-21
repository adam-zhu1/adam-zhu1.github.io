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
import { TRUELINE, type Story } from "../data/trueline-story";
import { CLARITY } from "../data/clarity-story";

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
/* the rows of the Contact panel after Email: the label, and what is written out for it */
const CONTACT: [string, string][] = [["GitHub", "github.com/adam-zhu1"], ["LinkedIn", "linkedin.com/in/adam-zhu-cmu"], ["Resume", "Adam-Zhu-Resume.pdf"]];
/* what he is looking for: on the first screen and again over the contact rows */
const SEEKING = "Looking for Summer 2027 internships in software engineering, machine learning and data science.";
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
/* on a project's page, how far the scroll travels between one stage of "How it works" and the next, in screens */
const HSTEP = .75;
/* the width each demo is laid out at before it is scaled into its preview */
const PV = { trueline: 820, clarity: 800, nist: 600 };
/* the projects with something to watch get a card; NIST, an internship, leads the list under them */
const FEAT = WORK.filter(w => w.demo !== "nist");
/* the list under the cards, in two groups; NIST, which has a page of its own, leads the first */
const GROUPS = [
  { title: "Experience", nist: true, lead: ["ScottyLabs AI"], names: ["VR evacuation study", "Forensic image research"] },   /* newest first: lead rows, then NIST, then the rest */
  { title: "Other projects and a paper", nist: false, lead: [] as string[], names: ["Fantasy draft assistant", "March Madness predictor", "Matched binary diagnostic tests"] },
];
/* the projects whose page is told in full: why, how it works stage by stage, what was hard, where it stands */
const STORY: Partial<Record<Entry["demo"], Story>> = { trueline: TRUELINE, clarity: CLARITY };
const paged = () => matchMedia(PAGED).matches;
const STEP = false;
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
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(MAIL).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); }).catch(() => {}); };
  const [instant] = useState(() => seenRecently() || !!readPage());
  const [ready, setReady] = useState(instant);
  /* "How it works" plays by itself: the demo says which stage it is on and the words follow.
     On a narrow screen the stages are a plain list (-1). */
  const [stg, setStg] = useState(0);
  const [wide, setWide] = useState(false);
  const [at, setAt] = useState<{ i: number } | null>(null);
  const hw = wide ? stg : -1;
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
    const name = (el: HTMLElement | null | undefined, n = "pj-bg") => { if (el) { el.style.viewTransitionName = n; named.push(el); } };
    /* the project's name is the one thing on both sides, so it travels: card heading to page title and back */
    const opened = card(to);
    name(opened); name(opened?.querySelector<HTMLElement>("h3"), "pj-name");
    if (!to && anchor === "projects") name(root.current?.querySelector<HTMLElement>(".pj-head h1"), "pj-name");
    const apply = () => {
      const fi = FEAT.findIndex(w => slug(w) === from);
      flushSync(() => setPage(to));
      const back = anchor === "projects" ? card(from) : null;
      const top = (el: Element | null) => el ? el.getBoundingClientRect().top + scrollY : 0;
      const y = Math.max(0, back ? (paged() ? deckY(fi) : top(back) - 76) : anchor ? top(document.getElementById(anchor)) : 0);
      lenis.current?.scrollTo(y, { immediate: true, force: true });
      scrollTo(0, y);
      name(back);
      /* the card's heading must already be in place for the name to land on it, not still on its way in */
      const h = back?.querySelector<HTMLElement>("h3");
      if (back && h) { back.classList.add("near"); h.style.transition = "none"; name(h, "pj-name"); }
      if (opened) { root.current?.classList.add("via"); name(root.current?.querySelector<HTMLElement>(".pj-head h1"), "pj-name"); }
    };
    const start = (document as Document & { startViewTransition?: (f: () => void) => { finished: Promise<void> } }).startViewTransition;
    if (start && !matchMedia("(prefers-reduced-motion: reduce)").matches)
      start.call(document, apply).finished.finally(() => named.forEach(el => { el.style.viewTransitionName = el.style.transition = ""; }));
    else { apply(); named.forEach(el => { el.style.viewTransitionName = el.style.transition = ""; }); }
  };
  const href = (to: string | null) => `?concept=studio${to ? `&p=${to}` : ""}`;

  /* Escape leaves a project's page */
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape" && !e.defaultPrevented) root.current?.querySelector<HTMLElement>(".st-back")?.click(); };
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, []);

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

  /* what follows the scroll: the first screen fading, which project is showing */
  useEffect(() => {
    const el = root.current!;
    let raf = 0;
    const stack = el.querySelector<HTMLElement>(".st-stack"), cards = [...el.querySelectorAll<HTMLElement>(".st-item .card")];
    let idle = 0;
    const clamp = (v: number) => v < 0 ? 0 : v > 1 ? 1 : v;
    /* offsets, so an entrance animation in progress does not move anything */
    const offTop = (n: HTMLElement | null) => { let y = 0; for (let o = n; o; o = o.offsetParent as HTMLElement | null) y += o.offsetTop; return y; };
    const how = el.querySelector<HTMLElement>(".pj-how"), nHow = el.querySelectorAll(".pj-how .stp").length;
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
        c.style.transform = `translate3d(0, ${(l * 56).toFixed(1)}px, 0) scale(${(1 - Math.min(u, .7) * .09).toFixed(4)})`;
      }
      setWide(paged());
      /* the dots step back a little behind the lists of text under the projects; the lists sit on frosted panels */
      const more = el.querySelector<HTMLElement>("#more");
      if (more) el.style.setProperty("--dq", (1 - .12 * clamp((vh * .8 - more.getBoundingClientRect().top) / (vh * .45))).toFixed(3));
    };
    /* once the scrolling stops inside the projects, settle on the nearest one */
    const settle = () => {
      if (how) return;   /* a project's page scrolls freely and never moves by itself */
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
      /* a page with the pipeline pinned: its title, why it exists, each stage, then what was hard; below that it reads freely */
      if (how) return [0, offTop(el.querySelector<HTMLElement>(".pj-why")) - BAR, ...Array.from({ length: nHow }, (_, i) => Math.round(offTop(how) - BAR + i * vh * HSTEP)), offTop(el.querySelector<HTMLElement>(".pj-hard")) - BAR - 8];
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
    const NEED = 24, REST = 140, GUARD = 320;
    let busy = false, started = 0, done = 0, lastWheel = 0, acc = 0, dir = 0, bound: number | null = null, run = 0;
    const mags: number[] = [];
    const after = el.querySelector<HTMLElement>("#more");
    const stopsNow = (vh: number) => stack ? [0, vh * 1.2, ...FEAT.map((_, i) => deckY(i)), ...(after ? [Math.round(after.getBoundingClientRect().top + scrollY - BAR)] : [])] : pageStops(vh);
    const target = (d: number) => {
      const vh = innerHeight, y = bound ?? scrollY, stops = stopsNow(vh), end = stops[stops.length - 1];
      if (d > 0) return stops.find(v => v > y + 8);
      return y < end + vh * .25 ? [...stops].reverse().find(v => v < y - 8) : undefined;
    };
    const step = (to: number) => {
      if (!lenis.current) return;
      const id = ++run, far = Math.abs(to - scrollY) > innerHeight * 1.2, dur = far ? 1.35 : 1.15;
      busy = true; started = performance.now(); acc = 0; bound = to;
      if (stack) flow.aim = to > innerHeight * .5 ? 1 : 0;   /* the dots set off with the page, not once it has got somewhere */
      lenis.current.scrollTo(to, { duration: dur, easing: reach, lock: true, force: true, onComplete: () => { if (id === run) { bound = null; flow.aim = null; } } });
      /* a step can be redirected while it is still moving: after a moment to let the push that
         started it finish, a new push sets off for the stop after, from wherever the page is */
      window.setTimeout(() => { if (id === run) { busy = false; done = performance.now(); } }, GUARD);
      window.setTimeout(() => { if (id === run) { bound = null; flow.aim = null; } }, dur * 1000 + 300);
    };
    /* STEP off: the page scrolls freely and, once it stops inside the projects, settles on the
       nearest one (settle, above). Usability testing found forced one-step scrolling disorients
       most people, so the lock is kept here but switched off. */
    const locking = () => STEP && !how && paged() && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wheel = (e: WheelEvent) => {
      if (!locking() || e.ctrlKey) return;
      /* some browsers report a mouse wheel in lines or pages, not pixels */
      const dy = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? innerHeight : 1), mag = Math.abs(dy);
      if (Math.abs(e.deltaX) > mag) return;
      const now = performance.now(), gap = now - lastWheel, d = dy > 0 ? 1 : -1; lastWheel = now;
      const avg = mags.length ? mags.reduce((a, b) => a + b, 0) / mags.length : 0;
      mags.push(mag); if (mags.length > 4) mags.shift();
      if (busy) {
        /* turning round is taken almost at once: a glide never reverses, so it can only be meant */
        if (d === dir || now - started < 120) { e.preventDefault(); e.stopPropagation(); return; }
        busy = false; done = 0;
      }
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
      if (!locking() || busy && e.repeat || e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable]")) return;
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

  /* The bar gets out of the way while reading: it slides off (.hid) when the page scrolls down and
     comes back as soon as it scrolls up. Away from the top of the page (.sc) it has a solid backing. */
  useEffect(() => {
    let last = scrollY;
    const on = () => {
      const el = root.current, y = scrollY; if (!el) return;
      el.classList.toggle("sc", y > 24);
      if (y < 80) el.classList.remove("hid");
      else if (Math.abs(y - last) > 6) el.classList.toggle("hid", y > last);
      if (Math.abs(y - last) > 6 || y < 80) last = y;
    };
    on(); addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, [page]);

  /* one row of the lists under the projects */
            const more = (m: (typeof MORE)[number]) => {
                const row = (
                  <>
                    <span className="i">{m.when}</span>
                    <span className="n">{m.name}<em>{m.role}{m.role === "Paper" && <> · {m.tags}</>}{m.org && <> · {m.org}</>}</em></span>
                    <span className="b">{m.body}</span>
                    <span className="go">{m.href ? "↗" : ""}</span>
                  </>
                );
                return <li key={m.name} data-rv>{m.href ? <a href={m.href} {...out}>{row}</a> : <div>{row}</div>}</li>;
            };

  const bar = (
    <header className="st-bar">
      <div className="st-left">
        <a className="st-mark" href={href(null)} onClick={go(null)}>Adam Zhu</a>
        {proj && <a className="st-pill st-back" href={`${href(null)}#projects`} onClick={go(null, "projects")}><i>←</i> All projects</a>}
      </div>
      <div className="st-theme" role="group" aria-label="Theme">
        <button type="button" className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")}>dark</button>
        <button type="button" className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")}>light</button>
      </div>
      <nav>
        {!proj && <a className="st-pill" href={`${href(null)}#projects`} onClick={go(null, "projects")}>Projects</a>}
        <a className="st-pill" href="/Adam-Zhu-Resume.pdf" {...out}>Resume <i>↗</i></a>
        <a className="st-pill acc" href={LINKS[0].href}>Email</a>
      </nav>
    </header>
  );

  const S = proj ? STORY[proj.demo] : undefined;
  if (proj && S) {
    return (
      <div className="st pj story ready" ref={root} key={proj.id} style={{ "--accent": proj.accent } as CSSProperties}>
        <style>{CSS}</style>
        {bar}
        <div className="pj-bg" aria-hidden="true" />
        <main className="pj-main">
          <div className="pj-head">
            <div>
              <h1 aria-label={proj.name}><span aria-hidden="true">{[...proj.name].map((ch, i) => <span key={i} className={`ch${proj.split != null && i >= proj.split ? " ac" : ""}`} style={{ "--i": i } as CSSProperties}>{ch}</span>)}</span></h1>
              <p className="what">{proj.what}</p>
              <div className="st-pills">{S.links.map(l => <a key={l.label} className="st-pill" href={l.href} {...out}>{l.label} <i>↗</i></a>)}</div>
            </div>
            <dl className="pj-strip">{S.strip.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          </div>

          {S.shots && <section className={`pj-shots ${proj.demo}`} aria-label={`Screenshots of ${proj.name}`}>
            <h2>What it looks like</h2>
            <div className="row">{S.shots.map((s, i) => <figure key={s.src} style={{ "--r": s.w / s.h } as CSSProperties}><img src={s.src} width={s.w} height={s.h} alt={s.cap} loading="lazy" /><figcaption><span>{i + 1}</span>{s.cap}</figcaption></figure>)}</div>
          </section>}

          <section className="pj-why">
            <h2 data-rv>{S.whyTitle}</h2>
            <div>
              <p data-rv style={d(1)}>{S.whyShort}</p>
              <details data-rv style={d(2)}><summary>The longer version</summary>{S.why.map((t, i) => <p key={i}>{t}</p>)}</details>
            </div>
          </section>

          <section className="pj-how" style={{ "--n": S.how.length } as CSSProperties}>
            <div className="pj-howin">
              <div className="pj-stps">
                <h2>How it works</h2>
                <div className="stps">
                  {S.how.map((h, i) => (
                    <article key={h.name} className={`stp${i === hw ? " on" : ""}`} aria-hidden={hw >= 0 && i !== hw}>
                      <span>{two(i + 1)} / {two(S.how.length)}</span>
                      <h3>{h.name}</h3>
                      <p>{h.short}</p>
                      <p className="fact"><b>{h.fact[0]}</b><span>{h.fact[1]}</span></p>
                    </article>
                  ))}
                </div>
                <div className="pj-ticks">{S.how.map((h, i) => <button type="button" key={h.name} className={i === hw ? "on" : ""} aria-current={i === hw ? "step" : undefined} onClick={() => setAt({ i })}>{h.name}</button>)}</div>
              </div>
              <div className={`pv ${proj.demo}`}><Fit width={PV[proj.demo]}>{proj.demo === "clarity" ? <Clarity loop onStage={setStg} at={at} /> : <TrueLine loop onStage={setStg} at={at} />}</Fit></div>
            </div>
          </section>

          <section className="pj-hard">
            <h2 data-rv>What was hard</h2>
            {S.hard.map((x, i) => (
              <article key={x.name} data-rv>
                <div>
                  <span>{two(i + 1)}</span>
                  <h3>{x.name}</h3>
                  <p>{x.sum}</p>
                  <details><summary>The full story</summary><p>{x.body}</p></details>
                </div>
                {x.changes.length > 0 && <ul>{x.changes.map(c => <li key={c.label}><small>{c.label}</small><b>{c.from && <><em>{c.from}</em><i>→</i></>}{c.to}</b></li>)}</ul>}
              </article>
            ))}
          </section>

          <section className="pj-stands">
            <h2 data-rv>Where it stands</h2>
            <dl className="figs">{S.stands.map(([k, v], i) => <div key={k} data-rv style={d(i)}><dd>{k}</dd><dt>{v}</dt></div>)}</dl>
            {S.made && <p className="made" data-rv>{S.made}</p>}
            <h2 data-rv>What’s next</h2>
            <ol className="nexts">{S.next.map(([k, v], i) => <li key={k} data-rv style={d(i)}><b>{k}</b><p>{v}</p></li>)}</ol>
          </section>

          <div className="pj-ret" data-rv><a className="st-pill st-back" href={`${href(null)}#projects`} onClick={go(null, "projects")}><i>←</i> Return to all projects</a></div>
        </main>
      </div>
    );
  }

  if (proj) {
    return (
      <div className="st pj ready" ref={root} key={proj.id} style={{ "--accent": proj.accent } as CSSProperties}>
        <style>{CSS}</style>
        {bar}
        <div className="pj-bg" aria-hidden="true" />
        <main className="pj-main">
          <div className="pj-top">
            <span />
            <span className="pj-idx"><b>{two(cur + 1)}</b> / {two(WORK.length)}</span>
          </div>

          <div className="pj-head">
            <div>
              <h1 aria-label={proj.name}><span aria-hidden="true">{[...proj.name].map((ch, i) => <span key={i} className={`ch${proj.split != null && i >= proj.split ? " ac" : ""}`} style={{ "--i": i } as CSSProperties}>{ch}</span>)}</span></h1>
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

          <div className="pj-ret" data-rv><a className="st-pill st-back" href={`${href(null)}#projects`} onClick={go(null, "projects")}><i>←</i> Return to all projects</a></div>
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
            <Decode text="Carnegie Mellon University" on={ready} delay={200} /><br />
            <Decode text="Statistics and Machine Learning" on={ready} delay={350} />
          </p>
          <p className="seek">{SEEKING}</p>
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
              <li key={w.id} className="st-item" style={{ "--accent": w.accent } as CSSProperties}>
                <article className="card" data-card={slug(w)} onClick={e => { if (!(e.target as HTMLElement).closest("a, button")) go(slug(w))(e); }}>
                  <div className="tx">
                    <div>
                      <p className="kind">{w.kind}</p>
                      <h3>{w.split != null ? <>{w.name.slice(0, w.split)}<span className="ac">{w.name.slice(w.split)}</span></> : w.name}</h3>
                    </div>
                    <div>
                      <p className="what">{w.what}</p>
                      {w.more && <p className="more">{w.more}</p>}
                      {w.stack && <p className="stack">{w.stack}</p>}
                      <p className="by">{[w.role, w.when].filter(Boolean).join(" · ")}</p>
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
        {/* the rest, as two plain lists: where I have worked, then smaller things I made */}
        {GROUPS.map(g => (
          <div className="st-grp" key={g.title}>
            <h2 data-rv>{g.title}</h2>
            <ol className="st-rows">
              {MORE.filter(m => g.lead.includes(m.name)).map(more)}
              {g.nist && WORK.filter(w => !FEAT.includes(w)).map(w => (
                <li key={w.id} data-rv>
                  <a href={href(slug(w))} onClick={go(slug(w))}>
                    <span className="i">{w.when}</span>
                    <span className="n">{w.name}<em>{w.kind}</em></span>
                    <span className="b">{w.result}</span>
                    <span className="go">→</span>
                  </a>
                </li>
              ))}
              {MORE.filter(m => g.names.includes(m.name)).map(more)}
            </ol>
          </div>
        ))}
      </section>

      {/* the page ends on how to reach him: one panel, a labelled row per route, the address written out */}
      <section className="st-sec st-contact" id="contact">
        <div className="st-grp">
          <h2 data-rv>Contact</h2>
          <p className="avail" data-rv>{SEEKING}</p>
          <ul className="st-ct">
            <li data-rv>
              <a href={LINKS[0].href}><span className="i">Email</span><span className="n">{MAIL}</span><span className="go">→</span></a>
              <button type="button" className="cp" onClick={copy} aria-live="polite">{copied ? "Copied" : "Copy"}</button>
            </li>
            {CONTACT.map(([label, shown]) => { const l = LINKS.find(x => x.label === label)!; return (
              <li key={label} data-rv><a href={l.href} {...out}><span className="i">{label}</span><span className="n">{shown}</span><span className="go">↗</span></a></li>
            ); })}
          </ul>
        </div>
        <p className="st-end"><span>Adam Zhu, Pittsburgh</span><span>Updated November 2026</span></p>
      </section>
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
.st-pill:active { transform: scale(.95); }
/* hovering anything clickable in the bar lifts it a little, pressing pushes it in */
.st-bar .st-pill:hover, .st-mark:hover { transform: translateY(-2px) scale(1.04); }
.st-bar .st-pill:active, .st-mark:active, .st-theme button:active { transform: scale(.94); }
.st-mark { transition: transform .25s cubic-bezier(.2, .7, .2, 1), background .25s; border-radius: 12px; }
.st-mark:hover { background: color-mix(in srgb, var(--ink) 10%, transparent); }
.st-pill.acc { background: var(--acc); border-color: var(--acc); color: var(--onacc); }
.st-pill.acc:hover { background: var(--ink); border-color: var(--ink); color: var(--bg); }

/* anything reached with the Tab key shows a clear outline */
.st a:focus-visible, .st button:focus-visible, .st summary:focus-visible { outline: 2px solid var(--acc); outline-offset: 3px; }

/* bar */
.st-bar { position: fixed; z-index: 30; top: 0; left: 0; right: 0; height: 64px; padding: 0 22px; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
  border: 1px solid transparent; border-radius: 22px; opacity: 0; transform: translateY(-10px); transition: opacity .6s .15s, transform .6s .15s cubic-bezier(.2,.7,.2,1); }
.st.ready .st-bar { opacity: 1; transform: none; transition: opacity .6s, transform .5s cubic-bezier(.16, 1, .3, 1), background .35s, border-color .35s, top .5s cubic-bezier(.16, 1, .3, 1), left .5s cubic-bezier(.16, 1, .3, 1), right .5s cubic-bezier(.16, 1, .3, 1), height .5s cubic-bezier(.16, 1, .3, 1), padding .5s cubic-bezier(.16, 1, .3, 1); }
/* Scrolling down slides the bar away so nothing sits on top of the page; scrolling up brings it back.
   When it is showing anywhere but the top of the page it is a panel like the others on the site: set in
   from the edges, squircle corners, a thin border and the same frosted fill as the cards and lists. */
.st.ready.hid .st-bar { transform: translateY(-140%); }
.st.sc .st-bar { top: 10px; left: 22px; right: 22px; height: 56px; padding: 0 10px 0 16px; border-color: var(--ln); background: color-mix(in srgb, var(--card) 93%, transparent); -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px); }
@supports (corner-shape: squircle) { .st-bar { corner-shape: squircle; border-radius: 40px; } }
.st-left, .st-bar nav { display: flex; align-items: center; }
.st-left { justify-self: start; gap: 12px; margin-left: -12px; }
.st-bar nav { justify-self: end; gap: 8px; }
.st-theme { display: flex; align-items: center; padding: 3px; border: 1px solid var(--ln); border-radius: 999px; background: color-mix(in srgb, var(--bg) 70%, transparent); }
.st-mark { display: inline-flex; align-items: center; height: 34px; padding: 0 12px; font-size: 16px; font-weight: 500; letter-spacing: -.02em; }
.st-bar .st-pill { background: color-mix(in srgb, var(--bg) 70%, transparent); transition: background .3s, color .2s, border-color .45s, border-radius .55s cubic-bezier(.16, 1, .3, 1), transform .2s cubic-bezier(.2,.7,.2,1); }
.st-bar .st-pill:hover { background: var(--ink); }
.st-bar .st-pill.st-back { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.st-bar .st-pill.st-back:hover { background: var(--acc); color: var(--onacc); border-color: var(--acc); }
.st-back i { transition: transform .3s cubic-bezier(.16, 1, .3, 1); } .st-bar .st-back:hover i { transform: translateX(-4px); }
.st-bar .st-pill.acc { background: var(--acc); }
.st-bar .st-pill.acc:hover { background: var(--ink); }
.st-theme button { all: unset; cursor: pointer; font-size: 12px; height: 30px; line-height: 30px; padding: 0 14px; border-radius: 999px; color: var(--mut); transition: background .25s, color .25s, transform .25s cubic-bezier(.2, .7, .2, 1), border-radius .55s cubic-bezier(.16, 1, .3, 1); }
.st-theme button:not(.on):hover { color: var(--ink); background: color-mix(in srgb, var(--ink) 14%, transparent); transform: translateY(-1px) scale(1.07); }
.st-theme button.on { background: var(--ink); color: var(--bg); }

/* first screen */
.st-hero { position: relative; height: 100svh; min-height: 620px; overflow: hidden; }
.st-dots { position: fixed; z-index: 0; inset: 0; width: 100%; height: 100%; color: var(--ink); pointer-events: none; opacity: var(--dq, 1); }
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
.st.ready .st-id .st-links a { animation: st-pop .75s cubic-bezier(.2, 1.35, .35, 1) calc(.55s + var(--i) * 70ms) both; }
@keyframes st-pop { from { opacity: 0; transform: translateY(14px) scale(.72); filter: blur(5px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes st-rule { from { transform: scaleX(0); } to { transform: none; } }
@keyframes st-rise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: none; } }
.st.now .st-hero * { animation-duration: 1ms !important; animation-delay: 0s !important; }
.st-id { position: absolute; left: 0; right: 0; top: calc(45% + clamp(32px, 6.2vw, 108px) + 6px); display: grid; justify-items: center; gap: 22px; padding: 0 22px; text-align: center; }
.st-id p { margin: 0; font-size: clamp(17px, 1.5vw, 23px); line-height: 1.3; letter-spacing: -.02em; }
.st-id .seek { margin-top: -10px; font-size: clamp(14px, 1.05vw, 16px); letter-spacing: 0; color: var(--mut); max-width: 30em; opacity: 0; transition: opacity .8s .7s; } .st.ready .st-id .seek { opacity: 1; }
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
.st-item .card { display: grid; cursor: pointer; border-radius: 30px; overflow: hidden; background: color-mix(in srgb, var(--card) 58%, transparent); -webkit-backdrop-filter: blur(7px); backdrop-filter: blur(7px); border: 1px solid var(--ln); }
.st-item .tx { display: flex; flex-direction: column; gap: 22px; min-width: 0; padding: 26px 24px 28px; background: color-mix(in srgb, var(--ink) 4.5%, transparent); }
.st-item .kind { margin: 0 0 14px; font-size: 14px; line-height: 1.3; color: var(--mut); }
.st-item h3 { margin: 0; width: fit-content; font-weight: 500; font-size: clamp(44px, 9vw, 64px); line-height: .95; letter-spacing: -.055em; }
.st-item .what { margin: 0; font-size: clamp(18px, 1.5vw, 23px); line-height: 1.3; letter-spacing: -.02em; max-width: 22em; }
.st-item .more { margin: 12px 0 0; font-size: 15.5px; line-height: 1.42; color: var(--mut); max-width: 30em; }
.st-item .stack { margin: 16px 0 0; font-size: 14px; line-height: 1.3; }
.st-item .by { margin: 6px 0 0; font-size: 14px; line-height: 1.3; color: var(--mut); }
.st-item .acts { margin: 26px 0 0; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.st-item .open { display: inline-flex; align-items: center; gap: 22px; height: 50px; padding: 0 22px; border-radius: 999px; font-size: 16px; background: var(--ink); color: var(--bg); transition: background .25s, color .25s; }
.st-item .open i { transition: transform .3s cubic-bezier(.16, 1, .3, 1); }
.st-item .open:hover { background: var(--acc); color: var(--onacc); } .st-item .card:hover .open i { transform: translateX(6px); }
.st-item .acts .st-pill { height: 50px; padding: 0 20px; font-size: 15px; }
/* the demo sits straight on the card's dark side: no panel, no frame round it */
.st .pv { position: relative; aspect-ratio: 4 / 3; overflow: hidden; background: #070708; }
/* on a home card in the dark theme the demo side is glass too, so the dots show behind the whole card */
:root:not([data-theme="light"]) .st-item .pv { background: color-mix(in srgb, #070708 68%, transparent); }
/* in the light theme the dark demo is a screen set into the light card, with a margin round it, and not a black half of the card */
:root[data-theme="light"] .st-item .pv { margin: 10px; border-radius: 20px; background: #121214; }
:root[data-theme="light"] .pj-how .pv { background: #121214; }
@media (min-width: 1000px) and (min-height: 700px) { :root[data-theme="light"] .st-item .pv { margin: 14px; height: calc(100% - 28px); border-radius: 26px; } }
@supports (corner-shape: squircle) { :root[data-theme="light"] .st-item .pv { corner-shape: squircle; border-radius: 50px; } }
.st .pv .win { background: none; box-shadow: none; padding: 0; }
.st .pv .win > .edge, .st .pv .win > .corner { display: none; }
.st-fit { position: absolute; inset: clamp(16px, 2.2vw, 40px); } .st-fit > div { transform-origin: 0 0; pointer-events: none; }
/* a preview shows the demo's picture, large; its readouts and controls are on the project's page */
.st .pv .democtl, .st .pv .nstats { display: none; }
/* TrueLine's measurements count up in a column beside the throw */
.st .pv .tlgrid { display: grid; grid-template-columns: minmax(0, 1fr) 190px; gap: 40px; align-items: center; }
.st .pv .app { max-width: 100%; }
/* the footage has the middle of the screen to itself until the lane leaves it for the plan view, then moves aside */
.st .pv .tlgrid .app { transition: transform .8s cubic-bezier(.45, 0, .1, 1); }
.st .pv .solo .tlgrid .app { transform: translateX(calc(27.85% + 115px)); }
@media (prefers-reduced-motion: reduce) { .st .pv .tlgrid .app { transition: none; } }
.st .pv .nums { grid-template-columns: 1fr; gap: 2px; margin: 0 0 30px; }
/* nothing is shown until the throw has been tracked; then each one arrives as it is read off */
.st .pv .nums .num { opacity: 0; transform: translateY(10px); transition: opacity .25s, transform .25s, border-color .5s; }
.st .pv .nums .num.on { opacity: 1; transform: none; transition: opacity .5s, transform .7s cubic-bezier(.16, 1, .3, 1), border-color .5s; }
.st .pv .nums .num { padding: 11px 0 9px; } .st .pv .nums .num b { font-size: 27px; } .st .pv .nums .num small { font-size: 12px; }
@supports (corner-shape: squircle) { .st-item .card { corner-shape: squircle; border-radius: 64px; } .pj-how .pv, .pj-hard ul { corner-shape: squircle; border-radius: 56px; } }

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
  .st-item .kind, .st-item h3, .st-item .what, .st-item .more, .st-item .stack, .st-item .by, .st-item .acts { opacity: 0; transform: translateY(22px); transition: opacity .3s, transform .4s; }
  .st-item .pv .st-fit { opacity: 0; transform: scale(.96); transition: opacity .3s, transform .4s; }
  .st-item .near :is(.kind, h3, .what, .more, .stack, .by, .acts) { opacity: 1; transform: none; transition: opacity .7s var(--dl, 0s), transform .9s cubic-bezier(.16, 1, .3, 1) var(--dl, 0s); }
  .st-item .near h3 { --dl: .06s; } .st-item .near .what { --dl: .14s; } .st-item .near .more { --dl: .17s; } .st-item .near .stack, .st-item .near .by { --dl: .2s; } .st-item .near .acts { --dl: .26s; }
  .st-item .near .pv .st-fit { opacity: 1; transform: none; transition: opacity .8s .1s, transform 1.1s cubic-bezier(.16, 1, .3, 1) .1s; }
}
@media (min-width: 1000px) and (min-height: 700px) { .st.pj .pj-head { min-height: calc(100svh - 175px - 44px); margin-bottom: 150px; } }

/* card to page: the card grows into the page's sheet, then the page's parts come in */
.st-bar { view-transition-name: st-bar; }
.pj-bg { position: fixed; inset: 0; z-index: -1; background: var(--bg); view-transition-name: pj-bg; }
.pj-main { view-transition-name: pj-main; }
::view-transition-group(pj-bg), ::view-transition-group(pj-name) { animation-duration: .55s; animation-timing-function: cubic-bezier(.45, 0, .1, 1); }
::view-transition-old(pj-bg), ::view-transition-new(pj-bg) { width: 100%; height: 100%; object-fit: cover; object-position: 50% 0; animation-duration: .35s; }
::view-transition-old(pj-name), ::view-transition-new(pj-name) { height: 100%; width: auto; animation-duration: .3s; }
::view-transition-old(root), ::view-transition-new(root) { animation-duration: .35s; }
::view-transition-new(pj-main):only-child { animation: pj-in .01s linear .26s both; }
::view-transition-old(pj-main):only-child { animation: pj-out .2s ease both; }
::view-transition-old(pj-main):not(:only-child) { animation: pj-out .2s ease both; }
::view-transition-new(pj-main):not(:only-child) { animation: pj-in .01s linear .2s both; }
@keyframes pj-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes pj-out { to { opacity: 0; transform: translateY(-24px); } }
.pj .pj-top, .pj .pj-head .what, .pj .pj-head .kind, .pj .pj-head .st-pills, .pj .pj-stat { animation: st-rise .95s cubic-bezier(.16, 1, .3, 1) both; }
.pj .pj-top { animation-delay: .26s; } .pj .pj-head .what { animation-delay: .32s; } .pj .pj-head .kind { animation-delay: .38s; } .pj .pj-head .st-pills { animation-delay: .44s; } .pj .pj-stat { animation-delay: .44s; }
.st.pj h1 { overflow: hidden; padding: .1em .04em .04em; }
.st.pj h1 .ch { display: inline-block; animation: st-letter 1.15s cubic-bezier(.16, 1, .3, 1) calc(.2s + var(--i) * 40ms) both; transform-origin: 0 100%; }
.st.pj.via h1 .ch { animation: none; }   /* arriving from its card, the name is carried across and does not rise in again */
.pj .pj-demo { animation: pj-demo 1.1s cubic-bezier(.16, 1, .3, 1) .5s both; }
@keyframes pj-demo { from { opacity: 0; transform: translateY(70px) scale(.93); clip-path: inset(14% 8% 14% 8% round 28px); } to { opacity: 1; transform: none; clip-path: inset(0 0 0 0 round 0px); } }

/* a project's own page */
.st.pj { --hl: var(--ink); min-height: 100svh; }
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
/* each project's own colour, kept small: a dot on its card, and the counters and arrows on its page.
   --at is the colour pulled toward the text colour so it stays readable in both themes */
.st { --at: color-mix(in srgb, var(--accent, var(--mut)) 72%, var(--ink)); }
.st-item, .st.story { --at: color-mix(in srgb, var(--accent) 78%, var(--ink)); }
:root[data-theme="light"] .st-item, :root[data-theme="light"] .st.story { --at: color-mix(in srgb, var(--accent) 52%, var(--ink)); }
.st-item .kind::before { content: ""; display: inline-block; width: 7px; height: 7px; margin-right: 9px; border-radius: 50%; background: var(--at); vertical-align: .08em; }
.st-item .kind, .story .stp > span, .story .stp .fact b, .story .pj-hard article span, .story .pj-hard li i, .story .pj-shots figcaption span, .story .pj-stands .figs dd, .story .pj-strip dt { color: var(--at); }
.story .nexts li { border-top: 1px solid color-mix(in srgb, var(--at) 45%, var(--ln)); padding-top: 18px; }
.story ::selection { background: color-mix(in srgb, var(--accent) 35%, transparent); }
.st .ac { color: var(--accent); } :root[data-theme="light"] .st .ac { color: var(--at); }
.pj-ret { display: flex; justify-content: center; padding: clamp(20px, 5vh, 56px) 0 clamp(8px, 2vh, 24px); }
.pj-ret .st-pill { height: 56px; padding: 0 28px; font-size: 18px; background: var(--ink); color: var(--bg); border-color: var(--ink); }
.pj-ret .st-pill:hover { background: var(--acc); color: var(--onacc); border-color: var(--acc); }
.pj-ret .st-pill:hover i { transform: translateX(-4px); }

/* each list is a frosted panel: the dots still drift behind it, blurred and dimmed, and never cross the words */
.st-grp { padding: clamp(22px, 2.6vw, 44px) clamp(18px, 2.6vw, 44px) clamp(8px, 1vw, 16px); border-radius: 30px; border: 1px solid var(--ln); background: color-mix(in srgb, var(--bg) 58%, transparent); -webkit-backdrop-filter: blur(7px); backdrop-filter: blur(7px); }
@supports (corner-shape: squircle) { .st-grp { corner-shape: squircle; border-radius: 64px; } }
.st-grp .st-rows li:last-child > * { border-bottom: 0; }
.st-grp + .st-grp { margin-top: 28px; }
.st-grp h2 { margin: 0 0 22px; font-weight: 500; font-size: clamp(28px, 3vw, 44px); line-height: 1; letter-spacing: -.045em; }
.st-rows { border-top: 1px solid var(--ln); }
.st-rows li > * { display: grid; grid-template-columns: 150px minmax(0, 1fr) minmax(0, 1.35fr) 40px; gap: 20px; align-items: start; padding: 22px 0; border-bottom: 1px solid var(--ln); transition: padding .35s cubic-bezier(.2,.7,.2,1), background .25s; }
.st-rows li > a:hover { padding-left: 14px; padding-right: 14px; background: color-mix(in srgb, var(--ink) 5%, transparent); }
.st-rows .i { font-size: 14px; line-height: 1.3; padding-top: 7px; color: var(--mut); }
.st-rows .n { font-size: clamp(20px, 1.9vw, 27px); letter-spacing: -.035em; line-height: 1.15; }
.st-rows .b { font-size: 16px; line-height: 1.45; }
.st-rows .n em { display: block; font-style: normal; margin-top: 8px; font-size: 14px; letter-spacing: 0; line-height: 1.3; color: var(--mut); }
.st-rows .go { justify-self: end; width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--ln); display: grid; place-items: center; font-size: 12px; transition: background .2s, color .2s, border-color .2s; }
.st-rows .go:empty { visibility: hidden; }
.st-rows a:hover .go { background: var(--acc); border-color: var(--acc); color: var(--onacc); }

.st-contact { padding-bottom: 22px; }
.st-contact .avail { margin: -6px 0 26px; font-size: clamp(17px, 1.4vw, 21px); line-height: 1.4; letter-spacing: -.015em; color: var(--mut); max-width: 34em; }
.st-ct { margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--ln); }
.st-ct li { position: relative; border-bottom: 1px solid var(--ln); }
.st-ct li:last-child { border-bottom: 0; }
.st-ct a { display: grid; grid-template-columns: 150px minmax(0, 1fr) 40px; gap: 20px; align-items: center; padding: 20px 0; transition: padding .35s cubic-bezier(.2,.7,.2,1), background .25s; }
.st-ct a:hover { padding-left: 14px; padding-right: 14px; background: color-mix(in srgb, var(--ink) 5%, transparent); }
.st-ct .i { font-size: 14px; color: var(--mut); }
.st-ct .n { font-size: clamp(20px, 1.9vw, 27px); letter-spacing: -.035em; line-height: 1.15; overflow-wrap: anywhere; }
.st-ct .go { justify-self: end; width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--ln); display: grid; place-items: center; font-size: 12px; transition: background .2s, color .2s, border-color .2s; }
.st-ct a:hover .go { background: var(--acc); border-color: var(--acc); color: var(--onacc); }
.st-ct .cp { all: unset; position: absolute; right: 56px; top: 50%; transform: translateY(-50%); height: 32px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--ln); font-size: 13px; cursor: pointer; transition: background .2s, color .2s, border-color .2s, transform .2s cubic-bezier(.2,.7,.2,1); }
.st-ct .cp:hover { background: var(--ink); color: var(--bg); border-color: var(--ink); transform: translateY(calc(-50% - 2px)); }
.st-ct .cp:focus-visible { outline: 2px solid var(--acc); outline-offset: 2px; }
.st-end { display: flex; justify-content: space-between; gap: 16px; margin: 26px 0 0; padding: 0 4px; font-size: 14px; color: var(--mut); }

/* a project's page told in full: why, the pipeline stage by stage, what was hard, where it stands */
/* this page opens on its title with the reason it exists straight under it, not on a title alone at the foot of an empty screen */
.st.pj.story .pj-head { align-items: end; min-height: 0; margin-bottom: 0; padding-top: clamp(20px, 5vh, 64px); }
.st.pj.story .pj-why { min-height: 0; padding: clamp(56px, 9vh, 110px) 0 clamp(64px, 11vh, 130px); }
/* the real product, under the title: screenshots at one shared height */
.pj-shots { margin-top: clamp(36px, 7vh, 80px); padding: clamp(24px, 3vw, 48px); border-radius: 30px; border: 1px solid var(--ln); background: var(--card); --h: clamp(300px, 52vh, 520px); animation: st-rise .95s cubic-bezier(.16, 1, .3, 1) .5s both; }
@supports (corner-shape: squircle) { .pj-shots { corner-shape: squircle; border-radius: 64px; } }
.st.story .pj-shots h2 { margin-bottom: clamp(24px, 3vw, 44px); }
.pj-shots .row { display: flex; flex-wrap: wrap; justify-content: center; align-items: flex-start; gap: clamp(20px, 4vw, 72px); }
.pj-shots figure { margin: 0; width: calc(var(--h) * var(--r)); max-width: 100%; }
.pj-shots img { display: block; width: 100%; height: auto; border-radius: 22px; border: 1px solid var(--ln); background: #070708; }
@supports (corner-shape: squircle) { .pj-shots img { corner-shape: squircle; border-radius: 44px; } }
.pj-shots figcaption { display: flex; gap: 10px; margin-top: 14px; font-size: 14px; line-height: 1.35; color: var(--mut); }
.pj-shots figcaption span { color: var(--ink); font-variant-numeric: tabular-nums; }
.pj-shots.clarity .row { align-items: center; } .pj-shots.clarity figure:first-child { width: min(100%, 620px); } .pj-shots.clarity img { border-radius: 14px; }
@supports (corner-shape: squircle) { .pj-shots.clarity img { border-radius: 26px; } }
@media (prefers-reduced-motion: reduce) { .pj-shots { animation: none; } }
.pj-strip { margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 26px 28px; animation: st-rise .95s cubic-bezier(.16, 1, .3, 1) 1.2s both; }
.pj-strip > div { display: block; border: 0; padding: 0; }
.pj-strip dt { font-size: 13.5px; color: var(--mut); margin-bottom: 6px; }
.pj-strip dd { margin: 0; font-size: 17px; line-height: 1.3; letter-spacing: -.01em; }
.st.story h2 { margin: 0 0 28px; font-family: inherit; font-weight: 500; font-size: clamp(30px, 3.2vw, 48px); line-height: 1; letter-spacing: -.045em; text-transform: none; color: var(--ink); }
.pj-why { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2.1fr); gap: clamp(24px, 5vw, 80px); align-content: center; padding: clamp(56px, 10vh, 120px) 0; }
.pj-why p { margin: 0 0 1em; font-size: clamp(19px, 1.75vw, 27px); line-height: 1.38; letter-spacing: -.02em; max-width: 31em; }
.pj-why p:last-child { margin-bottom: 0; }
/* the short version is what shows; the rest opens for whoever wants it */
.story details { margin-top: 22px; }
.story summary { display: inline-flex; align-items: center; gap: 10px; height: 40px; padding: 0 16px; border-radius: 999px; border: 1px solid var(--ln); font-size: 14.5px; cursor: pointer; list-style: none; user-select: none; transition: border-color .2s, background .2s; }
.story summary::-webkit-details-marker { display: none; }
.story summary::after { content: "↓"; font-size: 13px; transition: transform .3s cubic-bezier(.16, 1, .3, 1); }
.story details[open] summary::after { transform: rotate(180deg); }
.story summary:hover { border-color: var(--ink); }
.story details > p { margin-top: 18px; animation: st-rise .6s cubic-bezier(.16, 1, .3, 1) both; }
.pj-why details > p { font-size: clamp(17px, 1.3vw, 20px); line-height: 1.48; letter-spacing: 0; color: var(--mut); max-width: 36em; }
.pj-hard details > p { color: var(--mut); }

.pj-how { margin-bottom: clamp(56px, 10vh, 120px); }
.pj-howin { display: grid; gap: 28px; }
.stps { display: grid; gap: 34px; }
.stp > span { display: block; font-size: 14px; color: var(--mut); margin-bottom: 12px; }
.stp h3 { margin: 0 0 16px; font-weight: 500; font-size: clamp(34px, 3.8vw, 60px); line-height: .98; letter-spacing: -.05em; }
.stp p { margin: 0; font-size: clamp(17px, 1.3vw, 20px); line-height: 1.45; max-width: 30em; }
.stp .fact { margin-top: 22px; display: flex; align-items: baseline; gap: 14px; }
.stp .fact b { font-weight: 500; font-size: clamp(30px, 3vw, 48px); line-height: 1; letter-spacing: -.05em; white-space: nowrap; }
.stp .fact span { font-size: 15px; line-height: 1.35; color: var(--mut); }
.pj-ticks { display: none; }
.pj-how .pv { border-radius: 30px; }

.pj-hard { padding-top: clamp(40px, 8vh, 90px); margin-bottom: clamp(56px, 10vh, 120px); }
.pj-hard article { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: clamp(24px, 5vw, 80px); align-items: center; padding: clamp(26px, 5vh, 52px) 0; }
.pj-hard article span { display: block; font-size: 14px; color: var(--mut); margin-bottom: 12px; }
.pj-hard h3 { margin: 0 0 16px; font-weight: 500; font-size: clamp(26px, 2.7vw, 42px); line-height: 1.02; letter-spacing: -.045em; max-width: 14em; }
.pj-hard p { margin: 0; font-size: clamp(17px, 1.3vw, 20px); line-height: 1.48; max-width: 34em; }
.pj-hard ul { margin: 0; padding: clamp(22px, 2.6vw, 38px); list-style: none; display: grid; gap: 22px; border-radius: 28px; background: var(--card); border: 1px solid var(--ln); }
.pj-hard small { display: block; font-size: 14px; line-height: 1.35; color: var(--mut); margin-bottom: 8px; }
.pj-hard li b { display: block; font-weight: 500; font-size: clamp(24px, 2.5vw, 38px); line-height: 1.05; letter-spacing: -.045em; }
.pj-hard li em { font-style: normal; color: var(--mut); } .pj-hard li i { font-style: normal; margin: 0 .35em; color: var(--mut); }

.pj-stands { margin-bottom: clamp(56px, 10vh, 120px); }
.pj-stands .figs { margin: 0 0 30px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: clamp(18px, 2.4vw, 40px); }
.pj-stands .figs > div { display: block; border: 0; padding: 0; }
.pj-stands dd { margin: 0 0 12px; font-weight: 500; font-size: clamp(44px, 5.2vw, 88px); line-height: .92; letter-spacing: -.06em; white-space: nowrap; }
.pj-stands dt { font-size: 15.5px; line-height: 1.4; color: var(--mut); max-width: 20em; }
.pj-stands .made { margin: 0 0 clamp(48px, 9vh, 100px); font-size: clamp(18px, 1.5vw, 23px); line-height: 1.4; letter-spacing: -.015em; max-width: 34em; }
.pj-stands .nexts { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: clamp(18px, 2.4vw, 40px); }
.pj-stands .nexts b { display: block; font-weight: 500; font-size: clamp(20px, 1.8vw, 26px); letter-spacing: -.03em; margin-bottom: 10px; }
.pj-stands .nexts p { margin: 0; font-size: 16.5px; line-height: 1.45; color: var(--mut); }

/* with room, the pipeline pins: the demo holds on one stage while its words sit beside it, and each scroll moves one stage on */
@media (min-width: 1000px) and (min-height: 700px) {
  .pj-why { min-height: calc(100vh - 64px); padding: 0; }
  .pj-how { height: calc(100vh - 64px); }
  .pj-howin { position: sticky; top: 64px; height: calc(100vh - 64px); grid-template-columns: minmax(0, 33fr) minmax(0, 67fr); gap: clamp(24px, 3vw, 56px); padding: 12px 0 26px; }
  .pj-stps { display: grid; grid-template-rows: auto minmax(0, 1fr) auto; min-height: 0; }
  .st.story .pj-stps h2 { margin: 6px 0 0; font-size: 15px; font-weight: 400; letter-spacing: 0; color: var(--mut); }
  .stps { position: relative; display: block; }
  .stp { position: absolute; left: 0; right: 0; top: 50%; transform: translateY(calc(-50% + 20px)); opacity: 0; pointer-events: none; transition: opacity .25s, transform .35s; }
  .stp.on { opacity: 1; transform: translateY(-50%); pointer-events: auto; transition: opacity .6s .12s, transform .8s cubic-bezier(.16, 1, .3, 1) .12s; }
  .pj-ticks { display: flex; flex-wrap: wrap; gap: 6px; }
  .pj-ticks button { height: 32px; padding: 0 13px; border: 1px solid var(--ln); border-radius: 999px; background: none; font: inherit; font-size: 13px; color: var(--mut); cursor: pointer; white-space: nowrap; transition: background .3s, color .3s, border-color .3s; }
  .pj-ticks button:hover { color: var(--ink); border-color: var(--ink); }
  .pj-ticks button.on { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .pj-how .pv { aspect-ratio: auto; height: 100%; min-height: 0; }
}
@media (max-width: 900px) {
  .pj-why, .pj-hard article { grid-template-columns: 1fr; }
  .pj-stands .figs { grid-template-columns: 1fr 1fr; } .pj-stands .nexts { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) { .pj-strip { animation: none; } .stp, .stp.on { transition: none; } }
@media (max-width: 820px) {
  .st-bar { grid-template-columns: auto 1fr; padding: 0 14px; } .st-bar nav { display: none; } .st-theme { justify-self: end; }
  .st-hero h1 { top: 30%; font-size: 19vw; }
  .st-id { top: calc(30% + 9.5vw + 14px); padding: 0 14px; gap: 18px; }
  .pj-main { padding: 80px 14px 14px; }
  .pj-head, .pj-cols { grid-template-columns: 1fr; gap: 28px; }
  .pj-steps li { grid-template-columns: 30px minmax(0, 1fr); } .pj-steps p { grid-column: 2; }
  .st-hud .tl { left: 14px; } .st-hud .tr { right: 14px; top: 46px; } .st-hud .bl { left: 14px; bottom: 18px; }
  .st-sec { padding-left: 14px; padding-right: 14px; }
  .st-head { grid-template-columns: 1fr; gap: 16px; align-items: start; }
  .st-ct a { grid-template-columns: minmax(0, 1fr) 34px; gap: 6px 14px; } .st-ct .i { grid-column: 1; } .st-ct .n { grid-column: 1; } .st-ct .go { grid-column: 2; grid-row: 1 / span 2; }
  .st-ct .cp { position: static; transform: none; margin: 0 0 16px; } .st-ct .cp:hover { transform: none; }
  .st-rows li > * { grid-template-columns: minmax(0, 1fr) 34px; gap: 8px 14px; }
  .st-rows .i { grid-column: 1; grid-row: 1; padding-top: 0; }
  .st-rows .n { grid-column: 1; grid-row: 2; }
  .st-rows .b { grid-column: 1; grid-row: 3; }
  .st-rows .go { grid-column: 2; grid-row: 2; }
}
@media (prefers-reduced-motion: reduce) {
  .st-left, .st-bar nav, .st-theme, .st-bar .st-pill, .st-theme button, .st-mark { transition: none; }
  .st-in, [data-rv], .st-bar { transition: none; filter: none; transform: none; }
  .st-hero h1 .ch, .st-id .st-links a { animation: none !important; opacity: 1; transform: none; }
  .st-hero h1, .st-id { opacity: 1; }
  .st-title { height: auto; } .st-tin { position: static; height: auto; padding: 90px 22px 30px; opacity: 1; transform: none; } .st-hint { display: none; }
  .st-dots { position: absolute; }
  [data-rv].mask > span { transform: none; transition: none; }
  .pj .pj-top, .pj .pj-head .what, .pj .pj-head .kind, .pj .pj-head .st-pills, .pj .pj-stat, .st.pj h1 .ch, .pj .pj-demo { animation: none; }
}
`;
