#!/usr/bin/env node
/**
 * Rewrites src/data/commits.json from the GitHub API.
 * Run by .github/workflows/deploy.yml before every build, so the year wheel on the
 * site is never more than a day out of date. Needs no token for public repos, but
 * uses GITHUB_TOKEN when present to avoid the 60/hour anonymous rate limit.
 */
import { writeFileSync } from "node:fs";

const USER = "adam-zhu1";
const OUT = new URL("../src/data/commits.json", import.meta.url);
const token = process.env.GITHUB_TOKEN;
const headers = { Accept: "application/vnd.github+json", "User-Agent": USER, ...(token ? { Authorization: `Bearer ${token}` } : {}) };

async function api(path) {
  const res = await fetch(`https://api.github.com${path}`, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return res.json();
}

const repos = (await api(`/users/${USER}/repos?per_page=100&type=owner&sort=pushed`))
  .filter(r => !r.fork && !r.private)
  .map(r => r.name);

const out = [];
for (const repo of repos) {
  for (let page = 1; page <= 10; page++) {
    const commits = await api(`/repos/${USER}/${repo}/commits?per_page=100&author=${USER}&page=${page}`);
    for (const c of commits) out.push({ r: repo, t: c.commit.author.date.slice(0, 16), m: c.commit.message.split("\n")[0].slice(0, 60) });
    if (commits.length < 100) break;
  }
}
out.sort((a, b) => a.t.localeCompare(b.t));

if (out.length < 50) throw new Error(`Only ${out.length} commits found; refusing to overwrite with a bad fetch.`);
writeFileSync(OUT, JSON.stringify(out));
console.log(`commits.json: ${out.length} commits across ${repos.length} repos, ${out[0].t} to ${out.at(-1).t}`);
