import { useCallback, useEffect, useRef, useState } from "react";
import { YearWheel, type WheelHandle } from "../components/YearWheel";
import { ProjectStage, PROJECTS_INTRO } from "../components/ProjectStage";
import { PROJECTS } from "../data/projects";
import { WorkCard } from "../components/WorkCard";
import { Bar } from "../components/Bar";
import { useCurrentSection, type Section } from "../components/Index";
import { useReveal, prefersReducedMotion } from "../lib/useReveal";
import { out } from "../lib/router";

/* What the page watches to know where you are. The projects are one section; which of them
   is open is the stage's to say, and the bar's chip reads it from there. */
const SECTIONS: Section[] = [
  { id: "adam", label: "Adam Zhu" },
  { id: "projects", label: "Projects" },
  { id: "more", label: "More work" },
  { id: "contact", label: "Contact" },
];
const CHIPS: Section[] = [
  SECTIONS[0],
  SECTIONS[1],
  ...PROJECTS.map((p, i) => ({ id: p.id, label: p.name, group: "Projects", n: String(i + 1).padStart(2, "0"), accent: p.accent })),
  ...SECTIONS.slice(2),
];

/* The site itself is monochrome. Colour belongs to the projects: each one names its accent
   here, the section paints itself in it, and the chrome that is always on screen (the index
   chip, the mark's today dot, focus rings) takes the accent of the project you are on. Mint is
   TrueLine's own, the colour its overlay draws the pocket in; lens teal is Clarity's, the
   secondary from its identity standard, picked over its mint so the two read apart; NIST
   takes a quiet indigo. The colours themselves live with the projects in ProjectStage. */
const SITE_ACCENT = "#f4f4f2";

const WORK = [
  { href: "https://doi.org/10.3390/math12050741", title: "Matched binary diagnostic tests",
    blurb: "Statistical tests for proportion difference in one-to-two matched binary data. Second author, Mathematics.",
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
  /* Content first. The name rises and the lines under it follow straight away, while the
     wheel assembles beside them; nothing on the page waits for the wheel to finish. */
  const reduce = prefersReducedMotion();
  const [step, setStep] = useState(reduce ? 3 : 0);
  const [wheelReady, setWheelReady] = useState(false);

  const sideRef = useRef<HTMLDivElement>(null);
  const headProjects = useReveal<HTMLDivElement>({ threshold: 0.9 });
  /* -1 while the stage's opening card is up, before any one project has it */
  const [active, setActive] = useState(-1);
  const project = PROJECTS[active];
  const headMore = useReveal<HTMLDivElement>({ threshold: 0.9 });
  const contactRef = useReveal<HTMLDivElement>({ threshold: 0.35 });

  const onWheelReady = useCallback((h: WheelHandle) => { wheel.current = h; setWheelReady(true); }, []);

  useEffect(() => {
    if (reduce) return;
    const ts = [
      setTimeout(() => setStep(2), 60),                                     // the name rises out of its baseline
      setTimeout(() => {                                                    // the lines under it follow
        setStep(3);
        const e = sideRef.current;
        if (e) {
          e.classList.add("on");
          e.querySelectorAll<HTMLElement>(".in").forEach((b, i) => { b.style.transitionDelay = `${i * 70}ms`; b.classList.add("on"); });
        }
      }, 220),
    ];
    return () => ts.forEach(clearTimeout);
  }, [reduce]);

  useEffect(() => { if (wheelReady && !reduce) wheel.current?.play(); }, [wheelReady, reduce]);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", cur === "projects" && project ? project.accent : SITE_ACCENT);
  }, [cur, project]);

  return (
    <>
      <Bar sections={CHIPS} cur={cur === "projects" && project ? project.id : cur} />

      <main className="site">
        <div className="wrap">
          <section className="sec hero" id="adam">
            <div className="grid1">
              <div className={`side${reduce ? " on" : ""}`} ref={sideRef}>
                <h1 className={step < 2 ? "pre" : ""}>Adam Zhu</h1>
                <p className="kick in">Statistics and machine learning at Carnegie Mellon. Looking for Summer 2027 internships in software, ML, data science, or quant.</p>
                <ul className="in">
                  <li><a {...out} href="https://github.com/adam-zhu1">GitHub</a></li>
                  <li><a {...out} href="https://www.linkedin.com/in/adam-zhu-cmu/">LinkedIn</a></li>
                  <li><a href="mailto:adamzhu@andrew.cmu.edu">Email</a></li>
                  <li><a {...out} href="/Adam-Zhu-Resume.pdf">Resume</a></li>
                </ul>
                <dl className="now in">
                  <dt>Now</dt><dd>ScottyLabs AI, on Bark, CMU&rsquo;s campus AI assistant</dd>
                  <dt>Previously</dt><dd>Research intern at NIST, CSAFE, and VRAC</dd>
                </dl>
              </div>
              <div className="wheel"><YearWheel onReady={onWheelReady} intro={!reduce} /></div>
            </div>
          </section>

          <section className="sec projects" id="projects">
            <div className="sechead intro in" ref={headProjects}>
              <h2>Projects</h2>
              <p>{PROJECTS_INTRO}</p>
            </div>
            <ProjectStage active={active} onActive={setActive} />
          </section>

          <section className="sec" id="more">
            <div className="sechead intro in" ref={headMore}>
              <h2>More work</h2>
              <p>A co-authored paper and two side projects.</p>
            </div>
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
