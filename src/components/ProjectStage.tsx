import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { A, out } from "../lib/router";
import { morphInto } from "../lib/morph";
import { prefersReducedMotion } from "../lib/useReveal";
import { TrueLine } from "./TrueLine";
import { Clarity } from "./Clarity";
import { CLARITY_SITE } from "../data/clarity";
import { PROJECTS } from "../data/projects";


/* Where the stage pins: a real desktop window. Below this the same markup lies flat as a
   stacked list, every project open and its demo under it. Reduced motion still pins, since
   holding still is not motion; the projects just swap without the wipe (see index.css). */
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

export const PROJECTS_INTRO = "An iPhone app on the App Store, a Mac app built at a hackathon, and a summer of research at NIST.";
const KINDS = ["iPhone app, on the App Store", "Mac app, HackCMU 2026", "Research internship, summer 2026"];

/* The automated share of all 1,039,639 portal requests at each stage of the cleaning, checked
   against the analysis output. Only aggregates: no IPs, schedules or search phrases. The last
   figure is a floor, since a scraper spread over many IPs cannot be seen one IP at a time. */
const NIST_STEPS = [
  { label: "User\u2011agent only", v: 21.7 },
  { label: "+ behavioral rules", v: 30.6 },
  { label: "+ rules after the label audit", v: 41.9 },
];

/** How the measured automated share grew as the cleaning improved, on a full 0 to 100 axis
    so the human majority stays in view, plus the run's scale. */
export function NistFigure({ on }: { on: boolean }) {
  return (
    <div className={`demo nist${on ? " on" : ""}`}>
      <div className="win appwin nistwin">
        <p className="nk">Share of requests classified as automated</p>
        <div className="nchart" role="img"
             aria-label="Share of requests classified as automated: 21.7% from the user-agent alone, 30.6% with behavioral rules, 41.9% with the rules after the label audit, a lower bound.">
          <div className="axis" aria-hidden="true">
            {[0, 25, 50, 75, 100].map(t => <span key={t} style={{ "--t": t } as CSSProperties}>{t}%</span>)}
          </div>
          {NIST_STEPS.map((s, i) => (
            <div key={s.label} className={`br${i === NIST_STEPS.length - 1 ? " after" : ""}`} style={{ "--d": i } as CSSProperties}>
              <span>{s.label}</span>
              <div className="track"><i style={{ "--w": s.v } as CSSProperties} /><b>{s.v}%</b></div>
            </div>
          ))}
        </div>
        <p className="nnote">41.9% is a lower bound. With the same features, the cleaner labels alone lifted a logistic regression from F1 0.49 to 0.79.</p>
        <dl className="nstats">
          <div><dt>Requests</dt><dd>1.04M</dd></div>
          <div><dt>Days</dt><dd>271</dd></div>
          <div><dt>Unique IPs</dt><dd>117K</dd></div>
          <div><dt>Random forest F1, no user-agent</dt><dd>0.94</dd></div>
          <div><dt>Searches with no results</dt><dd>21.5%</dd></div>
          <div><dt>Query-failure classifier F1</dt><dd>0.80</dd></div>
        </dl>
      </div>
    </div>
  );
}

/**
 * The projects as one pinned stage. It opens on a card of its own, the section's name and
 * the three projects in a row; scrolling on hands the stage to each project in turn: the
 * active one opens on the left, the others fold to their names, and its demo takes the
 * right. The page scrolls normally the whole way; the scroll only decides what is up.
 * `active` is -1 while the opening card is.
 */
export function ProjectStage({ active, onActive }: { active: number; onActive: (i: number) => void }) {
  const pinned = usePinned();
  const track = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const n = PROJECTS.length;
  const steps = pinned ? n + 1 : n;                                  // the opening card is a step of its own

  // pinned: the position inside the track picks the project and fills its progress line
  useEffect(() => {
    const el = track.current;
    if (!el || !pinned) return;
    let raf = 0, last = -1;
    const read = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const run = el.offsetHeight - innerHeight;
      const seg = run / (n + 1);
      const s = Math.min(Math.max(-r.top, 0), run - 1);
      const k = Math.min(n, Math.floor(s / seg));
      el.style.setProperty("--progress", String(Math.min(1, (s - k * seg) / seg)));
      const i = k - 1;
      /* the card sinks away over the back half of its step */
      const q = k > 0 ? 1 : Math.min(1, Math.max(0, (s / seg - .5) / .5));
      const e = prefersReducedMotion() ? (q < 1 ? 0 : 1) : q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
      el.style.setProperty("--intro", e.toFixed(4));
      if (i !== last) { last = i; onActive(i); }
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(read); };
    read();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, [pinned, n, onActive]);

  // stacked: whichever project owns the middle of the screen is the current one
  useEffect(() => {
    if (pinned) return;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) onActive(Number((e.target as HTMLElement).dataset.i));
    }), { rootMargin: "-45% 0px -45% 0px" });
    // the demo counts as much as the name above it, so the chip stays right while you read it
    track.current?.querySelectorAll("[data-i]").forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [pinned, onActive]);

  const go = (i: number) => {
    const el = track.current;
    if (!el || !pinned) { items.current[i]?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" }); return; }
    const seg = (el.offsetHeight - innerHeight) / (n + 1);
    scrollTo({ top: el.getBoundingClientRect().top + scrollY + (i + 1) * seg + 2, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  /* the door into TrueLine's page: the name is lifted off the list and flown to the heading
     its own page keeps for it, so the two read as one object rather than two screens */
  const tlTitle = useRef<HTMLSpanElement>(null);
  const openTrueLine = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || !tlTitle.current) return;
    e.preventDefault();
    morphInto("/trueline/", tlTitle.current, items.current[0]);
  };

  const body: ReactNode[] = [
    <>
      <p className="desc">
        A bowling ball tracker for iPhone. Prop the phone behind the approach, bowl, and it measures
        the throw: where the ball crossed the arrows, where it hooked, how fast it left your hand, and
        the board and angle it entered on. Everything runs on the phone.
      </p>
      <p className="meta">Swift, Vision, Core ML · on the App Store since August&nbsp;2026</p>
      <p className="result">Tracked the ball down the full lane on 6 of 6 unseen clips; within 1 board and 1–2% on speed against the Python prototype.</p>
      <div className="ctas">
        <a className="store" {...out} href="https://apps.apple.com/us/app/trueline-bowling-ball-tracker/id6801953797">
          App Store<i aria-hidden="true">&#8599;</i>
        </a>
        <A className="more" href="/trueline/" onClick={openTrueLine}>How it works<i aria-hidden="true">&#8594;</i></A>
      </div>
    </>,
    <>
      <p className="desc">
        A macOS menu-bar app that explains any problem on your screen. Press one hotkey, drag a box
        around the problem, and a written explanation arrives in seconds, then an animation made for
        that exact problem about a minute later.
      </p>
      <p className="meta">Python, Go, LangGraph, Manim · HackCMU 2026</p>
      <p className="result">Built in two days at HackCMU, team of four. I built the Mac app.</p>
      <div className="ctas">
        <a className="store" {...out} href={CLARITY_SITE}>Clarity&rsquo;s site<i aria-hidden="true">&#8599;</i></a>
      </div>
    </>,
    <>
      <p className="desc">
        Research intern at the National Institute of Standards and Technology, May to August 2026. A
        five-stage pandas and scikit-learn pipeline that separates automated from human traffic in
        the logs of NIST&rsquo;s public data portal.
      </p>
      <p className="meta">Python, pandas, scikit-learn · Gaithersburg, MD · No public code</p>
      <p className="result">A random forest using only behavioral signals reached F1&nbsp;=&nbsp;0.94. An isolation forest surfaced a disguised scraper, and the cleaning rules built from it raised the measured automated share from 21.7% to 41.9%.</p>
    </>,
  ];

  return (
    <div className={`pstage${pinned ? " pinned" : ""}${pinned && active < 0 ? " opening" : ""}`} ref={track}
         data-lead={pinned ? 1 : 0} style={{ "--n": steps } as CSSProperties}>
      <div className="pstick">
        {pinned && (
          <div className="pintro" inert={active >= 0}>
            <h2>Projects</h2>
            <p>{PROJECTS_INTRO}</p>
            <ol>
              {PROJECTS.map((p, i) => (
                <li key={p.id} style={{ "--accent": p.accent, "--d": i } as CSSProperties}>
                  <button type="button" onClick={() => go(i)}>
                    <span className="pn">{String(i + 1).padStart(2, "0")}</span>
                    <b>{p.name}</b>
                    <span className="k">{KINDS[i]}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}
        <ol className="plist">
          {PROJECTS.map((p, i) => (
            <li key={p.id} id={p.id} data-i={i} ref={el => { items.current[i] = el; }}
                className={active === i ? "on" : ""} style={{ "--accent": p.accent, "--o": i * 2 } as CSSProperties}>
              <span className="prog" aria-hidden="true" />
              <h3>
                <button type="button" onClick={() => go(i)} aria-expanded={!pinned || active === i}>
                  <span className="pn">{String(i + 1).padStart(2, "0")}</span><span ref={i === 0 ? tlTitle : undefined}>{p.name}</span>
                </button>
              </h3>
              {/* a folded project is out of reach until it opens, so focus never lands on something you cannot see */}
              <div className="pbody" inert={pinned && active !== i}><div>{body[i]}</div></div>
            </li>
          ))}
        </ol>
        <div className="pmedia">
          {PROJECTS.map((p, i) => (
            <div key={p.id} data-i={i} className={`layer${active === i ? " on" : ""}`}
                 style={{ "--accent": p.accent, "--o": i * 2 + 1 } as CSSProperties}
                 aria-hidden={pinned && active !== i}>
              {i === 0 && <TrueLine held={pinned && active !== 0} />}
              {i === 1 && <Clarity held={pinned && active !== 1} />}
              {i === 2 && <NistFigure on={!pinned || active === 2} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
