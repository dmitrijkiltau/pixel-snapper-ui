# AGENTS.md

Guidance for AI agents working on this repo.

## Project overview
- Pixel Snapper is a Vite + React + Tailwind UI that posts images to a small Python HTTP server for pixel snapping.
- The Python server returns a PNG; the UI previews and stores recent results in localStorage.

## Key files
- `src/App.tsx`: main UI logic, form handling, progress states, history storage.
- `src/components/*`: split-out presentational UI components used by `App.tsx`.
- `src/main.tsx`: React entrypoint, mounts into `#app`.
- `src/main.css`: Tailwind v4 entry, design tokens, and custom utilities (e.g., `pixel-grid`, `glass-card`).
- `index.html`: app shell and root element.
- `app.py`: simple HTTP server with `POST /process`.
- `pixel_snapper.py`: image processing pipeline and CLI.

## Dev workflow
- Python backend:
  - `python -m venv .venv && source .venv/bin/activate`
  - `pip install -r requirements.txt`
  - `python app.py` (serves on `http://localhost:8000`)
- Frontend (in another terminal):
  - `npm install`
  - `npm run dev` (Vite on `http://localhost:5173`)
- Vite proxies `/process` to the Python server; override with `VITE_PROXY_TARGET`.

## Build & prod
- `npm run build` outputs `dist/`.
- `python app.py` serves `dist/` by default; override with `PIXEL_SNAPPER_WEB_ROOT`.

## API contract
- `POST /process` expects `multipart/form-data`:
  - `image` (file), `k_colors` (1–256 int), `k_seed` (>= 0 int).
- Response: `image/png` bytes, no caching.
- If you change validation or params, update both `src/App.tsx` and `app.py`.

## Data/storage
- Local history uses `localStorage` key `pixel-snapper-history`, capped at 12 items.
- Result URLs are blob URLs and are revoked on cleanup.

## UI/style notes
- Tailwind v4 is used via `@import "tailwindcss"` in `src/main.css`.
- Custom utilities/classes live in `src/main.css`; prefer reusing them before adding new ones.
- Fonts are loaded from Google Fonts in `src/main.css`.

## Expectations for changes
- Keep UI component changes in `src/components/` and app state/logic in `src/App.tsx` unless there is a clear reason otherwise.
- When touching the processing pipeline, prefer small, testable edits in `pixel_snapper.py`.
- Avoid introducing non-ASCII text unless the file already uses it.
