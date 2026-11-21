import { useRef, useState, type CSSProperties } from "react";
import { out } from "../lib/router";

type Item = {
  year: string; when: string; name: string; role: string; org?: string;
  stats?: [string, string][]; body: string; tags: string; href?: string; cta?: string;
  /* for its mini card: a screenshot, or a few real rows of its output (rank, position, player, value) */
  img?: string; alt?: string; rows?: [string, string, string, string][];
  /* for a card with no picture: the organisation written out, and where it is */
  mark?: [string, string];
};

/* Newest first. Every figure here is the resume's, word for word in substance; the paper is
   scoped to what Adam did on it (second author, joined at the revision stage). */
export const MORE: Item[] = [
  { year: "2026", when: "Sep 2026 to now", name: "ScottyLabs AI", role: "Software engineer", org: "Carnegie Mellon",
    body: "Set up the dev stack for Bark: a Python LLM backend, MCP tools and Postgres. Traced a login bug where expired sessions still looked signed in but every request failed.",
    tags: "Python, MCP, Postgres", href: "https://scottylabs.org/", cta: "ScottyLabs", mark: ["ScottyLabs", "Carnegie Mellon"] },
  { year: "2026", when: "Sep 2026", name: "Fantasy draft assistant", role: "Side project",
    stats: [["3", "seasons of weekly variance"]],
    body: "Ranks players by floor-adjusted value over replacement, built from three seasons of weekly scoring variance, with a live draft board that tracks picks as they are made.",
    tags: "Python", href: "https://github.com/adam-zhu1/fantasy-football-draft", cta: "GitHub",
    /* the top of the board the tool printed for the 2026 draft (board.txt) */
    rows: [["1", "RB", "Jahmyr Gibbs", "187.9"], ["2", "RB", "Bijan Robinson", "179.9"], ["3", "WR", "Ja’Marr Chase", "134.4"], ["4", "WR", "Jaxon Smith-Njigba", "123.9"], ["5", "WR", "Puka Nacua", "121.4"], ["6", "RB", "Christian McCaffrey", "119.3"]] },
  { year: "2026", when: "Mar 2026", name: "March Madness predictor", role: "Side project",
    body: "A year-aware logistic regression on historical tournament matchups, served through a Streamlit app.",
    tags: "Python, Streamlit", href: "https://github.com/adam-zhu1/march-madness-2026", cta: "GitHub",
    img: "/media/more/march-madness.webp", alt: "The predictor’s Streamlit app, showing its recommended Round of 64 picks with win probabilities" },
  { year: "2024", when: "2024", name: "Matched binary diagnostic tests", role: "Paper", org: "Mathematics 12(5), 741",
    body: "Statistical tests for proportion difference in one-to-two matched binary diagnostic data, applied to environmental testing for Salmonella in the United States. I joined at the revision stage: manuscript preparation, literature review, and data cleaning.",
    tags: "Lin, Zhu, Wang", href: "https://doi.org/10.3390/math12050741", cta: "Paper", mark: ["Mathematics", "12(5), 741 · Lin, Zhu, Wang"] },
  { year: "2024", when: "Jan to Jun 2024", name: "VR evacuation study", role: "Research intern", org: "VRAC, Iowa State",
    stats: [["454", "simulated evacuation trials"], ["227", "participants"]],
    body: "Fit regression models of time to escape in simulated VR evacuations. Smart audio guidance beat static and adaptive signage by a statistically significant margin. Manuscript in preparation.",
    tags: "Regression, experimental design", mark: ["VRAC", "Iowa State University"] },
  { year: "2023", when: "Jun 2023 to Aug 2024", name: "Forensic image research", role: "Research intern", org: "CSAFE, Iowa State",
    stats: [["24,000+", "camera images"], ["100+", "degraded writing samples"]],
    body: "Co-authored a manuscript, under review at Forensic Sciences, that evaluates camera fingerprinting for device identification. Built document-degradation methods to test handwriting-similarity analysis under realistic conditions.",
    tags: "Forensic statistics", mark: ["CSAFE", "Iowa State University"] },
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
