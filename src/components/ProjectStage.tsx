import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { A, out } from "../lib/router";
import { morphInto } from "../lib/morph";
import { prefersReducedMotion } from "../lib/useReveal";
import { TrueLine } from "./TrueLine";
import { Clarity } from "./Clarity";
import { CLARITY_SITE } from "../data/clarity";
import { PROJECTS } from "../data/projects";


/* Where the stage pins: a real desktop window. Below this, or with reduced motion, the same
   markup lies flat as a stacked list, every project open and its demo under it. */
const PIN = "(min-width: 64rem) and (min-height: 700px)";

function usePinned() {
  const [on, set] = useState(false);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const mq = matchMedia(PIN);
    const read = () => set(mq.matches);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);
  return on;
}

/** The measured share of NIST portal traffic that was automated, before and after the
    cleaning rules, plus the run's scale. Every figure is from the resume. */
function NistFigure({ on }: { on: boolean }) {
  return (
    <div className={`demo nist${on ? " on" : ""}`}>
      <div className="win appwin nistwin">
        <p className="nk">Measured automated share of portal traffic</p>
        <div className="bars">
          <div className="br"><span>Before</span><i style={{ "--w": "21.7%" } as CSSProperties} /><b>21.7%</b></div>
          <div className="br after"><span>After</span><i style={{ "--w": "41.9%" } as CSSProperties} /><b>41.9%</b></div>
        </div>
        <p className="nnote">The rules came out of one investigation: a scraper that hit the portal monthly from fresh IPs and spoofed hundreds of browser user-agents.</p>
        <dl className="nstats">
          <div><dt>Requests</dt><dd>1.04M</dd></div>
          <div><dt>Days</dt><dd>271</dd></div>
          <div><dt>Unique IPs</dt><dd>117K</dd></div>
          <div><dt>Random forest F1</dt><dd>0.94</dd></div>
          <div><dt>Searches with no results</dt><dd>21.5%</dd></div>
          <div><dt>Query-failure classifier</dt><dd>0.88 acc.</dd></div>
        </dl>
      </div>
    </div>
  );
}

/**
 * The projects as one pinned stage. Scrolling through it hands the stage from one project
 * to the next: the active one opens on the left, the others fold to their names, and its
 * demo takes the right. The page scrolls normally the whole way; the scroll only decides
 * which project is open.
 */
export function ProjectStage({ active, onActive }: { active: number; onActive: (i: number) => void }) {
  const pinned = usePinned();
  const track = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const n = PROJECTS.length;

  // pinned: the position inside the track picks the project and fills its progress line
  useEffect(() => {
    const el = track.current;
    if (!el || !pinned) return;
    let raf = 0, last = -1;
    const read = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const run = el.offsetHeight - innerHeight;
      const seg = run / n;
      const s = Math.min(Math.max(-r.top, 0), run - 1);
      const i = Math.min(n - 1, Math.floor(s / seg));
      el.style.setProperty("--progress", String(Math.min(1, (s - i * seg) / seg)));
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
    items.current.forEach(li => li && io.observe(li));
    return () => io.disconnect();
  }, [pinned, onActive]);

  const go = (i: number) => {
    const el = track.current;
    if (!el || !pinned) { items.current[i]?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" }); return; }
    const seg = (el.offsetHeight - innerHeight) / n;
    scrollTo({ top: el.getBoundingClientRect().top + scrollY + i * seg + 2, behavior: "smooth" });
  };

  /* the door into TrueLine's page: the name is lifted off the list and flown to the heading
     its own page keeps for it, so the two read as one object rather than two screens */
  const tlTitle = useRef<HTMLHeadingElement>(null);
  const openTrueLine = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || !tlTitle.current) return;
    e.preventDefault();
    morphInto("/trueline", tlTitle.current, items.current[0]);
  };

  const body: ReactNode[] = [
    <>
      <p className="desc">
        A bowling ball tracker for iPhone. Prop the phone behind the approach, bowl, and it measures
        the throw: where the ball crossed the arrows, where it hooked, how fast it left your hand, and
        the board and angle it entered on. Everything runs on the phone.
      </p>
      <p className="meta">Swift, Vision, Core ML · on the App Store since August 2026</p>
      <p className="result">Tracked the ball down the full lane on 6 of 6 unseen clips; within 1 board and 1–2% on speed against the Python prototype.</p>
      <div className="ctas">
        <a className="store" {...out} href="https://apps.apple.com/us/app/trueline-bowling-ball-tracker/id6801953797">
          App Store<i aria-hidden="true">&#8599;</i>
        </a>
        <A className="more" href="/trueline" onClick={openTrueLine}>How it works<i aria-hidden="true">&#8594;</i></A>
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
      <p className="meta">Python, pandas, scikit-learn · Gaithersburg, MD</p>
      <p className="result">A random forest using only behavioral signals reached F1 = 0.94. An isolation forest surfaced a disguised scraper, and the cleaning rules built from it raised the measured automated share from 21.7% to 41.9%.</p>
    </>,
  ];

  return (
    <div className={`pstage${pinned ? " pinned" : ""}`} ref={track} style={{ "--n": n } as CSSProperties}>
      <div className="pstick">
        <ol className="plist">
          {PROJECTS.map((p, i) => (
            <li key={p.id} id={p.id} data-i={i} ref={el => { items.current[i] = el; }}
                className={active === i ? "on" : ""} style={{ "--accent": p.accent, "--o": i * 2 } as CSSProperties}>
              <span className="prog" aria-hidden="true" />
              <h3 ref={i === 0 ? tlTitle : undefined}>
                <button type="button" onClick={() => go(i)} aria-expanded={!pinned || active === i}>
                  <span className="pn">{String(i + 1).padStart(2, "0")}</span>{p.name}
                </button>
              </h3>
              <div className="pbody"><div>{body[i]}</div></div>
            </li>
          ))}
        </ol>
        <div className="pmedia">
          {PROJECTS.map((p, i) => (
            <div key={p.id} className={`layer${active === i ? " on" : ""}`}
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
