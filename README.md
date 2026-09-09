# adam-zhu1.github.io

Personal site. Vite, React, TypeScript, Tailwind CSS v4, Three.js, GSAP.

## Layout

```
index.html        entry for the real site
src/              the real site (React). Being rebuilt from scratch on `redesign`.
public/           static files served as-is: favicon, resume PDF, robots, sitemap
prototypes/       throwaway vanilla Three.js + GSAP studies, not part of the build
  proto.html      direction A: boot line, framed object, progress index, dark-to-light
  archive/        rejected studies (look study, orbit hub), kept for reference
docs/             planning docs. DESIGN.md is tracked; the brief and research are not.
```

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
