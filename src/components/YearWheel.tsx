import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import commits from "../data/commits.json";
import { prefersReducedMotion } from "../lib/useReveal";

type Commit = { r: string; t: string; m: string };
const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY = 86_400_000, R = 250, C = 300;

/**
 * The wheel is the one place the whole site's colour scheme is visible at once: a day's
 * spoke is split into the projects that day's commits went to, in this fixed order, and
 * everything that is not a named project stays grey. The colours are each project's own,
 * the same ones its section and its page carry.
 */
const PROJECTS = [
  { key: "trueline", label: "TrueLine", color: "#40e69e", repos: ["trueline"] },
  { key: "clarity", label: "Clarity", color: "#589da1", repos: ["clarity", "clarity-web"] },
] as const;
const OTHER = { key: "other", label: "Other", color: "#b4b4bc" } as const;
const LEGEND = [...PROJECTS, OTHER];
const projectOf = (repo: string) =>
  PROJECTS.find(p => (p.repos as readonly string[]).includes(repo.toLowerCase()))?.key ?? OTHER.key;
const dayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });

export type WheelHandle = { play: () => void; total: number };

/**
 * Every commit Adam has pushed, one turn of the year. Today sits at the top; each active
 * day is a spoke from the rim inward, longer for more commits. Rebuilt from commits.json,
 * which a GitHub Action refreshes daily, so the wheel grows on its own.
 */
export function YearWheel({ onReady, intro = false }: { onReady?: (h: WheelHandle) => void; intro?: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; head: string; body: string } | null>(null);

  const model = useMemo(() => {
    const list = commits as Commit[];
    const byDay = new Map<string, { n: number; repos: Map<string, number>; by: Map<string, number>; last: string }>();
    for (const c of list) {
      const k = dayKey(new Date(c.t + ":00Z"));
      const e = byDay.get(k) ?? { n: 0, repos: new Map<string, number>(), by: new Map<string, number>(), last: "" };
      e.n++; e.last = c.m;
      e.repos.set(c.r, (e.repos.get(c.r) ?? 0) + 1);
      const p = projectOf(c.r);
      e.by.set(p, (e.by.get(p) ?? 0) + 1);
      byDay.set(k, e);
    }
    const today = new Date();
    const start = new Date(today.getTime() - 365 * DAY);
    const maxN = Math.max(...[...byDay.values()].map(e => e.n), 1);
    const angOf = (d: Date) => -Math.PI / 2 + ((d.getTime() - start.getTime()) / (365 * DAY)) * Math.PI * 2;
    const days = [...byDay.entries()].sort()
      .map(([k, e]) => ({ k, e, d: new Date(k + "T12:00:00") }))
      .filter(x => x.d >= start)
      .map(x => {
        const a = angOf(x.d), len = 18 + (x.e.n / maxN) * (R * 0.42);
        const at = (r: number) => [C + Math.cos(a) * r, C + Math.sin(a) * r] as const;
        /* the spoke is cut into one segment per project, longest-lived colour at the rim,
           each as long as that project's share of the day. A hairline gap keeps two
           colours from reading as one blended stroke. */
        const parts = [...PROJECTS, OTHER]
          .map(p => ({ key: p.key, color: p.color, n: x.e.by.get(p.key) ?? 0 }))
          .filter(p => p.n > 0);
        const gap = parts.length > 1 ? 1.2 : 0;
        let r = R - 6;
        const segs = parts.map(p => {
          const l = (p.n / x.e.n) * len - (parts.length > 1 ? gap : 0);
          const [x1, y1] = at(r), [x2, y2] = at(r - Math.max(l, 1.5));
          r -= Math.max(l, 1.5) + gap;
          return { ...p, x1, y1, x2, y2 };
        });
        const [ox, oy] = at(R - 6), [ix, iy] = at(R - 6 - len);
        return { ...x, a, segs, x1: ox, y1: oy, x2: ix, y2: iy, today: x.k === dayKey(today) };
      });
    const months: { a: number; label: string; year?: number }[] = [];
    for (let m = new Date(start.getFullYear(), start.getMonth() + 1, 1); m <= today; m = new Date(m.getFullYear(), m.getMonth() + 1, 1))
      months.push({ a: angOf(m), label: MON[m.getMonth()], year: m.getMonth() === 0 ? m.getFullYear() : undefined });
    return { days, months, total: list.length, repos: new Set(list.map(c => c.r)).size, start };
  }, []);

  /* hidden before the first paint, so the intro starts from an empty rim */
  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg || !intro || prefersReducedMotion()) return;
    svg.querySelectorAll<SVGElement>(".rim, .spoke").forEach(n => {
      n.style.strokeDasharray = "1"; n.style.strokeDashoffset = "1";
    });
    svg.querySelectorAll<SVGElement>(".mon, .mtick, .ctitle, .center, .sub, .key, .hint, .todaydot").forEach(n => { n.style.opacity = "0"; });
  }, [intro]);

  /* the sweep turns once every two minutes and brightens spokes as it passes */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const svg = svgRef.current; if (!svg) return;
    const sweep = svg.querySelector<SVGPathElement>(".sweep");
    const spokes = [...svg.querySelectorAll<SVGLineElement>(".spoke")];
    let a = -Math.PI / 2, last = performance.now(), raf = 0;
    const turn = (now: number) => {
      a += ((now - last) / 1000) * (Math.PI * 2 / 120); last = now;
      sweep?.setAttribute("transform", `rotate(${(a * 180 / Math.PI).toFixed(2)} ${C} ${C})`);
      spokes.forEach(sp => {
        let d = (Number(sp.dataset.a) - a - 0.3) % (Math.PI * 2); if (d < 0) d += Math.PI * 2;
        const k = d > Math.PI * 2 - 0.55 ? (d - (Math.PI * 2 - 0.55)) / 0.55 : 0;
        sp.style.opacity = (0.55 + 0.45 * k).toFixed(3);
      });
      raf = requestAnimationFrame(turn);
    };
    raf = requestAnimationFrame(turn);
    return () => cancelAnimationFrame(raf);
  }, [model]);

  /* the assembly: rim, ticks, spokes, count. Driven by the boot, replayable. */
  useEffect(() => {
    const svg = svgRef.current; if (!svg || !onReady) return;
    const q = <T extends Element>(s: string) => svg.querySelectorAll<T>(s);
    const rims = [...q<SVGCircleElement>(".rim")];
    const spokes = [...q<SVGLineElement>(".spoke")];
    const labels = [...q<SVGElement>(".mon"), ...q<SVGElement>(".mtick")];
    const centre = [...q<SVGTextElement>(".ctitle"), ...q<SVGTextElement>(".center"), ...q<SVGTextElement>(".sub"),
                    ...q<SVGGElement>(".key"), ...q<SVGTextElement>(".hint")];
    const dot = svg.querySelector<SVGCircleElement>(".todaydot");
    const count = svg.querySelector<SVGTextElement>(".center");
    let raf = 0;
    const play = () => {
      cancelAnimationFrame(raf);
      if (prefersReducedMotion()) return;
      const reset = (n: SVGElement, dash = true) => {
        n.style.transition = "none";
        if (dash) { n.style.strokeDasharray = "1"; n.style.strokeDashoffset = "1"; } else n.style.opacity = "0";
      };
      rims.forEach(n => reset(n));
      spokes.forEach(n => reset(n));
      labels.concat(centre).forEach(n => reset(n, false));
      if (dot) reset(dot, false);
      void svg.getBoundingClientRect();
      const at = (fn: () => void, ms: number) => setTimeout(fn, ms);
      at(() => { if (dot) { dot.style.transition = "opacity .5s"; dot.style.opacity = "1"; } }, 150);
      at(() => rims.forEach((n, i) => { n.style.transition = `stroke-dashoffset 1.25s cubic-bezier(.4,0,.2,1) ${i * 0.12}s`; n.style.strokeDashoffset = "0"; }), 300);
      at(() => labels.forEach((n, i) => { n.style.transition = `opacity .5s ease ${(i % 12) * 0.05}s`; n.style.opacity = "1"; }), 900);
      at(() => spokes.forEach((n, i) => { n.style.transition = `stroke-dashoffset .5s cubic-bezier(.22,1,.36,1) ${((i / spokes.length) * 1.25).toFixed(3)}s`; n.style.strokeDashoffset = "0"; }), 1100);
      at(() => {
        centre.forEach((n, i) => { n.style.transition = `opacity .6s ease ${i * 0.12}s`; n.style.opacity = "1"; });
        const t0 = performance.now();
        const step = (now: number) => {
          const k = Math.min(1, (now - t0) / 1100), e = 1 - Math.pow(1 - k, 3);
          if (count) count.textContent = String(Math.round(model.total * e));
          if (k < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
      }, 1500);
    };
    onReady({ play, total: model.total });
    return () => cancelAnimationFrame(raf);
  }, [model, onReady]);

  const show = (e: React.PointerEvent, head: string, body: string) =>
    setTip({ x: Math.min(innerWidth - 360, e.clientX + 14), y: Math.min(innerHeight - 90, e.clientY + 14), head, body });

  return (
    <>
      <svg ref={svgRef} viewBox="0 0 600 600" role="img"
           aria-label={`${model.total} commits over the past 12 months across ${model.repos} repositories, drawn as one line per day around a year`}>
        <defs>
          <radialGradient id="sweepGrad">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="1" stopColor="#fff" stopOpacity=".045" />
          </radialGradient>
          <clipPath id="swClip"><circle cx={C} cy={C} r={R} /></clipPath>
        </defs>
        <circle className="rim" cx={C} cy={C} r={R} pathLength={1} transform={`rotate(-90 ${C} ${C})`} />
        <circle className="rim" cx={C} cy={C} r={R * 0.985} strokeOpacity=".5" pathLength={1} transform={`rotate(-90 ${C} ${C})`} />
        <path className="sweep" clipPath="url(#swClip)"
              d={`M${C} ${C} L${C + R} ${C} A${R} ${R} 0 0 1 ${C + Math.cos(0.55) * R} ${C + Math.sin(0.55) * R} Z`} />
        {model.months.map((m, i) => {
          const anchor = Math.cos(m.a) > 0.3 ? "start" : Math.cos(m.a) < -0.3 ? "end" : "middle";
          const x = C + Math.cos(m.a) * (R + 22), y = C + Math.sin(m.a) * (R + 22) + 4;
          return (
            <g key={i}>
              <line className="mtick" x1={C + Math.cos(m.a) * R} y1={C + Math.sin(m.a) * R}
                    x2={C + Math.cos(m.a) * (R + 8)} y2={C + Math.sin(m.a) * (R + 8)} />
              <text className="mon" x={x} y={y} textAnchor={anchor}>{m.label}</text>
              {m.year && <text className="mon" x={x} y={y + 13} textAnchor={anchor} fontSize="9" fillOpacity=".7">{m.year}</text>}
            </g>
          );
        })}
        {model.days.map(d => (
          <g key={d.k} className={`day${d.today ? " today" : ""}`}
             onPointerEnter={e => { e.currentTarget.classList.add("lit");
               show(e, `${d.d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })} · ${d.e.n} commit${d.e.n > 1 ? "s" : ""}`,
                    [...d.e.repos].sort((a, b) => b[1] - a[1]).map(([r, n]) => `${r} ${n}`).join(" · ")); }}
             onPointerMove={e => setTip(t => t && { ...t, x: Math.min(innerWidth - 360, e.clientX + 14), y: Math.min(innerHeight - 90, e.clientY + 14) })}
             onPointerLeave={e => { e.currentTarget.classList.remove("lit"); setTip(null); }}>
            {/* one fat invisible line so a 1.2 px spoke is still catchable by a pointer */}
            <line className="hit" x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} />
            {d.segs.map(sg => (
              <line key={sg.key} className="spoke" pathLength={1} data-a={d.a}
                    x1={sg.x1} y1={sg.y1} x2={sg.x2} y2={sg.y2}
                    style={{ "--c": sg.color } as React.CSSProperties} />
            ))}
          </g>
        ))}
        <circle className="todaydot" cx={C} cy={C - R} r="3.2" fill="var(--accent)" />
        {/* The centre says what the object is before it says how big the number is. The
            old order was the other way round — a large unlabelled count over three lines of
            small grey type, with the word "commits" buried in the middle of one of them —
            and readers told Adam they could not tell what the wheel was counting. */}
        <text className="ctitle" x={C} y={C - 52} textAnchor="middle">COMMITS, PAST 12 MONTHS</text>
        <text className="center" x={C} y={C + 4} textAnchor="middle" fontSize="46" letterSpacing="-1.5">{model.total}</text>
        <text className="sub" x={C} y={C + 28} textAnchor="middle">
          {model.days.length} active days · {model.repos} repos
        </text>
        {/* the key. Without it the two colours are decoration; with it the wheel says
            which project each day of work went to. */}
        {(() => {
          const W = (l: string) => 12 + l.length * 6.3, GAP = 14;
          const total = LEGEND.reduce((n, p) => n + W(p.label), 0) + GAP * (LEGEND.length - 1);
          let x = C - total / 2;
          return LEGEND.map(p => {
            const at = x; x += W(p.label) + GAP;
            return (
              <g className="key" key={p.key}>
                <circle cx={at + 2.5} cy={C + 46} r="2.8" fill={p.color} />
                <text x={at + 12} y={C + 49.5} textAnchor="start">{p.label}</text>
              </g>
            );
          });
        })()}
        {/* the encoding, said plainly: without it a spoke reads as decoration rather than
            as one day of work. Everything in this centre block has to stay inside the
            radius the spokes stop at (122 in viewBox units, the shortest a spoke can be),
            or a busy day will one day be drawn straight through the type. */}
        <text className="hint" x={C} y={C + 72} textAnchor="middle">each line is one day</text>
      </svg>
      {tip && (
        <div className="tip on" style={{ transform: `translate(${tip.x}px,${tip.y}px)` }}>
          <b>{tip.head}</b><em>{tip.body}</em>
        </div>
      )}
    </>
  );
}
