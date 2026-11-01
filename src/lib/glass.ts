import { useEffect, type RefObject } from "react";

/**
 * Liquid glass, the refracting kind. Every browser gets the frosted base from CSS (.glass):
 * blur, a tint, a rim and a highlight along the top. Chromium can also run an SVG filter on
 * the backdrop, so there the edge of the element bends what is behind it like the rim of a
 * lens. That needs a displacement map the size of the element, drawn here and redrawn when
 * the element changes size. Safari and Firefox ignore url() in backdrop-filter, so they keep
 * the plain frost and nothing breaks.
 */
const chromium = () =>
  typeof navigator !== "undefined" &&
  !!(navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } })
    .userAgentData?.brands.some(b => b.brand === "Chromium");

const reducedTransparency = () =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-transparency: reduce)").matches;

let svgRoot: SVGSVGElement | null = null;
let seq = 0;

/** The map: red and green carry the x and y push, 128 is "stay put". Only a band along the
    edge moves, and it pushes inward along the normal, harder the nearer the rim. */
function drawMap(w: number, h: number, r: number, band: number) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // signed distance to a rounded rectangle, measured from inside
      const px = x + .5 - w / 2, py = y + .5 - h / 2;
      const qx = Math.abs(px) - (w / 2 - r), qy = Math.abs(py) - (h / 2 - r);
      const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
      const d = r - (Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0));
      let nx = 0, ny = 0;
      if (d < band) {
        const k = (1 - d / band) ** 2;
        // the outward normal, from whichever part of the shape is nearest
        let gx = 0, gy = 0;
        if (ox > 0 || oy > 0) { const l = Math.hypot(ox, oy) || 1; gx = ox / l; gy = oy / l; }
        else if (qx > qy) gx = 1; else gy = 1;
        nx = -Math.sign(px) * gx * k; ny = -Math.sign(py) * gy * k;
      }
      const i = (y * w + x) * 4;
      img.data[i] = 128 + nx * 127; img.data[i + 1] = 128 + ny * 127; img.data[i + 2] = 128; img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c.toDataURL();
}

export function useLiquidGlass(ref: RefObject<HTMLElement | null>, { band = 14, scale = 26, blur = 6 } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !chromium() || reducedTransparency()) return;
    if (!svgRoot) {
      svgRoot = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svgRoot.setAttribute("aria-hidden", "true");
      svgRoot.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
      document.body.appendChild(svgRoot);
    }
    const id = `lg${++seq}`;
    const ns = "http://www.w3.org/2000/svg";
    const filter = document.createElementNS(ns, "filter");
    filter.setAttribute("id", id);
    filter.setAttribute("color-interpolation-filters", "sRGB");
    filter.setAttribute("x", "0"); filter.setAttribute("y", "0");
    filter.setAttribute("width", "100%"); filter.setAttribute("height", "100%");
    filter.setAttribute("filterUnits", "userSpaceOnUse");
    const fe = document.createElementNS(ns, "feImage");
    fe.setAttribute("result", "map"); fe.setAttribute("preserveAspectRatio", "none");
    const blurFe = document.createElementNS(ns, "feGaussianBlur");
    blurFe.setAttribute("in", "SourceGraphic"); blurFe.setAttribute("stdDeviation", String(blur)); blurFe.setAttribute("result", "soft");
    const disp = document.createElementNS(ns, "feDisplacementMap");
    disp.setAttribute("in", "soft"); disp.setAttribute("in2", "map"); disp.setAttribute("scale", String(scale));
    disp.setAttribute("xChannelSelector", "R"); disp.setAttribute("yChannelSelector", "G");
    filter.append(fe, blurFe, disp);
    svgRoot.appendChild(filter);

    let last = "";
    const fit = () => {
      const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
      if (!w || !h) return;
      const key = `${w}x${h}`;
      if (key === last) return;
      last = key;
      const r = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0, h / 2, w / 2);
      fe.setAttribute("href", drawMap(w, h, r, Math.min(band, h / 2)));
      for (const n of [filter, fe]) { n.setAttribute("width", String(w)); n.setAttribute("height", String(h)); }
      el.style.setProperty("--glass-filter", `url(#${id}) saturate(1.6) brightness(1.06)`);
    };
    // the bar's width animates, so wait for it to settle instead of drawing every frame
    let t = 0;
    const ro = new ResizeObserver(() => { clearTimeout(t); t = window.setTimeout(fit, 120); });
    ro.observe(el);
    fit();
    el.classList.add("refract");
    return () => { ro.disconnect(); clearTimeout(t); filter.remove(); el.classList.remove("refract"); el.style.removeProperty("--glass-filter"); };
  }, [ref, band, scale, blur]);
}
