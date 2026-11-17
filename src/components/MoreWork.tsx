import { useRef, useState, type CSSProperties } from "react";
import { out } from "../lib/router";

type Item = {
  year: string; when: string; name: string; role: string; org?: string;
  stats?: [string, string][]; body: string; tags: string; href?: string; cta?: string;
};

/* Newest first. Every figure here is the resume's, word for word in substance; the paper is
   scoped to what Adam did on it (second author, joined at the revision stage). */
export const MORE: Item[] = [
  { year: "2026", when: "Sep 2026 to now", name: "ScottyLabs AI", role: "Software engineer", org: "Carnegie Mellon",
    body: "Set up the dev stack for Bark: a Python LLM backend, MCP tools and Postgres. Traced a login bug where expired sessions still looked signed in but every request failed.",
    tags: "Python, MCP, Postgres", href: "https://scottylabs.org/", cta: "ScottyLabs" },
  { year: "2026", when: "Sep 2026", name: "Fantasy draft assistant", role: "Side project",
    stats: [["3", "seasons of weekly variance"]],
    body: "Ranks players by floor-adjusted value over replacement, built from three seasons of weekly scoring variance, with a live draft board that tracks picks as they are made.",
    tags: "Python", href: "https://github.com/adam-zhu1/fantasy-football-draft", cta: "GitHub" },
  { year: "2026", when: "Mar 2026", name: "March Madness predictor", role: "Side project",
    body: "A year-aware logistic regression on historical tournament matchups, served through a Streamlit app.",
    tags: "Python, Streamlit", href: "https://github.com/adam-zhu1/march-madness-2026", cta: "GitHub" },
  { year: "2024", when: "2024", name: "Matched binary diagnostic tests", role: "Paper", org: "Mathematics 12(5), 741",
    body: "Statistical tests for proportion difference in one-to-two matched binary diagnostic data, applied to environmental testing for Salmonella in the United States. I joined at the revision stage: manuscript preparation, literature review, and data cleaning.",
    tags: "Lin, Zhu, Wang", href: "https://doi.org/10.3390/math12050741", cta: "Paper" },
  { year: "2024", when: "Jan to Jun 2024", name: "VR evacuation study", role: "Research intern", org: "VRAC, Iowa State",
    stats: [["454", "simulated evacuation trials"], ["227", "participants"]],
    body: "Fit regression models of time to escape in simulated VR evacuations. Smart audio guidance beat static and adaptive signage by a statistically significant margin. Manuscript in preparation.",
    tags: "Regression, experimental design" },
  { year: "2023", when: "Jun 2023 to Aug 2024", name: "Forensic image research", role: "Research intern", org: "CSAFE, Iowa State",
    stats: [["24,000+", "camera images"], ["100+", "degraded writing samples"]],
    body: "Co-authored a manuscript, under review at Forensic Sciences, that evaluates camera fingerprinting for device identification. Built document-degradation methods to test handwriting-similarity analysis under realistic conditions.",
    tags: "Forensic statistics" },
];

/**
 * The rest of the work as a dated list, newest first: year, name, role. One soft highlight
 * follows the pointer down the rows (the same one the nav uses), and a row opens in place
 * to show what I did, the numbers behind it, and a link where there is one.
 */
export function MoreWork() {
  const [open, setOpen] = useState<number | null>(null);
  const list = useRef<HTMLOListElement>(null);
  const hov = useRef<HTMLSpanElement>(null);
  const over = (e: React.PointerEvent) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>(".mwrow");
    const h = hov.current, box = list.current;
    if (!h || !box) return;
    if (!row) { h.style.opacity = "0"; return; }
    const was = h.style.opacity === "1";
    h.style.transition = was ? "" : "none";
    h.style.transform = `translateY(${row.offsetTop}px)`;
    h.style.height = `${row.offsetHeight}px`;
    if (!was) { void h.offsetWidth; h.style.transition = ""; }
    h.style.opacity = "1";
  };
  return (
    <ol className="mwlist" ref={list} onPointerOver={over} onPointerLeave={() => { if (hov.current) hov.current.style.opacity = "0"; }}>
      <span className="mwhov" ref={hov} aria-hidden="true" />
      {MORE.map((m, i) => {
        const on = open === i;
        return (
          <li key={m.name} className={on ? "open" : ""} style={{ "--i": i } as CSSProperties}>
            <button type="button" className="mwrow" aria-expanded={on} aria-controls={`mw-${i}`} onClick={() => setOpen(on ? null : i)}>
              <span className="y">{MORE[i - 1]?.year === m.year ? "" : m.year}</span>
              <span className="n">{m.name}</span>
              <span className="r">{m.role}{m.org && <> · {m.org}</>}</span>
              <i aria-hidden="true">&#8595;</i>
            </button>
            <div className="mwx" id={`mw-${i}`} inert={!on}>
              <div>
                <div className="mwin">
                  <p className="mwk">{m.when}</p>
                  <p className="mwb">{m.body}</p>
                  {m.stats && (
                    <dl className="mws">
                      {m.stats.map(([v, l]) => <div key={l}><dd>{v}</dd><dt>{l}</dt></div>)}
                    </dl>
                  )}
                  <div className="mwfoot">
                    <span className="mwt">{m.tags}</span>
                    {m.href && <a {...out} href={m.href}>{m.cta}<i aria-hidden="true">&#8599;</i></a>}
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
