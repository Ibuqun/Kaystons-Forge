# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Adler's Forge is a privacy-first, browser-based developer utilities suite. All processing runs client-side. Built with Next.js 14 App Router, exported as a fully static site (`output: 'export'`).

## Commands

- `npm run dev` - Start Next.js dev server
- `npm run build` - Build static export (outputs to `out/`)
- `npm run test` - Run all tests with Vitest
- `npx vitest run tests/unit/engine.test.ts` - Run a single test file
- `npx vitest -t "json format"` - Run tests matching a pattern
- `npm run lint` - Lint (ESLint — config may need setup)

## Architecture

### Routing & Layout
- `app/page.tsx` redirects to the default tool (`/tools/json-format-validate`)
- `app/tools/[toolId]/page.tsx` renders each tool via `generateStaticParams()` from the registry
- `components/layout/AppShell.tsx` is the top-level client component: sidebar + header + command palette + workbench
- All tool pages share a single layout; there are no per-tool page components

### Tool System (core pattern)
The entire tool system is driven by three files:
1. **`lib/tools/registry.ts`** — Defines all 32 tools with id, name, category, icon, keywords. Exports `tools` array, `toolMap`, `defaultToolId`, and `categoryLabels`.
2. **`lib/tools/engine.ts`** — `processTool(toolId, input, options)` is a single function with a large switch statement routing to each tool's logic. Returns `{ output, previewHtml?, table?, meta? }`.
3. **`components/tools/ToolWorkbench.tsx`** — Unified workbench UI used by all tools. Contains `actionConfig` mapping tool IDs to available actions (e.g., Beautify/Minify). Handles input/output textareas, preview panes, QR encode/decode, history panel, and keyboard shortcuts.

To add a new tool: add entry to registry → add case to engine switch → optionally add action config in ToolWorkbench.

### State Management
- **Zustand** (`lib/store.ts`) — UI state: sidebar toggle, active tool, command palette, settings. Persisted to localStorage as `adlers-forge-ui`.
- **Dexie/IndexedDB** (`lib/db.ts`) — `AdlersForgeDB` with tables: `history` (per-tool input/output), `favorites`, `settings`.
- **`hooks/useHistory.ts`** — Save/restore/clear history per tool (max 50 entries per tool).

### Styling
- Tailwind CSS with CSS custom properties defined in `app/globals.css` (dark theme hardcoded)
- Custom color tokens: `bgPrimary`, `bgSecondary`, `bgTertiary`, `borderColor`, `textPrimary`, `textSecondary`, `accent`
- Font families: Inter (sans), JetBrains Mono (mono)

### Key Dependencies
- `crypto-js` — Hash generation (MD5, SHA-1, SHA-256, SHA-512)
- `terser` — JS minification
- `sql-formatter` — SQL formatting with dialect support
- `papaparse` — CSV parsing/generation
- `js-yaml` — YAML ↔ JSON conversion
- `dexie` — IndexedDB wrapper
- `marked` / `dompurify` — Markdown preview with sanitization
- `qrcode` / `jsqr` — QR generation and decoding
- `jwt-decode`, `ulidx`, `uuid` — Token/ID utilities

### Types
- `types/index.ts` — Core interfaces: `ToolDefinition`, `HistoryEntry`, `AppSettings`, `ToolCategory`
- `types/vendor.d.ts` — Module declaration for `html-to-jsx` (no bundled types)

### Testing
- Vitest with jsdom environment, globals enabled
- Path alias `@/` mapped in `vitest.config.ts`
- Tests live in `tests/unit/` — currently only `engine.test.ts` (32 tests covering all tool IDs)

### PWA
- `public/manifest.json` and `public/sw.js` for installable/offline support
- Service worker registered in `AppShell.tsx`

## Keyboard Shortcuts (in-app)
- `Cmd/Ctrl + K` — Command palette
- `Cmd/Ctrl + 1` — Toggle sidebar
- `Cmd/Ctrl + Enter` — Execute tool action
- `Cmd/Ctrl + Shift + C` — Copy output
- `Cmd/Ctrl + Shift + S` — Download output
- `Cmd/Ctrl + [` / `]` — Previous/next tool

## Known Issues
- Bundle is large (~460 kB first load) because all tool dependencies load on every page — needs dynamic imports
- Theme setting exists in store but dark mode is hardcoded in CSS; no theme switcher UI
- No `.gitignore` — `node_modules/`, `.next/`, `out/` should be excluded
