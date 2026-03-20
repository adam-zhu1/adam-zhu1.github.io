# adam-zhu1.github.io

Personal site built with **Vite**, **React**, **TypeScript**, and **Tailwind CSS**.

## Branches

- **`main`** — what GitHub Pages deploys today.
- **`restart`** — clean rebuild: minimal dependencies, custom typography, no UI kit. Merge to `main` when you’re ready to go live.

## Development

```bash
npm install
npm run dev
```

App runs at [http://localhost:8080](http://localhost:8080) (see `vite.config.ts`).

## Build

```bash
npm run build
```

Output: `dist/`. CI copies `index.html` to `404.html` for client-side routing on GitHub Pages.

## Deploy

GitHub Actions (`.github/workflows/deploy.yml`) deploys on pushes to **`main`** only.

To preview the restart work **without** switching production: push the `restart` branch and use GitHub’s branch preview / open locally. When satisfied, merge `restart` → `main`.
