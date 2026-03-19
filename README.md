# Adam Zhu Portfolio

Personal portfolio site built with React + Vite, styled with Tailwind CSS and shadcn-ui components. Routes are handled client-side using `HashRouter` so the site works well when hosted on GitHub Pages.

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn-ui components
- `react-router-dom` (`HashRouter`)
- CSS-based animations (see `src/index.css`)

## Local Development

Requirements: Node.js + npm

```sh
npm i
npm run dev
```

By default the dev server runs on `http://localhost:8080` (see `vite.config.ts`).

## Build & Preview

```sh
npm run build
npm run preview
```

## Deployment (GitHub Pages / static hosting)

1. Run `npm run build`
2. Deploy the contents of `dist/` to your static hosting provider (for example, GitHub Pages).

Note: `vite.config.ts` uses `base: "./"` in production to reduce issues when the site is served from a subpath/static host.

## Useful Files

- `src/App.tsx`: router + route wiring
- `src/pages/*`: page entry components (About, Projects, etc.)
- `src/components/PageShell.tsx`: shared page layout (title/subtitle + back button)
- `src/index.css`: global styles + animation keyframes

