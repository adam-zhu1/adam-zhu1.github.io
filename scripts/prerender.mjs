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

/* /trueline/ used to be pre-rendered here; it now redirects to truelinebowling.com (public/trueline/index.html) */
const ROUTES = [];

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
    `<script type="application/ld+json">${JSON.stringify(r.ld)}</script>`, "JSON-LD");

  html = swap(html, /<!--seo-fallback:start-->[\s\S]*?<!--seo-fallback:end-->/,
    `<!--seo-fallback:start-->${r.fallback}<!--seo-fallback:end-->`, "seo-fallback markers");

  mkdirSync(join(DIST, r.dir), { recursive: true });
  writeFileSync(join(DIST, r.dir, "index.html"), html);
  console.log(`prerendered /${r.dir}/`);
}
