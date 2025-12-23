# Pixel Snapper 🎯

A tiny Vite + React + Tailwind app that performs **image pixel snapping entirely in the browser** and stores recent results locally.

## Quickstart ⚡

Install dependencies and start the dev server:

```bash
npm install
npm run dev
# open http://localhost:5173
```

Build and preview the production bundle:

```bash
npm run build
npm run preview
# preview served locally (default: http://localhost:4173)
```

## What it does 💡

- Snaps/aligns image pixels client-side using a browser pipeline (no server needed).
- Stores a short recent history in `localStorage` so you can revisit previous results.
- Exports results as blob URLs which are revoked when cleaned up.

## Key files and structure 🔧

- `src/App.tsx` — main application and state management
- `src/pixelSnapper.tsx` — in-browser image processing pipeline
- `src/components/` — UI components (see `UploadForm.tsx`, `ResultPanel.tsx`, `HistorySection.tsx`)
- `src/main.css` and `src/_theme.css` — Tailwind entry & design tokens
- `AGENTS.md` — contributor notes and dev conventions

## Notes for contributors 🛠️

- Follow modern TypeScript/React patterns and prefer `for` loops where appropriate.
- CSS should use nesting and variables (Tailwind + custom utilities live in `src/main.css`).
- The app uses a local history key: `pixel-snapper-history` (kept to a max of 12 items).

## Development tips ✅

- Use `npm run dev` for fast feedback and HMR.
- Keep changes small and focused; add tests or playground examples for complex processing changes in `src/pixelSnapper.tsx` when possible.

## License & contact

MIT © dmitrijkiltau
