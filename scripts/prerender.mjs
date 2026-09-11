#!/usr/bin/env node
/**
 * Writes a real HTML file for every route, so GitHub Pages serves /trueline/ directly
 * instead of falling through to the SPA shell. Crawlers, link previews and AI browsers
 * then get a page with the right title, the right canonical, its own OG card, and a
 * static text fallback — none of which a client-side route can provide.
 *
 * Deliberately NOT server-rendering React: the page is an animation engine that reads
 * innerWidth and the DOM as it draws. Rendering it in node would mean either a DOM shim
 * or making the whole sequence SSR-safe, to produce markup that main.tsx throws away a
 * moment later. The static fallback already in index.html is the pattern that works, so
 * this extends it per route.
 *
 * Run after `vite build`, against dist/.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DIST = new URL("../dist/", import.meta.url).pathname;
const ORIGIN = "https://adamzhu.dev";

const ROUTES = [
  {
    dir: "trueline",
    title: "TrueLine | A bowling ball tracker for iPhone, by Adam Zhu",
    description:
      "TrueLine turns one iPhone propped behind the approach into a bowling ball tracker. An on-device detector finds the ball frame by frame, a calibrated homography maps it onto real lane coordinates, and it reports entry board, entry angle, speed and breakpoint. Built by Adam Zhu.",
    image: `${ORIGIN}/og-trueline.png`,
    fallback: `
      <h1>TrueLine</h1>
      <p>
        TrueLine is a native iOS app that turns one iPhone, propped behind the approach,
        into a bowling ball tracker. It records a throw, finds the ball frame by frame with
        an on-device Core ML detector, maps the path onto real lane coordinates through a
        user-placed calibration, and reports the numbers coaches use: board at the arrows,
        breakpoint, entry board, entry angle and speed. Everything runs on the phone, with
        no cloud processing. Built by Adam Zhu and released on the App Store in August 2026.
      </p>
      <h2>How it works</h2>
      <ol>
        <li>Capture: AVFoundation records one throw in portrait from behind the approach.</li>
        <li>Detection: a single-class YOLO detector, fine-tuned on hand-labeled frames and
            exported to Core ML, finds the ball in each frame.</li>
        <li>Tracking: a constant-velocity Kalman filter joins flickering detections into one
            continuous path, with a gate that widens during detection gaps.</li>
        <li>Lane mapping: the calibration homography converts each sample to board and feet,
            so every metric is a lane measurement rather than a pixel measurement.</li>
        <li>Metric extraction: Savitzky-Golay smoothing, interpolated line crossings and
            least-squares slopes produce the reported numbers.</li>
      </ol>
      <h2>Links</h2>
      <ul>
        <li><a href="https://apps.apple.com/us/app/trueline-bowling-ball-tracker/id6801953797">TrueLine on the App Store</a></li>
        <li><a href="${ORIGIN}/">Adam Zhu, adamzhu.dev</a></li>
      </ul>`,
  },
];

const shell = readFileSync(join(DIST, "index.html"), "utf8");

/** Replace the first match of `re`, and fail loudly if the shell stopped containing it. */
function swap(html, re, next, label) {
  if (!re.test(html)) throw new Error(`prerender: could not find ${label} in dist/index.html`);
  return html.replace(re, next);
}

for (const r of ROUTES) {
  const url = `${ORIGIN}/${r.dir}/`;
  let html = shell;

  html = swap(html, /<title>[\s\S]*?<\/title>/, `<title>${r.title}</title>`, "<title>");
  html = swap(html, /(<meta\s+name="description"\s+content=")[\s\S]*?(")/,
    `$1${r.description}$2`, 'meta description');
  html = swap(html, /(<link\s+rel="canonical"\s+href=")[^"]*(")/, `$1${url}$2`, "canonical");

  for (const [prop, val] of [["og:title", r.title], ["og:description", r.description],
                             ["og:url", url], ["og:image", r.image], ["og:image:secure_url", r.image],
                             ["og:image:alt", r.title]]) {
    html = html.replace(new RegExp(`(<meta\\s+property="${prop}"\\s+content=")[\\s\\S]*?(")`), `$1${val}$2`);
  }
  for (const [name, val] of [["twitter:title", r.title], ["twitter:description", r.description],
                             ["twitter:image", r.image], ["twitter:image:alt", r.title]]) {
    html = html.replace(new RegExp(`(<meta\\s+name="${name}"\\s+content=")[\\s\\S]*?(")`), `$1${val}$2`);
  }

  // the Person JSON-LD is home's; a project page describes software instead
  html = swap(html, /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org", "@type": "SoftwareApplication",
      name: "TrueLine", applicationCategory: "SportsApplication",
      operatingSystem: "iOS", url,
      downloadUrl: "https://apps.apple.com/us/app/trueline-bowling-ball-tracker/id6801953797",
      author: { "@type": "Person", name: "Adam Zhu", url: `${ORIGIN}/` },
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    })}</script>`, "JSON-LD");

  html = swap(html, /<!--seo-fallback:start-->[\s\S]*?<!--seo-fallback:end-->/,
    `<!--seo-fallback:start-->${r.fallback}<!--seo-fallback:end-->`, "seo-fallback markers");

  mkdirSync(join(DIST, r.dir), { recursive: true });
  writeFileSync(join(DIST, r.dir, "index.html"), html);
  console.log(`prerendered /${r.dir}/`);
}
