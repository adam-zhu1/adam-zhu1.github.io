import { useCallback, useEffect, useRef, useState } from "react";
import { YearWheel, type WheelHandle } from "../components/YearWheel";
import { ProjectRows } from "../components/ProjectRows";
import { PROJECTS_INTRO } from "../components/ProjectStage";
import { MoreWork } from "../components/MoreWork";
import type { Entry } from "../data/work";
import { Bar } from "../components/Bar";
import { useCurrentSection, type Section } from "../components/Index";
import { useReveal, prefersReducedMotion } from "../lib/useReveal";
import { out } from "../lib/router";

/* What the page watches to know where you are. Which entry of the work is open is the
   wheel's to say. */
const SECTIONS: Section[] = [
  { id: "adam", label: "Adam Zhu" },
  { id: "projects", label: "Projects" },
  { id: "more", label: "More work" },
  { id: "contact", label: "Contact" },
];

/* The site itself is monochrome. Colour belongs to the projects: each one names its accent
   here, the section paints itself in it, and the chrome that is always on screen (the index
   chip, the mark's today dot, focus rings) takes the accent of the project you are on. Mint is
   TrueLine's own, the colour its overlay draws the pocket in; lens teal is Clarity's, the
   secondary from its identity standard, picked over its mint so the two read apart; NIST
   takes a quiet indigo. The colours themselves live with the projects in ProjectStage. */
const SITE_ACCENT = "#f4f4f2";


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
  const [entry, setEntry] = useState<Entry | null>(null);
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
    document.documentElement.style.setProperty("--accent", entry ? entry.accent : SITE_ACCENT);
  }, [entry]);

  return (
    <>
      <Bar sections={SECTIONS} cur={cur} />

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
            <ProjectRows onActive={setEntry} />
          </section>

          <section className="sec" id="more">
            <div className="sechead intro in" ref={headMore}>
              <h2>More work</h2>
              <p>Research at Iowa State, a paper, a campus AI team, and two side projects.</p>
            </div>
            <MoreWork />
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
