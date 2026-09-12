#!/usr/bin/env node
/**
 * Rewrites src/data/commits.json from the GitHub API.
 * Run by .github/workflows/deploy.yml before every build, so the year wheel on the
 * site is never more than a day out of date. Needs no token for public repos, but
 * uses GITHUB_TOKEN when present to avoid the 60/hour anonymous rate limit.
 */
import { writeFileSync } from "node:fs";

const USER = "adam-zhu1";
/* Repos Adam committed to but does not own. The wheel is about his commits, not his
   repositories, so work done inside somebody else's repo still belongs on it. Kept
   tolerant on purpose: if one of these goes private or is renamed, the fetch warns and
   carries on rather than failing the deploy. */
const GUEST = ["s0hamjain/Clarity"];
const OUT = new URL("../src/data/commits.json", import.meta.url);
const token = process.env.GITHUB_TOKEN;
const headers = { Accept: "application/vnd.github+json", "User-Agent": USER, ...(token ? { Authorization: `Bearer ${token}` } : {}) };

async function api(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return res.json();
}

const owned = (await api(`/users/${USER}/repos?per_page=100&type=owner&sort=pushed`))
  .filter(r => !r.fork && !r.private)
  .map(r => `${USER}/${r.name}`);

const out = [];
for (const full of [...owned, ...GUEST]) {
  const name = full.split("/")[1];
  try {
    for (let page = 1; page <= 10; page++) {
      const commits = await api(`/repos/${full}/commits?per_page=100&author=${USER}&page=${page}`);
      for (const c of commits) out.push({ r: name, t: c.commit.author.date.slice(0, 16), m: c.commit.message.split("\n")[0].slice(0, 60) });
      if (commits.length < 100) break;
    }
  } catch (err) {
    if (owned.includes(full)) throw err;
    console.warn(`skipping ${full}: ${err.message}`);
  }
}
out.sort((a, b) => a.t.localeCompare(b.t));

if (out.length < 50) throw new Error(`Only ${out.length} commits found; refusing to overwrite with a bad fetch.`);
writeFileSync(OUT, JSON.stringify(out));
console.log(`commits.json: ${out.length} commits across ${owned.length + GUEST.length} repos, ${out[0].t} to ${out.at(-1).t}`);
