import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import commits from "../data/commits.json";
import { YearWheel, type WheelHandle } from "../components/YearWheel";
import { ProjectStack } from "../components/ProjectStack";
import { MoreWork } from "../components/MoreWork";
import type { Entry } from "../data/work";
import { Bar } from "../components/Bar";
import { useCurrentSection, type Section } from "../components/Index";
import { useReveal, prefersReducedMotion } from "../lib/useReveal";
import { out } from "../lib/router";

const SECTIONS: Section[] = [
  { id: "adam", label: "Adam Zhu" },
  { id: "projects", label: "Projects" },
  { id: "more", label: "More work" },
  { id: "contact", label: "Contact" },
];

/* The site itself is monochrome. Colour belongs to the projects: the one in view lends its
   accent to the chrome that is always on screen (the mark's today dot, focus rings). */
const SITE_ACCENT = "#f4f4f2";

const LINKS = [
  { href: "https://github.com/adam-zhu1", label: "GitHub", ext: true },
  { href: "https://www.linkedin.com/in/adam-zhu-cmu/", label: "LinkedIn", ext: true },
  { href: "mailto:adamzhu@andrew.cmu.edu", label: "Email", ext: false },
  { href: "/Adam-Zhu-Resume.pdf", label: "Resume", ext: true },
];

/* The latest commit: the history the build fetched, then GitHub's public events once the
   page is open, whichever is newer. Repo names only, never messages. */
type Push = { t: number; r: string };
const LOCAL: Push = (commits as { r: string; t: string }[])
  .map(c => ({ t: Date.parse(c.t + ":00Z"), r: c.r }))
  .filter(c => !isNaN(c.t))
  .reduce<Push>((a, c) => c.t > a.t ? c : a, { t: 0, r: "" });

function useLastPush() {
  const [p, setP] = useState<Push>(LOCAL);
  const [, tick] = useState(0);
  useEffect(() => {
    const ac = new AbortController();
    fetch("https://api.github.com/users/adam-zhu1/events/public?per_page=30", { signal: ac.signal })
      .then(r => r.ok ? r.json() : [])
      .then((ev: { type: string; created_at: string; repo: { name: string } }[]) => {
        const push = ev.find(e => e.type === "PushEvent");
        if (!push) return;
        const t = Date.parse(push.created_at);
        setP(cur => t > cur.t ? { t, r: push.repo.name.split("/")[1] ?? push.repo.name } : cur);
      })
      .catch(() => {});
    const id = setInterval(() => tick(n => n + 1), 60_000);
    return () => { ac.abort(); clearInterval(id); };
  }, []);
  return p;
}

const ago = (t: number) => {
  const m = Math.max(0, Math.round((Date.now() - t) / 60_000));
  if (m < 60) return m <= 1 ? "just now" : `${m} minutes ago`;
  const h = Math.round(m / 60);
  if (h < 24) return h === 1 ? "an hour ago" : `${h} hours ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
};

export default function Home() {
  const cur = useCurrentSection(SECTIONS);
  const wheel = useRef<WheelHandle | null>(null);
  const reduce = prefersReducedMotion();
  const [step, setStep] = useState(reduce ? 3 : 0);
  const [wheelReady, setWheelReady] = useState(false);
  const push = useLastPush();

  const topRef = useRef<HTMLDivElement>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const headMore = useReveal<HTMLDivElement>({ threshold: 0.4 });
  const contactRef = useReveal<HTMLDivElement>({ threshold: 0.35 });

  const onWheelReady = useCallback((h: WheelHandle) => { wheel.current = h; setWheelReady(true); }, []);

  /* the name rises letter by letter out of its baseline, and the strip above it settles in */
  useEffect(() => {
    if (reduce) return;
    const ts = [
      setTimeout(() => setStep(2), 60),
      setTimeout(() => {
        setStep(3);
        topRef.current?.querySelectorAll<HTMLElement>(".in").forEach((b, i) => { b.style.transitionDelay = `${i * 70}ms`; b.classList.add("on"); });
      }, 380),
    ];
    return () => ts.forEach(clearTimeout);
  }, [reduce]);

  /* the wheel draws itself the first time the footer comes into view */
  const footWheel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = footWheel.current;
    if (!wheelReady || reduce || !el) return;
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { wheel.current?.play(); io.disconnect(); } }, { threshold: .4 });
    io.observe(el);
    return () => io.disconnect();
  }, [wheelReady, reduce]);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", entry ? entry.accent : SITE_ACCENT);
  }, [entry]);

  const fresh = push.t > 0 && Date.now() - push.t < 86_400_000;

  return (
    <>
      <Bar sections={SECTIONS} cur={cur} />
      <div className="topfade" aria-hidden="true" />

      <main className="site">
        <div className="wrap">
          <section className="sec hero" id="adam">
            {/* the facts in a strip, small, the way a spec sheet opens */}
            <div className={`hstrip${reduce ? " on" : ""}`} ref={topRef}>
              <div className="in"><span className="k">Now</span><span>ScottyLabs AI, on Bark, CMU&rsquo;s campus AI assistant</span></div>
              <div className="in"><span className="k">Previously</span><span>Research intern at NIST, CSAFE, and VRAC</span></div>
              <div className="in act">
                <span className="k">Activity</span>
                {push.t > 0
                  ? <span><i className={`dot${fresh ? " live" : ""}`} aria-hidden="true" />Last commit {ago(push.t)}{push.r && <>, in <a {...out} href={`https://github.com/adam-zhu1/${push.r}`}>{push.r}</a></>}</span>
                  : <span>On <a {...out} href="https://github.com/adam-zhu1">GitHub</a></span>}
              </div>
              <div className="in"><span className="k">Links</span>
                <span className="hl">{LINKS.map(l => <a key={l.label} href={l.href} {...(l.ext ? out : {})}>{l.label}</a>)}</span>
              </div>
            </div>
            <h1 className={`mega${step < 2 ? " pre" : ""}`} aria-label="Adam Zhu">
              {[..."Adam Zhu"].map((c, i) => <span key={i} aria-hidden="true" style={{ "--i": i } as CSSProperties}>{c === " " ? " " : c}</span>)}
            </h1>
            <p className={`hline${step >= 3 ? " on" : ""}`}><b>Statistics and machine learning at Carnegie Mellon.</b> Looking for Summer 2027 internships in software, ML, data science, or quant.</p>
          </section>

          <section className="sec projects" id="projects">
            <ProjectStack onActive={setEntry} />
          </section>

          <section className="sec" id="more">
            <div className="sh" ref={headMore}>
              <h2 className="h2big in">More work</h2>
              <p className="in">Research at Iowa State, a paper, a campus AI team, and two side projects.</p>
            </div>
            <MoreWork />
          </section>

          <section className="sec contact" id="contact" ref={contactRef}>
            <div className="sh">
              <h2 className="h2big in">Contact</h2>
              <p className="in">The fastest way to reach me is email.</p>
            </div>
            <a className="mailto in" href="mailto:adamzhu@andrew.cmu.edu">adamzhu@andrew.cmu.edu</a>
            <ul className="links in">
              {LINKS.filter(l => l.label !== "Email").map(l => <li key={l.label}><a {...out} href={l.href}>{l.label}</a></li>)}
            </ul>
            {/* the year of work, small: every commit as a spoke, today at the top */}
            <footer className="sitefoot">
              <div className="minwheel wheel" ref={footWheel}><YearWheel onReady={onWheelReady} intro={!reduce} /></div>
              <div className="footmeta">
                <span>Every commit from the last year, one spoke per day.</span>
                <span>Adam Zhu, Pittsburgh</span>
              </div>
            </footer>
          </section>
        </div>
      </main>
    </>
  );
}
