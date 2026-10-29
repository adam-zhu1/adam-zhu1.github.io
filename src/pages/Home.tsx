import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { YearWheel, type WheelHandle } from "../components/YearWheel";
import { TrueLine } from "../components/TrueLine";
import { Clarity } from "../components/Clarity";
import { CLARITY_ACCENT } from "../data/clarity";
import { WorkCard } from "../components/WorkCard";
import { Bar } from "../components/Bar";
import { Index, useCurrentSection, type Section } from "../components/Index";
import { useReveal, prefersReducedMotion } from "../lib/useReveal";
import { out } from "../lib/router";

const SECTIONS: Section[] = [
  { id: "adam", label: "Adam Zhu" },
  { id: "projects", label: "TrueLine" },
  { id: "clarity", label: "Clarity" },
  { id: "more", label: "More work" },
  { id: "contact", label: "Contact" },
];

/* The site itself is monochrome. Colour belongs to the projects: each one names its accent
   here, the section paints itself in it, and the chrome that is always on screen (the index
   dot, the mark's today dot, focus rings) takes the accent of the section you are in. Mint is
   TrueLine's own, the colour its overlay draws the pocket in; lens teal is Clarity's, the
   secondary from its identity standard, picked over its mint so the two read apart. */
const SITE_ACCENT = "#f4f4f2";
const ACCENTS: Record<string, string> = { projects: "#40e69e", clarity: CLARITY_ACCENT };

const WORK = [
  { href: "https://github.com/adam-zhu1", title: "NIST usage analytics",
    blurb: "A five-stage Python pipeline that separated people from robots in a public data portal's logs.",
    cta: "GitHub" },
  { href: "https://doi.org/10.3390/math12050741", title: "Matched binary diagnostic tests",
    blurb: "Statistical tests for proportion difference in one-to-two matched binary data. Co-author, Mathematics.",
    meta: "2024", cta: "Paper" },
  { href: "https://github.com/adam-zhu1/march-madness-2026", title: "March Madness predictor",
    blurb: "Year-aware logistic regression on historical tournament matchups, served through a Streamlit app.",
    cta: "GitHub" },
  { href: "https://github.com/adam-zhu1/fantasy-football-draft", title: "Fantasy draft assistant",
    blurb: "Floor-adjusted value over replacement from three seasons of weekly variance, plus a live draft board.",
    cta: "GitHub" },
];

export default function Home() {
  const cur = useCurrentSection(SECTIONS);
  const wheel = useRef<WheelHandle | null>(null);
  /* The intro plays on every load. It is the site's opening, not a one-time gate:
     the wheel assembles, the name rises out of its own baseline, then the page follows. */
  const reduce = prefersReducedMotion();
  const [step, setStep] = useState(reduce ? 3 : 0);
  const [wheelReady, setWheelReady] = useState(false);

  const sideRef = useRef<HTMLDivElement>(null);
  const headProjects = useReveal<HTMLDivElement>({ threshold: 0.9 });
  const headMore = useReveal<HTMLDivElement>({ threshold: 0.9 });
  const contactRef = useReveal<HTMLDivElement>({ threshold: 0.35 });

  const onWheelReady = useCallback((h: WheelHandle) => { wheel.current = h; setWheelReady(true); }, []);

  const runIntro = useCallback(() => {
    if (reduce) return;
    setStep(0);
    const el = sideRef.current;
    el?.classList.remove("on");
    el?.querySelectorAll<HTMLElement>(".in").forEach(b => { b.classList.remove("on"); b.style.transitionDelay = ""; });
    scrollTo(0, 0);
    wheel.current?.play();
    const ts = [
      setTimeout(() => setStep(1), 2300),
      setTimeout(() => setStep(2), 2650),                                   // the name rises out of its baseline
      setTimeout(() => {                                                    // the rest of the page follows
        setStep(3);
        const e = sideRef.current;
        if (e) {
          e.classList.add("on");
          e.querySelectorAll<HTMLElement>(".in").forEach((b, i) => { b.style.transitionDelay = `${i * 110}ms`; b.classList.add("on"); });
        }
      }, 3250),
    ];
    return () => ts.forEach(clearTimeout);
  }, [reduce]);

  useEffect(() => { if (wheelReady) return runIntro(); }, [wheelReady, runIntro]);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", ACCENTS[cur] ?? SITE_ACCENT);
  }, [cur]);

  return (
    <>
      <Index sections={SECTIONS} cur={cur} />
      <Bar />

      <main className="site">
        <div className="wrap">
          <section className="sec hero" id="adam">
            <div className="grid1">
              <div className={`side${reduce ? " on" : ""}`} ref={sideRef}>
                <h1 className={step < 2 ? "pre" : ""}>Adam Zhu</h1>
                <p className="kick in">Statistics and machine learning, Carnegie Mellon</p>
                <ul className="in">
                  <li><a {...out} href="https://github.com/adam-zhu1">GitHub</a></li>
                  <li><a {...out} href="https://www.linkedin.com/in/adam-zhu-cmu/">LinkedIn</a></li>
                  <li><a href="mailto:adamzhu@andrew.cmu.edu">Email</a></li>
                  <li><a {...out} href="/Adam-Zhu-Resume.pdf">Resume</a></li>
                </ul>
              </div>
              <div className="wheel"><YearWheel onReady={onWheelReady} intro={!reduce} /></div>
            </div>
          </section>

          <section className="sec" id="projects" style={{ "--accent": ACCENTS.projects } as CSSProperties}>
            <div className="sechead in" ref={headProjects}><h2>Projects</h2></div>
            <TrueLine />
          </section>

          <section className="sec" id="clarity" style={{ "--accent": ACCENTS.clarity } as CSSProperties}>
            <Clarity />
          </section>

          <section className="sec" id="more">
            <div className="sechead in" ref={headMore}><h2>More work</h2></div>
            <ul className="worklist">
              {WORK.map(w => <WorkCard key={w.title} {...w} />)}
            </ul>
          </section>

          <section className="sec contact" id="contact" ref={contactRef}>
            <div>
              <h2 className="in">Contact</h2>
              <a className="mailto in" href="mailto:adamzhu@andrew.cmu.edu">adamzhu@andrew.cmu.edu</a>
              <ul className="links in">
                <li><a {...out} href="https://github.com/adam-zhu1">GitHub</a></li>
                <li><a {...out} href="https://www.linkedin.com/in/adam-zhu-cmu/">LinkedIn</a></li>
                <li><a {...out} href="/Adam-Zhu-Resume.pdf">Resume</a></li>
              </ul>
            </div>
            <footer className="in"><span>Adam Zhu, Pittsburgh</span></footer>
          </section>
        </div>
      </main>
    </>
  );
}
