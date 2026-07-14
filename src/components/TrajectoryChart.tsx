import { useEffect, useRef, type CSSProperties, type RefObject } from "react";

/**
 * About-section backdrop: chaos → least-squares fit → labeled trajectory.
 *
 * In "scroll" mode the owning section is a tall runway and this component scrubs the whole
 * sequence from its scroll progress: scattered points settle into a data cloud, a fitted line
 * draws through them, waypoint labels light up as the line passes them, and finally the chart
 * dims while the section's real content rises in front (the content reads `--about-in`, which
 * this component sets on the section element). In "static" mode (mobile / reduced motion) it
 * just renders the finished chart, dimmed, with no labels.
 */

const POINT_COUNT = 140;
const ACCENT = "#8FA8F0";
/* Regression line endpoints in unit space (y measured downward, so this slopes upward visually). */
const LINE_X0 = 0.08;
const LINE_X1 = 0.92;
const LINE_Y0 = 0.72;
const LINE_Y1 = 0.3;

/** Real milestones placed along the fit; x also sets when each lights up as the line draws. */
/* Dates from the master resume: CSAFE Jun 2023–Aug 2024, VRAC Jan–Jun 2024, paper Mar 2024. */
const WAYPOINTS = [
  { x: 0.14, year: "2023", label: "Forensics research · CSAFE" },
  { x: 0.33, year: "2024", label: "VR research · Iowa State" },
  { x: 0.52, year: "2024", label: "First publication" },
  { x: 0.7, year: "2025", label: "Carnegie Mellon · Stat & ML" },
  { x: 0.88, year: "Now", label: "NIST · SURF research intern" },
] as const;

/** Deterministic PRNG so the scatter is identical on every visit. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Point = {
  /* chaotic start position */
  sx: number;
  sy: number;
  /* settled position: on the line plus a residual */
  ex: number;
  ey: number;
};

function lineYAt(x: number): number {
  return LINE_Y0 + ((x - LINE_X0) / (LINE_X1 - LINE_X0)) * (LINE_Y1 - LINE_Y0);
}

/** Where along the drawn line (0..1) a given x sits. */
function lineProgressAt(x: number): number {
  return (x - LINE_X0) / (LINE_X1 - LINE_X0);
}

/**
 * When a waypoint starts appearing, in line-draw progress. Slightly BEFORE the line reaches it
 * (factor < 1) so even the last waypoint reaches full opacity by q = 1 — anchoring at the raw
 * line progress would leave late waypoints permanently dim.
 */
function waypointAppearAt(x: number): number {
  return lineProgressAt(x) * 0.9;
}

function makePoints(): Point[] {
  const rand = mulberry32(20260706);
  const gauss = () => {
    /* Box–Muller */
    const u = Math.max(rand(), 1e-9);
    const v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return Array.from({ length: POINT_COUNT }, () => {
    const ex = LINE_X0 + rand() * (LINE_X1 - LINE_X0);
    return {
      sx: 0.03 + rand() * 0.94,
      sy: 0.05 + rand() * 0.9,
      ex,
      ey: Math.min(0.95, Math.max(0.05, lineYAt(ex) + gauss() * 0.055)),
    };
  });
}

function clamp01(n: number): number {
  return Math.min(Math.max(n, 0), 1);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Sequence timeline. Progress runs from the moment the section's top enters the viewport
 * (p = 0, points already settling while the section slides in after the hero) to the end of its
 * scroll runway (p = 1). Phases overlap so there is no dead scroll between them; with a 280dvh
 * runway the entry itself covers roughly the first third of p.
 */
const SETTLE_END = 0.62;
const LINE_START = 0.5;
const LINE_END = 0.72;
/* Hold (0.72–0.85): the finished chart — line, waypoints, annotation — stays fully lit for a
   stretch of scroll before the hand-off begins. */
const DIM_START = 0.85;
const DIM_END = 0.94;
const CONTENT_START = 0.87;
const CONTENT_END = 0.98;

/** Line-draw progress for a given overall progress p. */
function lineQ(p: number): number {
  return easeInOutCubic(clamp01((p - LINE_START) / (LINE_END - LINE_START)));
}

function draw(canvas: HTMLCanvasElement, points: Point[], p: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  /* Points: chaos → settled cloud. Radius/alpha rise slightly as structure appears. */
  const t = easeInOutCubic(clamp01(p / SETTLE_END));
  const alpha = 0.45 + 0.3 * t;
  const radius = 1.6 + 0.6 * t;
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
  for (const pt of points) {
    const x = (pt.sx + (pt.ex - pt.sx) * t) * w;
    const y = (pt.sy + (pt.ey - pt.sy) * t) * h;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  /* Fitted line: draws left→right once the cloud has mostly settled. */
  const q = lineQ(p);
  if (q > 0) {
    ctx.strokeStyle = ACCENT;
    ctx.globalAlpha = 0.4 + 0.6 * q;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(LINE_X0 * w, LINE_Y0 * h);
    ctx.lineTo((LINE_X0 + (LINE_X1 - LINE_X0) * q) * w, (LINE_Y0 + (LINE_Y1 - LINE_Y0) * q) * h);
    ctx.stroke();

    /* Waypoint markers pop in as the line reaches them: accent ring + dot on the fit. */
    for (const wp of WAYPOINTS) {
      const a = clamp01((q - waypointAppearAt(wp.x)) * 8);
      if (a <= 0) {
        continue;
      }
      const x = wp.x * w;
      const y = lineYAt(wp.x) * h;
      ctx.globalAlpha = a;
      ctx.fillStyle = ACCENT;
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 6.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

export function TrajectoryChart({
  sectionRef,
  mode,
}: {
  sectionRef: RefObject<HTMLElement | null>;
  mode: "scroll" | "static";
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const pointsRef = useRef<Point[] | null>(null);
  const progressRef = useRef(mode === "static" ? 1 : 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) {
      return;
    }
    if (!pointsRef.current) {
      pointsRef.current = makePoints();
    }
    const points = pointsRef.current;

    const size = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      draw(canvas, points, progressRef.current);
    };

    if (mode === "static") {
      progressRef.current = 1;
      canvas.style.opacity = "0.3";
      section.style.removeProperty("--about-in");
      size();
      const ro = new ResizeObserver(size);
      ro.observe(canvas);
      return () => ro.disconnect();
    }

    let raf = 0;
    const run = () => {
      raf = 0;
      const overlay = overlayRef.current;
      const vh = window.innerHeight;
      const rect = section.getBoundingClientRect();
      /* p = 0 once the section has risen ENTRY_LEAD of the viewport (not the instant it enters),
         1 at the runway's end — animating during the scroll-in from the hero, but not from the
         very first pixel. Raise ENTRY_LEAD to start later, lower it to start earlier. */
      const ENTRY_LEAD = 0.35;
      const start = vh * (1 - ENTRY_LEAD);
      const span = section.offsetHeight - vh * ENTRY_LEAD;
      const p = clamp01(span > 0 ? (start - rect.top) / span : 1);
      if (p === progressRef.current) {
        return;
      }
      progressRef.current = p;
      draw(canvas, points, p);
      /* Hand-off: content rises via --about-in while the chart dims underneath it. The dim ramp
         starts earlier and cuts deeper than the content ramp so labels are gone before text is
         readable on top of them. */
      const contentIn = clamp01((p - CONTENT_START) / (CONTENT_END - CONTENT_START));
      const dim = clamp01((p - DIM_START) / (DIM_END - DIM_START));
      section.style.setProperty("--about-in", contentIn.toFixed(4));
      canvas.style.opacity = (1 - 0.78 * dim).toFixed(4);
      if (overlay) {
        overlay.style.opacity = (1 - dim).toFixed(4);
        overlay.style.setProperty("--wp-p", lineQ(p).toFixed(4));
      }
    };
    const onScroll = () => {
      if (raf === 0) {
        raf = window.requestAnimationFrame(run);
      }
    };
    size();
    run();
    const ro = new ResizeObserver(size);
    ro.observe(canvas);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) {
        window.cancelAnimationFrame(raf);
      }
      section.style.removeProperty("--about-in");
    };
  }, [mode, sectionRef]);

  /** Label fades in just after its marker (driven by --wp-p, no re-renders). */
  const waypointStyle = (x: number): CSSProperties => ({
    left: `${x * 100}%`,
    top: `${lineYAt(x) * 100}%`,
    opacity: `clamp(0, calc((var(--wp-p, 0) - ${(waypointAppearAt(x) + 0.03).toFixed(3)}) * 12), 1)`,
    /* Keeps labels legible where scatter points pass behind the text. */
    textShadow: "0 1px 8px rgba(0, 0, 0, 0.95), 0 0 3px rgba(0, 0, 0, 0.85)",
  });

  return (
    <div ref={rootRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {mode === "scroll" && (
        <div ref={overlayRef} className="absolute inset-0">
          {WAYPOINTS.map((wp, i) => (
            <div
              key={wp.label}
              className={`absolute w-max ${
                i === WAYPOINTS.length - 1
                  ? "-translate-x-[85%] -translate-y-[135%] text-right"
                  : "-translate-x-1/2 -translate-y-[135%] text-center"
              }`}
              style={waypointStyle(wp.x)}
            >
              <p className="font-mono text-[10px] tracking-[0.22em] text-az-indigo">{wp.year}</p>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/70 sm:text-[10px]">
                {wp.label}
              </p>
            </div>
          ))}
          {/* Fit annotation — plain statistical notation, no tagline. */}
          <div
            className="absolute right-[8%] top-[16%] text-right"
            style={{ opacity: "clamp(0, calc((var(--wp-p, 0) - 0.96) * 25), 1)" }}
          >
            <p className="font-mono text-[13px] tracking-[0.14em] text-az-indigo sm:text-[15px]">
              ŷ = β₀ + β₁x
            </p>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.24em] text-white/45 sm:text-[10px]">
              Least-squares fit · n = {POINT_COUNT}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
