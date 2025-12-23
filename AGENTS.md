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
- Design tokens are defined in `src/_theme.css` using `@theme` with `light-dark()` color values.
- Custom utilities/classes live in `src/main.css` using `@apply` directives; prefer reusing them before adding new ones.
- Fonts are loaded from Google Fonts in `src/main.css`.

### Color tokens
The app uses a set of design tokens with automatic light/dark mode support via `light-dark()`:
- **`--color-ink`**: Text and dark backgrounds (light: slate-900, dark: slate-50)
- **`--color-paper`**: Page background (light: #f5f0e6, dark: #0b1120)
- **`--color-muted`**: Secondary text (light: slate-500, dark: slate-300)
- **`--color-subtle`**: Tertiary text (light: slate-600, dark: slate-400)
- **`--color-border`**: Border colors (light: slate-200, dark: slate-700)
- **`--color-border-muted`**: Subtle borders (light: slate-300, dark: slate-600)
- **`--color-surface`**: Card/panel surfaces (light: white, dark: slate-900)
- **`--color-shadow`**: Shadow colors (light: #0f172a, dark: #020617)
- **`--color-grid`**: Grid background (light: slate-900, dark: slate-400)
- **`--color-success`**: Success/positive states (light: emerald-500, dark: emerald-400)
- **`--color-error`**: Error/negative states (light: rose-500, dark: rose-400)
- **`--color-accent`**: Interactive elements (light: indigo-500, dark: indigo-400)

Use token classes (e.g., `bg-ink`, `text-muted`, `border-border`) instead of hardcoded color utilities to leverage automatic mode switching.

## Expectations for changes
- Keep UI component changes in `src/components/` and app state/logic in `src/App.tsx` unless there is a clear reason otherwise.
- When touching the processing pipeline, prefer small, testable edits in `src/pixelSnapper.tsx`.
- Avoid introducing non-ASCII text unless the file already uses it.
