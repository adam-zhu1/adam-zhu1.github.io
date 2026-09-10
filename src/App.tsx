import { useCallback, useEffect, useRef, useState } from "react";
import { Frame, type FrameHandle } from "./components/Frame";
import { YearWheel, type WheelHandle } from "./components/YearWheel";
import { TrueLine } from "./components/TrueLine";
import { WorkCard } from "./components/WorkCard";
import { Ambience } from "./components/Ambience";
import { useReveal, prefersReducedMotion } from "./lib/useReveal";

const SECTIONS = [
  { id: "adam", label: "Adam Zhu" },
  { id: "projects", label: "Projects" },
  { id: "more", label: "More work" },
  { id: "contact", label: "Contact" },
];

const WORK = [
  { href: "https://github.com/adam-zhu1", mark: "hist" as const, title: "NIST usage analytics",
    blurb: "A five-stage Python pipeline that separated people from robots in a public data portal's logs.",
    stat: <><b>51%</b> automated · <b>0.95</b> best F1</>, cta: "GitHub", label: <><b>190,687</b> requests</> },
  { href: "https://doi.org/10.3390/math12050741", mark: "tail" as const, title: "Matched binary diagnostic tests",
    blurb: "Statistical tests for proportion difference in one-to-two matched binary data. Co-author.",
    stat: <><b>2024</b> · Mathematics 12(5), 741</>, cta: "DOI", label: <><b>Mathematics</b> 12(5), 741</> },
  { href: "https://github.com/adam-zhu1/march-madness-2026", mark: "bracket" as const, title: "March Madness predictor",
    blurb: "Year-aware logistic regression on historical tournament matchups, served through a Streamlit app.",
    stat: <><b>63 games</b> · win probability each</>, cta: "GitHub", label: <><b>Round</b> of 64</> },
  { href: "https://github.com/adam-zhu1/fantasy-football-draft", mark: "ladder" as const, title: "Fantasy draft assistant",
    blurb: "Floor-adjusted value over replacement from three seasons of weekly variance, plus a live draft board.",
    stat: <><b>Floor-first</b> VBD · tiers · backtested</>, cta: "GitHub", label: <><b>12</b> teams, full PPR</> },
];

function useClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York", hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

function useCurrentSection() {
  const [cur, setCur] = useState("adam");
  useEffect(() => {
    const obs = SECTIONS.map(s => {
      const el = document.getElementById(s.id);
      if (!el) return null;
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setCur(s.id); }),
        { rootMargin: "-40% 0px -50% 0px" });
      io.observe(el);
      return io;
    });
    return () => obs.forEach(o => o?.disconnect());
  }, []);
  return cur;
}

export default function App() {
  const clock = useClock();
  const cur = useCurrentSection();
  const wheel = useRef<WheelHandle | null>(null);
  /* The intro plays on every load. It is the site's opening, not a one-time gate:
     the wheel assembles, the name rises out of its own baseline, then the page follows. */
  const reduce = prefersReducedMotion();
  const [step, setStep] = useState(reduce ? 3 : 0);
  const [revealed, setRevealed] = useState(reduce);
  const [wheelReady, setWheelReady] = useState(false);
  const [swipe, setSwipe] = useState(false);

  const nameFrame = useRef<FrameHandle>(null);
  const sideRef = useRef<HTMLDivElement>(null);
  const headProjects = useReveal<HTMLDivElement>({ threshold: 0.9 });
  const headMore = useReveal<HTMLDivElement>({ threshold: 0.9 });
  const soonRef = useReveal<HTMLDivElement>();
  const contactRef = useReveal<HTMLDivElement>({ threshold: 0.35 });

  const onWheelReady = useCallback((h: WheelHandle) => { wheel.current = h; setWheelReady(true); }, []);

  const runIntro = useCallback(() => {
    if (reduce) return;
    setStep(0); setSwipe(false); setRevealed(false);
    const el = sideRef.current;
    el?.classList.remove("on");
    el?.querySelectorAll<HTMLElement>(".in").forEach(b => { b.classList.remove("on"); b.style.transitionDelay = ""; });
    scrollTo(0, 0);
    wheel.current?.play();
    const ts = [
      setTimeout(() => { setStep(1); nameFrame.current?.show(); }, 2300),   // the frame draws round the name
      setTimeout(() => { setStep(2); setSwipe(true); }, 2650),              // the name rises, the rule sweeps
      setTimeout(() => {                                                    // the rest of the page follows
        setStep(3);
        const e = sideRef.current;
        if (e) {
          e.classList.add("on");
          e.querySelectorAll<HTMLElement>(".in").forEach((b, i) => { b.style.transitionDelay = `${i * 110}ms`; b.classList.add("on"); });
        }
      }, 3250),
      setTimeout(() => setRevealed(true), 3800),
    ];
    return () => ts.forEach(clearTimeout);
  }, [reduce]);

  useEffect(() => { if (wheelReady) return runIntro(); }, [wheelReady, runIntro]);

  return (
    <>
      <Ambience active={revealed} />

      <nav className="idx" aria-label="Sections">
        {SECTIONS.map(s => (
          <a key={s.id} href={`#${s.id}`} className={cur === s.id ? "cur" : ""}><i />{s.label}</a>
        ))}
      </nav>

      <div className="bar">
        <span>Adam Zhu</span>
        <button className="replay" type="button" onClick={runIntro}>Replay intro</button>
        <span className="clock">Pittsburgh {clock}</span>
      </div>

      <main className="site">
        <div className="wrap">
          <section className="sec hero" id="adam">
            <div className="grid1">
              <div className="side" ref={sideRef}>
                <Frame label={<><b>name</b></>} hold={!reduce} handleRef={nameFrame}>
                  <h1 className={step < 2 ? "pre" : ""}>Adam Zhu</h1>
                  <i className={`swipe${swipe ? " go" : ""}`} />
                </Frame>
                <p className="kick in">Statistics and machine learning, Carnegie Mellon</p>
                <p className="lede in">
                  I build things that measure the world. A bowling ball tracker that reads a throw from one
                  phone. Pipelines that separate people from robots in server logs. Tests for matched binary data.
                </p>
                <ul className="in">
                  <li><a href="https://github.com/adam-zhu1">GitHub</a></li>
                  <li><a href="https://www.linkedin.com/in/adam-zhu-cmu/">LinkedIn</a></li>
                  <li><a href="mailto:adamzhu@andrew.cmu.edu">Email</a></li>
                  <li><a href="/Adam-Zhu-Resume.pdf">Resume</a></li>
                </ul>
              </div>
              <div className="wheel"><YearWheel onReady={onWheelReady} intro={!reduce} /></div>
            </div>
          </section>

          <section className="sec" id="projects">
            <div className="sechead in" ref={headProjects}><h2>Projects</h2><span>2 of 2</span></div>
            <TrueLine />
            <div className="proj soon" ref={soonRef}>
              <div className="in">
                <h3>Next project</h3>
                <p className="desc">
                  A hackathon entry, this week. It gets the same treatment as TrueLine: what it is, how it
                  works, animated from its real data, in this frame.
                </p>
              </div>
              <Frame className="slot in" seed={2} tag="02 Hackathon" label={<><b>September 2026</b> · in progress</>}>
                <i />Frame reserved
              </Frame>
            </div>
          </section>

          <section className="sec" id="more">
            <div className="sechead in" ref={headMore}><h2>More work</h2><span>{WORK.length} · each links out</span></div>
            <div className="grid">
              {WORK.map((w, i) => <WorkCard key={w.title} {...w} seed={i} />)}
            </div>
          </section>

          <section className="sec contact" id="contact" ref={contactRef}>
            <div>
              <h2 className="in">Let&rsquo;s connect.</h2>
              <a className="mailto in" href="mailto:adamzhu@andrew.cmu.edu">adamzhu@andrew.cmu.edu</a>
              <div className="grid4 in">
                <a className="cell" href="https://github.com/adam-zhu1"><small>Code</small><b>GitHub</b><span>adam-zhu1</span></a>
                <a className="cell" href="https://www.linkedin.com/in/adam-zhu-cmu/"><small>Track record</small><b>LinkedIn</b><span>adam-zhu-cmu</span></a>
                <a className="cell" href="/Adam-Zhu-Resume.pdf"><small>One page</small><b>Resume</b><span>PDF</span></a>
                <a className="cell" href="https://apps.apple.com/us/app/trueline-bowling-ball-tracker/id6801953797"><small>Shipped</small><b>App Store</b><span>TrueLine</span></a>
              </div>
            </div>
            <footer className="in"><span>Adam Zhu, Pittsburgh</span><span>{clock}</span></footer>
          </section>
        </div>
      </main>
    </>
  );
}
