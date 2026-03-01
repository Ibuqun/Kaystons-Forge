# Kayston's Forge

Kayston's Forge is a browser-based, privacy-first developer utilities suite built with Next.js App Router. All processing runs client-side.

## Features

- 30 tools across encoding, conversion, beautification, generators, and data transformation.
- Command palette (`Cmd/Ctrl+K`), sidebar navigation (`Cmd/Ctrl+1`), and keyboard execution (`Cmd/Ctrl+Enter`).
- Tool history stored in IndexedDB (Dexie), with restore and clear actions.
- PWA manifest and service worker for offline-first static hosting.
- Static-export compatible (`next build` with `output: 'export'`).

## Tech Stack

- Next.js 14 + React 18 + TypeScript strict mode
- Tailwind CSS
- Zustand for UI state
- Dexie for IndexedDB storage
- Heroicons for iconography

## Run Locally

```bash
npm install
npm run dev
```

## Build Static Export

```bash
npm run build
```

Output is emitted for static hosting compatibility.

## Tests

```bash
npm run test
```

## Shortcuts

- `Cmd/Ctrl + K`: Open command palette
- `Cmd/Ctrl + 1`: Toggle sidebar
- `Cmd/Ctrl + Enter`: Execute active tool action
- `Cmd/Ctrl + Shift + C`: Copy output
- `Cmd/Ctrl + Shift + S`: Download output
- `Cmd/Ctrl + [`: Previous tool
- `Cmd/Ctrl + ]`: Next tool
- `Esc`: Clear input
