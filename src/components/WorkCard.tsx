import { useEffect, useRef } from "react";
import { Frame } from "./Frame";
import { whenSeen } from "../lib/useReveal";
import { out } from "../lib/router";

const INK2 = "#a2a2a7";
export type Mark = "hist" | "tail" | "bracket" | "ladder";

/** Each card's mark is drawn from the shape of that project's own work, and draws itself in. */
function drawMark(svg: SVGSVGElement, kind: Mark) {
  const NS = "http://www.w3.org/2000/svg";
  const el = (t: string, a: Record<string, string | number>) => {
    const n = document.createElementNS(NS, t);
    for (const [k, v] of Object.entries(a)) n.setAttribute(k, String(v));
    return n;
  };
  svg.replaceChildren();
  svg.setAttribute("viewBox", "0 0 200 64");
  svg.setAttribute("preserveAspectRatio", "none");
  const grow: (() => void)[] = [];

  if (kind === "hist") {
    [.25, .45, .8, 1, .7, .38, .2, .12, .08].forEach((v, i) => {
      const r = el("rect", { x: i * 22, y: 64 - 60 * v, width: 17, height: 60 * v, fill: INK2, opacity: .45 }) as SVGRectElement;
      r.style.transformOrigin = "bottom"; r.style.transform = "scaleY(0)";
      r.style.transition = `transform .7s cubic-bezier(.22,1,.36,1) ${0.3 + i * 0.06}s`;
      svg.appendChild(r); grow.push(() => { r.style.transform = "scaleY(1)"; });
    });
  }
  if (kind === "tail") {
    const pts: string[] = [];
    for (let i = 0; i <= 40; i++) { const t = i / 40, z = (t - .42) * 4.2; pts.push(`${(t * 200).toFixed(1)},${(60 - 56 * Math.exp(-z * z / 2)).toFixed(1)}`); }
    const p = el("path", { d: "M" + pts.join(" L"), fill: "none", stroke: INK2, "stroke-width": 1.4, pathLength: 1 }) as SVGPathElement;
    p.style.strokeDasharray = "1"; p.style.strokeDashoffset = "1"; p.style.transition = "stroke-dashoffset 1.4s cubic-bezier(.22,1,.36,1) .3s";
    const cut = 31;
    const tail = el("path", { d: "M" + pts.slice(cut).join(" L") + " L200,60 L" + pts[cut].split(",")[0] + ",60Z", fill: INK2, opacity: 0 }) as SVGPathElement;
    tail.style.transition = "opacity .6s ease 1.5s";
    svg.append(p, tail); grow.push(() => { p.style.strokeDashoffset = "0"; tail.style.opacity = ".25"; });
  }
  if (kind === "bracket") {
    for (let c = 0; c < 3; c++) {
      const n = 4 >> c, gap = 64 / n;
      for (let j = 0; j < n; j++) {
        const cy = gap * (j + .5), x = c * 66;
        const l = el("line", { x1: x, y1: cy, x2: x + 50, y2: cy, stroke: INK2, "stroke-width": 1.2, opacity: .55, pathLength: 1 }) as SVGLineElement;
        l.style.strokeDasharray = "1"; l.style.strokeDashoffset = "1"; l.style.transition = `stroke-dashoffset .6s ease ${0.3 + c * 0.25 + j * 0.05}s`;
        svg.appendChild(l); grow.push(() => { l.style.strokeDashoffset = "0"; });
        if (c < 2 && j % 2 === 0) {
          const v = el("line", { x1: x + 50, y1: cy, x2: x + 50, y2: gap * (j + 1.5), stroke: INK2, "stroke-width": 1.2, opacity: .55, pathLength: 1 }) as SVGLineElement;
          v.style.strokeDasharray = "1"; v.style.strokeDashoffset = "1"; v.style.transition = `stroke-dashoffset .4s ease ${0.6 + c * 0.25}s`;
          svg.appendChild(v); grow.push(() => { v.style.strokeDashoffset = "0"; });
        }
      }
    }
  }
  if (kind === "ladder") {
    [.2, .55, .35, .8, .62, .95].forEach((v, i) => {
      const cy = (64 / 6) * (i + .5);
      const l = el("line", { x1: 0, y1: cy, x2: 200 * v, y2: cy, stroke: INK2, "stroke-width": 1.2, opacity: .55, pathLength: 1 }) as SVGLineElement;
      l.style.strokeDasharray = "1"; l.style.strokeDashoffset = "1"; l.style.transition = `stroke-dashoffset .8s cubic-bezier(.22,1,.36,1) ${0.3 + i * 0.08}s`;
      const c = el("circle", { cx: 200 * v, cy, r: 2.2, fill: INK2, opacity: 0 }) as SVGCircleElement;
      c.style.transition = `opacity .3s ease ${1.1 + i * 0.08}s`;
      svg.append(l, c); grow.push(() => { l.style.strokeDashoffset = "0"; c.style.opacity = ".9"; });
    });
  }
  return () => grow.forEach(f => f());
}

export function WorkCard({ href, mark, title, blurb, stat, cta, seed }: {
  href: string; mark: Mark; title: string; blurb: string; stat: React.ReactNode; cta: string; seed: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = svgRef.current; if (!svg) return;
    const start = drawMark(svg, mark);
    /* watch the whole card, not the mark. The mark is 76 px tall and sits at the top of the
       card, so watching it started a 1.4 s draw the instant the card's top edge cleared the
       bottom of the screen — and the draw was over before you ever looked at it. */
    const card = svg.closest(".win") ?? svg.parentElement;
    return card ? whenSeen(card, start, 0.5) : undefined;
  }, [mark]);

  return (
    <Frame seed={seed} threshold={0.4}>
      <a className="card" {...out} href={href}>
          <div className="mark"><svg ref={svgRef} aria-hidden="true" /></div>
          <b>{title}</b>
          <p>{blurb}</p>
          <p className="stat">{stat}</p>
          <span className="go">{cta} &#8599;</span>
        </a>
    </Frame>
  );
}
