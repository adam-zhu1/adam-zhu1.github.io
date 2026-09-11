#!/usr/bin/env node
/**
 * Re-mirrors TrueLine's privacy and support pages into public/trueline/.
 *
 * Why they live in this repo at all: adamzhu.dev/trueline/ used to be served by the
 * adam-zhu1/trueline repo's own Pages site, which also hosted /trueline/privacy and
 * /trueline/support. Those two URLs are registered with Apple. When the portfolio took
 * over the /trueline/ path, that Pages site had to be switched off — so these pages moved
 * here, and this script keeps them in step with their source.
 *
 * The source of truth is still the app repo: docs/privacy.md and docs/support.md in
 * adam-zhu1/trueline. Those are Jekyll Markdown, and this repo has no Jekyll, so the
 * mirror has to be of RENDERED html.
 *
 *   node scripts/mirror-trueline-docs.mjs --from <dir>   # a `jekyll build` _site directory
 *   node scripts/mirror-trueline-docs.mjs --from <url>   # a live Pages origin
 *
 * Each page is written twice, as `privacy.html` and as `privacy/index.html`, so the
 * extensionless URL resolves whatever the host does about implicit .html.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const OUT = new URL("../public/trueline/", import.meta.url).pathname;
const PAGES = ["privacy", "support"];
const ASSETS = ["favicon.svg", "apple-touch-icon.png", "og-card.png"];

const i = process.argv.indexOf("--from");
const from = i > -1 ? process.argv[i + 1] : null;
if (!from) {
  console.error("usage: mirror-trueline-docs.mjs --from <jekyll _site dir | https://origin>");
  process.exit(1);
}
const isUrl = /^https?:\/\//.test(from);

const NOTE = `<!--
  Mirrored from the adam-zhu1/trueline repo (docs/${"{page}"}.md, built by Jekyll).
  Source of truth is that repo. Refresh with: npm run mirror:trueline
-->`;

async function read(rel) {
  if (isUrl) {
    const res = await fetch(`${from.replace(/\/$/, "")}/${rel}`);
    if (!res.ok) throw new Error(`${res.status} for ${rel}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return readFileSync(join(from, rel));
}

mkdirSync(join(OUT, "assets"), { recursive: true });
for (const a of ASSETS) {
  try { writeFileSync(join(OUT, "assets", a), await read(`assets/${a}`)); console.log(`asset  ${a}`); }
  catch (e) { console.warn(`skip   assets/${a} (${e.message})`); }
}
for (const p of PAGES) {
  // a Jekyll build writes privacy.html; a live origin serves it at /privacy too
  let html;
  for (const cand of [`${p}.html`, `${p}/index.html`, p]) {
    try { html = (await read(cand)).toString("utf8"); break; } catch { /* try the next shape */ }
  }
  if (!html) { console.error(`FAIL   ${p}: not found under ${from}`); process.exitCode = 1; continue; }
  // Jekyll renders og:url and og:image absolute against _config.yml's `url:`, which is
  // the github.io host. Canonical is the custom domain, so point them at it.
  html = html.replaceAll("https://adam-zhu1.github.io/trueline/", "https://adamzhu.dev/trueline/");
  const body = NOTE.replace("{page}", p) + "\n" + html;
  mkdirSync(join(OUT, p), { recursive: true });
  writeFileSync(join(OUT, `${p}.html`), body);
  writeFileSync(join(OUT, p, "index.html"), body);
  console.log(`page   ${p}.html + ${p}/index.html  (${body.length} bytes)`);
}
if (!existsSync(join(OUT, "privacy.html"))) process.exitCode = 1;
