import { useEffect, useState } from "react";
import {
  WORK_GRAPH_BANDS,
  WORK_PROJECTS,
  type WorkGraphBand,
} from "../data/workProjects";

/** X domain (years) and ticks. Tweak alongside each project's `graph.year` in workProjects.ts. */
const X_MIN = 2022.4;
const X_MAX = 2026.6;
const X_TICKS = [2023, 2024, 2025, 2026];

const xPct = (year: number) => ((year - X_MIN) / (X_MAX - X_MIN)) * 100;
const yPct = (band: WorkGraphBand) =>
  ((WORK_GRAPH_BANDS.indexOf(band) + 0.5) / WORK_GRAPH_BANDS.length) * 100;
const bandTopPct = (i: number) => ((i + 0.5) / WORK_GRAPH_BANDS.length) * 100;

const popupCardClass =
  "absolute z-20 w-64 border border-white/25 bg-black p-4 text-left shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]";

type WorkGraphProps = {
  /** Short point labels keyed by project id (falls back to the project title). */
  labels: Record<string, string>;
  /** Called with the project's index in WORK_PROJECTS when its popup's open button is clicked. */
  onOpenProject: (projectIndex: number) => void;
};

/**
 * The Work intro "project map": a monochrome scatter of projects (year × domain) where each
 * point opens a small card that jumps to the project's rail panel. Replaces the old numbered
 * shortcut list — same navigation, drawn as a plot. Rendered on the desktop rail only.
 */
export function WorkGraph({ labels, onOpenProject }: WorkGraphProps) {
  const [active, setActive] = useState<string | null>(null);

  /*
   * Dismiss the popup on Escape, or on any pointer press that isn't on a point or inside the
   * popup itself — including presses on the graph's empty plot area. Point buttons are excluded
   * because their own onClick handles toggling (closing here first would re-open on click).
   */
  useEffect(() => {
    if (!active) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActive(null);
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest("[data-graph-popup]") || t?.closest("[data-graph-point]")) {
        return;
      }
      setActive(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [active]);

  return (
    <figure aria-label="Project map: projects by year and domain" className="m-0">
      <figcaption className="mb-6 pl-20 font-mono text-[9px] uppercase tracking-[0.25em] text-white/45">
        Projects by year and domain
      </figcaption>
      <div className="relative mb-6 h-[280px] w-full xl:h-[340px] [@media(max-height:700px)]:h-[220px]">
        {/* Y band labels */}
        {WORK_GRAPH_BANDS.map((band, i) => (
          <span
            key={band}
            className="absolute left-0 w-16 -translate-y-1/2 text-right font-mono text-[9px] uppercase tracking-[0.2em] text-white/45"
            style={{ top: `${bandTopPct(i)}%` }}
          >
            {band}
          </span>
        ))}

        {/* Plot area */}
        <div className="absolute inset-y-0 left-20 right-2 border-b border-l border-white/25">
          {/* Recessive band gridlines */}
          {WORK_GRAPH_BANDS.map((band, i) => (
            <div
              key={band}
              aria-hidden
              className="absolute inset-x-0 border-t border-dashed border-white/10"
              style={{ top: `${bandTopPct(i)}%` }}
            />
          ))}
          {/* X ticks */}
          {X_TICKS.map((t) => (
            <div
              key={t}
              aria-hidden
              className="absolute bottom-0 h-1.5 w-px bg-white/25"
              style={{ left: `${xPct(t)}%` }}
            />
          ))}

          {/* Project points */}
          {WORK_PROJECTS.map((proj, i) => {
            const px = xPct(proj.graph.year);
            const py = yPct(proj.graph.domain);
            const labelLeft = px > 62;
            const isOpen = active === proj.id;
            return (
              <div
                key={proj.id}
                className={`absolute ${isOpen ? "z-30" : "z-10"}`}
                style={{ left: `${px}%`, top: `${py}%` }}
              >
                <button
                  type="button"
                  data-graph-point
                  aria-expanded={isOpen}
                  aria-label={`${proj.title}: details`}
                  onClick={() => setActive(isOpen ? null : proj.id)}
                  className="group/pt peer absolute -translate-x-1/2 -translate-y-1/2 p-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span
                    className={`block h-2.5 w-2.5 rounded-full transition-all duration-200 group-hover/pt:scale-125 ${
                      isOpen ? "scale-125 bg-white" : "bg-white/80 group-hover/pt:bg-white"
                    }`}
                  />
                </button>
                <span
                  aria-hidden
                  className={`pointer-events-none absolute top-0 -translate-y-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.18em] transition-colors ${
                    labelLeft ? "right-4" : "left-4"
                  } ${isOpen ? "text-white" : "text-white/60 peer-hover:text-white"}`}
                >
                  {labels[proj.id] ?? proj.title}
                </span>
                {isOpen && (
                  <div
                    role="dialog"
                    data-graph-popup
                    aria-label={proj.title}
                    className={`${popupCardClass} ${px > 55 ? "right-5" : "left-5"} ${
                      py > 55 ? "bottom-[-0.75rem]" : "top-[-0.75rem]"
                    }`}
                  >
                    <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/50">
                      {proj.eyebrow}
                    </p>
                    <p className="mt-2 font-display text-lg font-bold uppercase leading-tight text-white">
                      {proj.title}
                    </p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/65">
                      {proj.subtitle}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setActive(null);
                        onOpenProject(i);
                      }}
                      className="mt-4 inline-flex items-center gap-2 border border-white/30 bg-white/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-white transition-colors hover:border-white/60 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      Open panel →
                    </button>
                  </div>
                )}
              </div>
            );
          })}

        </div>

        {/* X tick labels */}
        <div aria-hidden className="absolute -bottom-5 left-20 right-2">
          {X_TICKS.map((t) => (
            <span
              key={t}
              className="absolute -translate-x-1/2 font-mono text-[9px] tracking-[0.14em] text-white/45"
              style={{ left: `${xPct(t)}%` }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

    </figure>
  );
}
