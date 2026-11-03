import { useRef, useState, type CSSProperties } from "react";
import { out } from "../lib/router";
import { useEachReveal } from "../lib/useReveal";

type Item = {
  year: string; when: string; name: string; role: string; org?: string;
  stats?: [string, string][]; body: string; tags: string; href?: string; cta?: string;
};

/* Newest first. Every figure here is the resume's, word for word in substance; the paper is
   scoped to what Adam did on it (second author, joined at the revision stage). */
const MORE: Item[] = [
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
    body: "Statistical tests for proportion difference in one-to-two matched binary diagnostic data, applied to environmental testing for Salmonella in the United States. I joined at the revision stage: manuscript preparation, literature review and data cleaning.",
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

function Detail({ it }: { it: Item }) {
  return (
    <>
      <p className="mwk">{it.role}{it.org && <> · {it.org}</>} · {it.when}</p>
      <h3>{it.name}</h3>
      {it.stats && (
        <dl className="mws">
          {it.stats.map(([v, l]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}
        </dl>
      )}
      <p className="mwb">{it.body}</p>
      <p className="mwt">{it.tags}</p>
      {it.href && <a className="store" {...out} href={it.href}>{it.cta}<i aria-hidden="true">&#8599;</i></a>}
    </>
  );
}

/**
 * The rest of the work as a dated index: a row each, newest first, the year shown once per
 * year. On a wide screen the row you point at (or tab to) opens in the panel beside the list,
 * and with nothing pointed at the panel says how it works; on a touch screen a tapped row
 * opens under its name and a second tap closes it.
 */
export function MoreWork() {
  const [cur, setCur] = useState<number | null>(null);
  const list = useEachReveal<HTMLOListElement>({ selector: ":scope > li" });
  const touch = () => !matchMedia("(hover: hover)").matches;
  const it = cur == null ? null : MORE[cur];
  /* a row takes the panel only once the pointer rests on it, so crossing the other rows on
     the way over to the panel's link does not swap the panel out from under you */
  const wait = useRef(0);
  const point = (i: number | null) => { clearTimeout(wait.current); wait.current = window.setTimeout(() => setCur(i), cur == null ? 0 : 140); };
  return (
    <div className="mw" onMouseLeave={() => { if (!touch()) point(null); }}
         onBlur={e => { if (!touch() && !(e.relatedTarget as Element | null)?.closest?.(".mw")) setCur(null); }}>
      <div>
        <p className="mwtap">Tap a row to open it.</p>
        <ol className="mwl" ref={list}>
          {MORE.map((m, i) => (
            <li key={m.name} data-cur={cur === i || undefined} style={{ "--i": i } as CSSProperties}>
              <button type="button" className="mwr" aria-expanded={cur === i} aria-controls="mw-panel"
                      onMouseEnter={() => { if (!touch()) point(i); }} onFocus={() => setCur(i)}
                      onClick={() => setCur(c => touch() && c === i ? null : i)}>
                <span className="y">{MORE[i - 1]?.year === m.year ? "" : m.year}</span>
                <span className="n">{m.name}</span>
                <span className="r">{m.role}</span>
              </button>
              <div className="mwd"><div><Detail it={m} /></div></div>
            </li>
          ))}
        </ol>
      </div>
      <aside className="mwp" id="mw-panel" aria-live="polite" onMouseEnter={() => clearTimeout(wait.current)}>
        {it ? <div className="win mwwin" key={cur}><Detail it={it} /></div> : (
          <div className="win mwwin idle" key="idle">
            <p className="mwk">{MORE.length} entries · {MORE.at(-1)!.year} to {MORE[0].year}</p>
            <h3>Hover over a row to open it here</h3>
            <p className="mwb">Each one shows what I did, the numbers behind it, and a link where there is one.</p>
            <span className="mwpoint" aria-hidden="true">&#8592;</span>
          </div>
        )}
      </aside>
    </div>
  );
}
