# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kayston's Forge is a privacy-first, browser-based developer utilities suite. All processing runs client-side. Built with Next.js 14 App Router, exported as a fully static site (`output: 'export'`). Deployed on Vercel.

## Commands

- `npm run dev` - Start Next.js dev server
- `npm run build` - Build static export (outputs to `out/`)
- `npm run test` - Run all tests with Vitest
- `npm run audit` - Run npm audit (fails on CRITICAL only — next@14 HIGH advisories don't apply to static export)
- `npx vitest run tests/unit/engine.test.ts` - Run a single test file
- `npx vitest -t "json format"` - Run tests matching a pattern
- `npm run lint` - Lint (ESLint)

## Architecture

### Routing & Layout
- `app/page.tsx` redirects to the default tool (`/tools/json-format-validate`)
- `app/tools/[toolId]/page.tsx` renders each tool via `generateStaticParams()` from the registry
- `components/layout/AppShell.tsx` is the top-level client component: sidebar + header + command palette + workbench
- All tool pages share a single layout; there are no per-tool page components

### Tool System (core pattern)
The entire tool system is driven by three files:
1. **`lib/tools/registry.ts`** — Defines all 47 tools with id, name, category, icon, keywords. Exports `tools` array, `toolMap`, `defaultToolId`, and `categoryLabels`.
2. **`lib/tools/engine.ts`** — `processTool(toolId, input, options)` is a synchronous function with a large switch statement routing to each tool's logic. Returns `{ output, previewHtml?, table?, meta? }`.
3. **`components/tools/ToolWorkbench.tsx`** — Unified workbench UI used by all tools. Contains `actionConfig` mapping tool IDs to available actions (e.g., Beautify/Minify). Handles input/output textareas, preview panes, QR encode/decode, history panel, and keyboard shortcuts.

To add a new tool: add entry to registry → add case to engine switch → optionally add action config in ToolWorkbench.

### Auxiliary tool modules (imported by engine.ts)
- `lib/tools/php-tools.ts` — PHP serialize/unserialize, PHP array syntax parser/formatter
- `lib/tools/curl-to-code.ts` — cURL command → JS/Python/PHP code generators
- `lib/tools/json-to-code.ts` — JSON → TypeScript/Python/Go/Rust type generators
- `lib/tools/cert-decoder.ts` — Pure-JS ASN.1 DER / X.509 PEM parser
- `lib/tools/list-compare.ts` — List intersection/union/diff with optional fuzzy matching
- `lib/tools/csv-to-sql.ts` — CSV → SQL INSERT statements with multiline field support

### State Management
- **Zustand** (`lib/store.ts`) — UI state: sidebar toggle, active tool, command palette, settings. Persisted to localStorage as `kaystons-forge-ui`.
- **Dexie/IndexedDB** (`lib/db.ts`) — `KaystonsForgeDB` with tables: `history` (per-tool input/output), `favorites`, `settings`.
- **`hooks/useHistory.ts`** — Save/restore/clear history per tool (max 50 entries per tool).

### Styling
- Tailwind CSS with CSS custom properties defined in `app/globals.css`
- Default theme: **Solarized Light** (`data-theme="light"` on `<html>`) — warm cream background, gold accent `#b58900`
- Dark theme available (`:root` variables) — warm dark background, orange accent `#d4915e`
- Font families: DM Sans (body), Playfair Display (display/headings), Fira Code (mono)
- Custom color tokens: `--bg-primary/secondary/tertiary`, `--border`, `--border-subtle`, `--text-primary/secondary/muted`, `--accent`, `--accent-subtle`

### Key Dependencies
- `crypto-js` — Hash generation (MD5, SHA-1, SHA-256, SHA-512)
- `terser` — JS minification (use `minify_sync` — engine is synchronous)
- `diff@^8.0.3` — Text diffing (`createPatch`, `diffLines`)
- `sql-formatter` — SQL formatting with dialect support
- `papaparse` — CSV parsing/generation
- `js-yaml` — YAML ↔ JSON conversion
- `cronstrue` — Cron expression → human-readable English
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
- Tests live in `tests/unit/`:
  - `engine.test.ts` — 57 tests covering all tool IDs
  - `bugfixes.test.ts` — 28 regression tests (Gemini + Codex bug fixes)
  - `fuzz.test.ts` — 72 parser robustness/adversarial tests
- **Total: 157 tests**

### Security
- `vercel.json` — HTTP security headers (CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy)
- `.github/workflows/security.yml` — CodeQL SAST + npm audit (critical-only) + TruffleHog secret scanning on every push/PR
- `.github/workflows/sbom.yml` — CycloneDX SBOM generated on push to main and releases
- `.github/dependabot.yml` — Weekly dependency and Actions updates
- `public/.well-known/security.txt` + `public/security-policy.html` — VDP (RFC 9116)
- `docs/INCIDENT_RESPONSE.md` — Severity matrix, hotfix checklist, disclosure templates
- **Note:** `next@14` HIGH advisories (GHSA-9g9p, GHSA-h25m) do not apply — both require server-side features absent in static export

### PWA
- `public/manifest.json` and `public/sw.js` for installable/offline support
- Service worker registered in `AppShell.tsx`
- Favicon: `public/favicon.svg` — forge mark (// slash bars) in brand gold

## Keyboard Shortcuts (in-app)
- `Cmd/Ctrl + K` — Command palette
- `Cmd/Ctrl + 1` — Toggle sidebar
- `Cmd/Ctrl + Enter` — Execute tool action
- `Cmd/Ctrl + Shift + C` — Copy output
- `Cmd/Ctrl + Shift + S` — Download output
- `Cmd/Ctrl + [` / `]` — Previous/next tool

## Known Issues
- Bundle is large (~513 kB first load) because all tool dependencies load on every page — needs dynamic imports
- Theme switcher UI not implemented (Solarized Light is default, dark theme CSS exists but no toggle in UI)
