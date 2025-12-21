# AGENTS.md

Guidance for AI agents working on this repo.

## Project overview
- Pixel Snapper is a Vite + React + Tailwind UI that snaps pixels entirely in the browser.
- The UI previews and stores recent results in localStorage.

## Key files
- `src/App.tsx`: main UI logic, form handling, progress states, history storage.
- `src/components/*`: split-out presentational UI components used by `App.tsx`.
- `src/pixelSnapper.tsx`: in-browser pixel snapping pipeline.
- `src/main.tsx`: React entrypoint, mounts into `#app`.
- `src/main.css`: Tailwind v4 entry, design tokens, and custom utilities (e.g., `pixel-grid`, `glass-card`).
- `index.html`: app shell and root element.

## Dev workflow
- `npm install`
- `npm run dev` (Vite on `http://localhost:5173`)

## Build & prod
- `npm run build` outputs `dist/`.
- `npm run preview` serves the build locally.

## Data/storage
- Local history uses `localStorage` key `pixel-snapper-history`, capped at 12 items.
- Result URLs are blob URLs and are revoked on cleanup.

## UI/style notes
- Tailwind v4 is used via `@import "tailwindcss"` in `src/main.css`.
- Custom utilities/classes live in `src/main.css`; prefer reusing them before adding new ones.
- Fonts are loaded from Google Fonts in `src/main.css`.

## Expectations for changes
- Keep UI component changes in `src/components/` and app state/logic in `src/App.tsx` unless there is a clear reason otherwise.
- When touching the processing pipeline, prefer small, testable edits in `src/pixelSnapper.tsx`.
- Avoid introducing non-ASCII text unless the file already uses it.
