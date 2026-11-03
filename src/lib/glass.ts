import { useEffect, type RefObject } from "react";
import { prefersReducedMotion } from "./useReveal";

/**
 * Glass that bends what is behind it, rather than only blurring it. A displacement map is
 * drawn for the element's exact size and shape, and the backdrop is pushed through it: near
 * the rim the content behind slides inward, the way a thick pane refracts at its edge, and a
 * lens magnifies toward its middle. Only Chromium can put an SVG filter in backdrop-filter;
 * everywhere else the element keeps the plain frost its CSS already gives it.
 */

type Kind = "pill" | "lens";

const chromium = () => {
  const ua = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData;
  return !!ua?.brands?.some(b => /Chromium/.test(b.brand));
};

let host: SVGSVGElement | null = null;
let seq = 0;

function hostSvg() {
  if (host) return host;
  host = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, { position: "absolute", width: "0", height: "0", overflow: "hidden" });
  document.body.appendChild(host);
  return host;
}

/** R and G carry x and y displacement around a mid-grey of no movement. */
function drawMap(w: number, h: number, kind: Kind, bezel: number) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  const img = g.createImageData(w, h);
  const r = kind === "lens" ? Math.min(w, h) / 2 : h / 2;
  const cx = w / 2, cy = h / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const px = x + .5, py = y + .5;
    let dx = 0, dy = 0;
    if (kind === "lens") {
      const vx = (px - cx) / r, vy = (py - cy) / r, d = Math.hypot(vx, vy);
      if (d < 1) {
        /* sample nearer the middle (magnify), much harder over the last stretch to the rim */
        const k = .35 + .65 * Math.pow(d, 3);
        dx = -vx * k; dy = -vy * k;
      }
    } else {
      /* distance from the rounded-rect edge, and the outward normal there */
      const qx = Math.max(Math.abs(px - cx) - (w / 2 - r), 0) * Math.sign(px - cx);
      const qy = Math.max(Math.abs(py - cy) - (h / 2 - r), 0) * Math.sign(py - cy);
      const len = Math.hypot(qx, qy);
      const inside = r - len;
      if (inside > 0 && inside < bezel && len > 0) {
        const m = Math.pow(1 - inside / bezel, 2);
        dx = -(qx / len) * m; dy = -(qy / len) * m;
      }
    }
    const i = (y * w + x) * 4;
    img.data[i] = 128 + dx * 127; img.data[i + 1] = 128 + dy * 127; img.data[i + 2] = 128; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c.toDataURL();
}

/** Bends the backdrop of `ref` for as long as it is mounted; `base` is the rest of its
    backdrop-filter, kept after the bend. */
export function useLiquidGlass(ref: RefObject<HTMLElement | null>, { kind = "pill", scale = 34, bezel = 22, base = "blur(3px) saturate(1.6)", on = true }:
  { kind?: Kind; scale?: number; bezel?: number; base?: string; on?: boolean } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !on || !chromium() || prefersReducedMotion()) return;
    const id = `lg${++seq}`;
    const ns = "http://www.w3.org/2000/svg";
    const f = document.createElementNS(ns, "filter");
    f.id = id;
    f.setAttribute("filterUnits", "userSpaceOnUse");
    f.setAttribute("color-interpolation-filters", "sRGB");
    const im = document.createElementNS(ns, "feImage");
    im.setAttribute("result", "map");
    const dm = document.createElementNS(ns, "feDisplacementMap");
    dm.setAttribute("in", "SourceGraphic"); dm.setAttribute("in2", "map");
    dm.setAttribute("xChannelSelector", "R"); dm.setAttribute("yChannelSelector", "G");
    dm.setAttribute("scale", String(scale));
    f.append(im, dm);
    hostSvg().appendChild(f);

    let raf = 0, lastW = 0, lastH = 0;
    const fit = () => {
      raf = 0;
      const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
      if (!w || !h || (w === lastW && h === lastH)) return;
      lastW = w; lastH = h;
      for (const n of [f, im]) { n.setAttribute("x", "0"); n.setAttribute("y", "0"); n.setAttribute("width", String(w)); n.setAttribute("height", String(h)); }
      im.setAttribute("href", drawMap(w, h, kind, bezel));
      const v = `url(#${id}) ${base}`;
      el.style.setProperty("backdrop-filter", v);
      el.style.setProperty("-webkit-backdrop-filter", v);
    };
    const ro = new ResizeObserver(() => { if (!raf) raf = requestAnimationFrame(fit); });
    ro.observe(el);
    fit();
    return () => {
      ro.disconnect(); cancelAnimationFrame(raf); f.remove();
      el.style.removeProperty("backdrop-filter"); el.style.removeProperty("-webkit-backdrop-filter");
    };
  }, [ref, kind, scale, bezel, base, on]);
}
