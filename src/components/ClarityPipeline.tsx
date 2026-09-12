import { useEffect, useRef, useState } from "react";
import { Frame } from "./Frame";
import { useVisible, prefersReducedMotion } from "../lib/useReveal";

/**
 * What happens to one capture, drawn as the six services it passes through. A packet
 * rides each hop while the step beside it is lit; the job status the desktop app polls
 * for is printed under the figure at every step, in the coordinator's own words.
 *
 * The steps follow the current spec (docs/FRD.md, docs/API.md): one continuous Manim
 * script rendered once, not scenes rendered separately and joined.
 */

type Node = { id: string; x: number; y: number; w: number; h: number; t: string; s: string };
const NODES: Node[] = [
  { id: "mac", x: 30, y: 48, w: 176, h: 64, t: "Your Mac", s: "the desktop app" },
  { id: "co", x: 296, y: 48, w: 176, h: 64, t: "Coordinator", s: "Go · owns the job" },
  { id: "ag", x: 562, y: 48, w: 190, h: 64, t: "Agent service", s: "Python · LangGraph" },
  { id: "gem", x: 826, y: 48, w: 110, h: 64, t: "Gemini", s: "reads, explains" },
  { id: "db", x: 296, y: 194, w: 176, h: 64, t: "MongoDB Atlas", s: "jobs · cache · snippets" },
  { id: "cl", x: 826, y: 194, w: 110, h: 64, t: "Claude", s: "writes Manim" },
  { id: "dk", x: 562, y: 340, w: 190, h: 64, t: "Docker sandbox", s: "manim-worker · no network" },
  { id: "s3", x: 296, y: 340, w: 176, h: 64, t: "S3", s: "finished videos" },
];

const EDGES: Record<string, string> = {
  mac_co: "M206 80 H296",
  co_ag: "M472 80 H562",
  ag_gem: "M752 80 H826",
  co_db: "M384 112 V194",
  co_mac: "M296 96 C260 140, 200 140, 170 112",          // back to the screen
  ag_db: "M562 96 C520 150, 500 200, 472 220",
  ag_cl: "M752 96 C790 140, 800 180, 826 214",
  ag_dk: "M657 112 V340",
  dk_ag: "M676 340 V112",                                 // the traceback comes back
  co_s3: "M366 112 C340 190, 340 280, 366 340",
  db_co: "M402 194 V112",
};

type Step = { k: string; t: string; cap: string; st: string; on: string[]; e: string[]; ride: string; ret?: boolean };
const STEPS: Step[] = [
  { k: "01", t: "Capture", st: "queued", on: ["mac", "co"], e: ["mac_co"], ride: "mac_co",
    cap: "POST /api/jobs: the region you dragged and the question leave the Mac. The coordinator opens a job and answers 202 before any work starts." },
  { k: "02", t: "Read", st: "transcribing", on: ["co", "ag", "gem"], e: ["co_ag", "ag_gem"], ride: "ag_gem",
    cap: "/vision: Gemini reads the problem off the pixels, verbatim if it is text and described precisely if it is a diagram, at temperature 0 so the same problem always comes back the same." },
  { k: "03", t: "Seen before?", st: "transcribing", on: ["co", "db"], e: ["co_db"], ride: "co_db",
    cap: "The problem text, the question and the mode are hashed together and checked against the cache. A hit returns the explanation and the video in under a second and nothing else runs." },
  { k: "04", t: "Explain", st: "explaining", on: ["co", "ag", "gem"], e: ["co_ag", "ag_gem"], ride: "ag_gem",
    cap: "/explain: Gemini drafts a step-by-step explanation and a two-to-five-beat storyboard, critiques its own draft against a rubric, and revises once. Tutor mode is enforced in the critique." },
  { k: "05", t: "On your screen", st: "explaining", on: ["co", "mac"], e: ["co_mac"], ride: "co_mac", ret: true,
    cap: "The explanation is written to the job and shows in the result box the moment it is non-null, whatever the status says. Target: under ten seconds from Enter." },
  { k: "06", t: "Retrieve", st: "generating", on: ["ag", "db"], e: ["ag_db"], ride: "ag_db",
    cap: "Before any code is written, the three verified Manim examples closest to the storyboard come out of the vector store: Voyage embeddings over Atlas Vector Search." },
  { k: "07", t: "Write", st: "generating", on: ["ag", "cl"], e: ["ag_cl"], ride: "ag_cl",
    cap: "Claude writes one continuous Manim script for the whole storyboard, imitating the retrieved examples. A static pre-check rejects banned imports before anything runs." },
  { k: "08", t: "Render, repair", st: "rendering", on: ["ag", "dk"], e: ["ag_dk", "dk_ag"], ride: "ag_dk",
    cap: "A network-isolated Docker container renders it. If it crashes, the traceback goes back to Claude with fresh retrieval as a hint, up to three attempts. Working code is ingested into the corpus." },
  { k: "09", t: "Store, play", st: "done", on: ["co", "s3", "db", "mac"], e: ["co_s3", "db_co", "co_mac"], ride: "co_mac", ret: true,
    cap: "The MP4 goes to S3, the cache remembers the hash, and the video plays in the same window. Sixty to ninety seconds on a cold run. The same problem is never rendered twice." },
];

const DWELL = 2600;

export function ClarityPipeline() {
  const [i, setI] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const packet = useRef<SVGCircleElement>(null);
  const timer = useRef(0);
  const visible = useRef(false);
  const step = STEPS[i];

  /* advance on a clock only while the figure is on screen; a click on a step jumps and
     restarts the clock from there */
  const start = () => {
    clearInterval(timer.current);
    if (prefersReducedMotion() || !visible.current) return;
    timer.current = window.setInterval(() => setI(k => (k + 1) % STEPS.length), DWELL);
  };
  const visRef = useVisible<HTMLDivElement>(v => { visible.current = v; if (v) start(); else clearInterval(timer.current); },
    { threshold: 0.3, band: "-6% 0px -12% 0px" });
  useEffect(() => () => clearInterval(timer.current), []);

  /* the packet rides the step's hop */
  useEffect(() => {
    const svg = svgRef.current, pk = packet.current;
    if (!svg || !pk) return;
    const path = svg.querySelector<SVGPathElement>(`[data-e="${step.ride}"]`);
    if (!path) return;
    const len = path.getTotalLength();
    if (prefersReducedMotion()) { const p = path.getPointAtLength(len); pk.setAttribute("cx", String(p.x)); pk.setAttribute("cy", String(p.y)); pk.style.opacity = "1"; return; }
    let raf = 0; const t0 = performance.now(), dur = 900;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      const p = path.getPointAtLength(len * e);
      pk.setAttribute("cx", p.x.toFixed(1)); pk.setAttribute("cy", p.y.toFixed(1));
      pk.style.opacity = k < .05 ? String(k * 20) : k > .9 ? String((1 - k) * 10) : "1";
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step]);

  return (
    <div className="clpipe" ref={visRef}>
      <Frame className="clfig" seed={3} tag="one job" label={<><b>{STEPS.length}</b> hops · <b>{NODES.length}</b> services</>}>
        <svg ref={svgRef} viewBox="0 0 960 430" className="clflow" aria-hidden="true">
          {Object.entries(EDGES).map(([id, d]) => (
            <path key={id} d={d} data-e={id} className={`e${step.e.includes(id) ? " on" : ""}${id === "co_mac" || id === "dk_ag" ? " ret" : ""}`} />
          ))}
          {NODES.map(n => {
            const on = step.on.includes(n.id);
            return (
              <g key={n.id} className={`n${on ? " on" : ""}`}>
                <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={2} />
                <text className="t" x={n.x + 16} y={n.y + 27}>{n.t}</text>
                <text className="s" x={n.x + 16} y={n.y + 46}>{n.s}</text>
              </g>
            );
          })}
          <circle ref={packet} className={`pk${step.ret ? " ret" : ""}`} r={4.5} />
        </svg>
        <div className="clstatus"><i /><span>status</span><b>{step.st}</b><em>GET /api/jobs/j_7f3a9c21, once a second</em></div>
      </Frame>

      <ol className="clsteps">
        {STEPS.map((s, k) => (
          <li key={s.k} className={k === i ? "cur" : ""}>
            <button type="button" onClick={() => { setI(k); start(); }} aria-current={k === i ? "step" : undefined}>
              <span className="k">{s.k}</span><b>{s.t}</b>
            </button>
            <p>{s.cap}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
