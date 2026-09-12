# adam-zhu1.github.io

Personal site. Vite, React, TypeScript, Tailwind CSS v4, Three.js, GSAP.

## Layout

```
index.html            entry, plus the SEO head and the crawler fallback
src/
  App.tsx             the router: home, /trueline, /clarity
  pages/              Home, TrueLinePage, ClarityPage
  index.css           the whole design system
  components/         Frame, YearWheel, TrueLine(+Stage), Clarity(+Stage, Pipeline), WorkCard, Ambience
  lib/                reveal hooks, the router, the morph, and the two sequence engines
  data/               commits.json, TrueLine's track and lane geometry, Clarity's links and steps
public/media/         the TrueLine clip (mp4 + webm) and stills; Clarity's window captures and mark
scripts/
  fetch-commits.mjs   rewrites src/data/commits.json from the GitHub API
prototypes/           throwaway studies, dev-server only, not in the build
docs/                 planning docs; the brief, research and handoff are untracked
```

## How the moving parts work

- **The year wheel** on the home page is every commit across the public repos, plotted by
  day around a year with today at the top. It is built from `src/data/commits.json`, which
  `scripts/fetch-commits.mjs` rewrites on every deploy and once a day on a cron, so the
  wheel grows on its own without anyone editing the site.
- **The TrueLine sequence** is driven by the real analysis of one throw:
  `trueline-track.json` holds 70 tracked frames and `trueline-lane.json` holds the app's own
  lane geometry. The overlay on the video uses the app's video-surface model and the plan
  view uses its lane-view model, because TrueLine itself draws those two surfaces
  differently. Do not "unify" them.
- **The Clarity sequence** is not footage. `lib/clarity.ts` rebuilds the desktop, the editor,
  the spotlight box and the result box from the app's own window CSS at the app's own sizes
  and timings, and drives them on the same pausable clock as TrueLine's engine. The
  explanation and the array animation are illustrative; the caption says the clock is
  compressed. Lens teal (`#589da1`) is Clarity's accent on this site, chosen over its own
  mint so the two projects read apart.
- **Frames** draw their own four edges and watch themselves, so `.on` always lands on the
  element the CSS targets. Animations start when a thing is properly on screen, and the
  TrueLine sequence waits until its window is centred.
- **Storage access is always wrapped.** A sandboxed frame throws on `sessionStorage`, and an
  uncaught throw there stops every animation on the page.

## Branches

- `main` is what GitHub Pages deploys.
- `redesign` is the rebuild. Merge to `main` in small steps once screens are real.

## Development

```bash
npm install
npm run dev
```

The site runs at http://localhost:8080. Prototypes are served from the same dev
server, for example http://localhost:8080/prototypes/proto.html.

## Build and deploy

```bash
npm run build
```

Output goes to `dist/`. Only `index.html` is built; prototypes are dev-only.
GitHub Actions (`.github/workflows/deploy.yml`) deploys on pushes to `main`.
