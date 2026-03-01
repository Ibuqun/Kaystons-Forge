# Kayston's Forge — Implementation Log

This document records all significant work completed in this codebase.

---

## 1. Project Initialization (Adler's Forge → Kayston's Forge)

Built a full Next.js 14 App Router TypeScript project from scratch. Originally named "Adler's Forge", later renamed to **Kayston's Forge**.

### Core files created
- `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.js`, `vitest.config.ts`
- `app/layout.tsx`, `app/page.tsx`, `app/tools/[toolId]/page.tsx`, `app/globals.css`
- `lib/store.ts`, `lib/db.ts`, `lib/tools/registry.ts`, `lib/tools/engine.ts`
- `components/layout/AppShell.tsx`, `Sidebar.tsx`, `Header.tsx`, `CommandPalette.tsx`
- `components/tools/ToolWorkbench.tsx`
- `hooks/useHistory.ts`, `useClipboard.ts`, `useTool.ts`
- `types/index.ts`, `types/vendor.d.ts`
- `public/manifest.json`, `public/sw.js`, `public/icons/icon-192.svg`, `public/icons/icon-512.svg`
- `tests/unit/engine.test.ts`

### Initial tool coverage (32 tools)
Unix Time Converter, JSON Format/Validate, Base64 String/Image, JWT Debugger, RegExp Tester, URL Encode/Decode, URL Parser, HTML Entity Encode/Decode, Backslash Escape/Unescape, UUID/ULID Generate, HTML Preview, Text Diff Checker, YAML↔JSON, Number Base Converter, HTML/CSS/JS/ERB/LESS/SCSS/XML Beautify/Minify, Lorem Ipsum Generator, QR Code Reader/Generator, String Inspector, JSON↔CSV, Hash Generator, HTML to JSX, Markdown Preview, SQL Formatter.

---

## 2. UI Improvements

- Added Solarized Light theme (default) alongside the original dark theme
- Added copy buttons on input/output panels
- Added syntax highlighting (PrismJS) to formatted code outputs
- Default theme set to light via `data-theme="light"` on `<html>`

---

## 3. 15 New Tools Added

Added 15 tools, bringing total to **47 tools** in the registry.

### New tools
- `string-case` — String Case Converter (camelCase, PascalCase, snake_case, kebab-case, SCREAMING_SNAKE, Title Case, lowercase, UPPERCASE)
- `cron-parser` — Cron Job Parser (cronstrue → human-readable, next 5 run times)
- `color-converter` — Color Converter (hex, RGB, RGBA, HSL, HSLA, named colors, alpha channel support)
- `php-to-json` — PHP to JSON (unserialize PHP → JSON)
- `json-to-php` — JSON to PHP (serialize JSON → PHP)
- `php-serializer` — PHP Serializer (PHP array syntax → serialize wire format)
- `php-unserializer` — PHP Unserializer (serialize wire format → PHP array syntax)
- `random-string` — Random String Generator (CSPRNG via `crypto.getRandomValues`, configurable charset/length)
- `svg-to-css` — SVG to CSS (inline SVG → data URI background-image)
- `curl-to-code` — cURL to Code (cURL command → JS fetch / Python requests / PHP cURL)
- `json-to-code` — JSON to Code (JSON → TypeScript interface / Python dataclass / Go struct / Rust struct)
- `cert-decoder` — Certificate Decoder (X.509 PEM → human-readable, pure-JS ASN.1 DER parser)
- `hex-to-ascii` — Hex to ASCII (UTF-8 TextDecoder, strict 2-char token validation)
- `ascii-to-hex` — ASCII to Hex (UTF-8 TextEncoder for correct byte encoding)
- `line-sort` — Line Sort/Dedupe (sort ascending/descending/reverse/shuffle, optional dedupe)

### New auxiliary modules
- `lib/tools/php-tools.ts` — phpSerialize, phpUnserialize, phpArraySyntax, parsePhpArraySyntax
- `lib/tools/curl-to-code.ts` — curlToJs, curlToPython, curlToPhp
- `lib/tools/json-to-code.ts` — jsonToTypeScript, jsonToPython, jsonToGo, jsonToRust
- `lib/tools/cert-decoder.ts` — decodeCertificate (pure-JS ASN.1 DER + X.509 PEM)
- `lib/tools/list-compare.ts` — compareLists, splitItems (fuzzy matching with Levenshtein)
- `lib/tools/csv-to-sql.ts` — csvToSql (char-by-char CSV parser handles multiline quoted fields)

---

## 4. Bug Fixes (Gemini Section 1 — 6 edge cases)

All 6 Gemini-reported edge cases confirmed fixed:
1. `parseJsonLoose` — replaced unsafe `new Function()` with safe 3-step regex pipeline
2. `detectTimestamp` — uses `Math.abs(n).toString().length` to fix negative timestamp detection
3. `yaml-to-json` — uses `yamlLoadAll` for multi-document YAML support
4. `color-converter` — alpha channel support (rgba, hsla, 4/8-digit hex), added `to-hex` action
5. `url-encode-decode` — `decode` is pure `decodeURIComponent`; new `form-decode` action for `+` → space
6. `json-to-csv` — rejects arrays of primitives/nested arrays

---

## 5. Bug Fixes (Codex Section 2 — 11 edge cases)

All 11 Codex-reported edge cases fixed:
1. **list-compare DoS** — threshold reduced 2.5M→25K pairs, string cap at 500 chars
2. **list-compare case preservation** — original casing preserved via `origA`/`origB` maps
3. **negative timestamps** — `Math.abs(n).toString().length` for abs-value digit counting
4. **YAML multi-doc** — `yamlLoadAll` properly flattens multiple documents
5. **color-converter alpha** — 8-digit hex and rgba/hsla alpha preserved in all conversions
6. **url-encode-decode** — form decoding action added for `+`→space support
7. **json-to-csv primitive arrays** — validates input is array of objects before processing
8. **hex-to-ascii UTF-8** — replaced `charCodeAt` with `TextDecoder` for correct UTF-8 decoding
9. **ascii-to-hex UTF-8** — replaced `charCodeAt` with `TextEncoder` for correct byte output
10. **svg-to-css validation** — requires `<svg` tag even for `<?xml` preamble inputs
11. **line-sort dedupe (first-seen)** — iterative Map build with `!seen.has(key)` guard; stats use same trim+lowercase normalization

---

## 6. Test Suite

Three test files, **157 tests total**, all passing:
- `tests/unit/engine.test.ts` — 57 tests (all 47 tool IDs + actions)
- `tests/unit/bugfixes.test.ts` — 28 regression tests (Gemini + Codex confirmed fixes)
- `tests/unit/fuzz.test.ts` — 72 parser robustness tests (adversarial inputs for PHP, cURL, cert-decoder, regex, line-sort)

### Fuzz tests found and fixed 3 additional bugs:
1. `parsePhpArraySyntax` — silently returned partial results on unclosed brackets/strings; added EOF validation
2. `processTool` — was `async` (returned Promise); converted to synchronous using `terser.minify_sync`
3. `line-sort` — `dedupe: true` option was ignored (only `action: 'dedupe'` worked); fixed via `options.dedupe` check

---

## 7. Cybersecurity Hardening (Phase 1 + Phase 2)

### Security headers
- `vercel.json` — CSP, HSTS (`max-age=31536000; includeSubDomains; preload`), X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options

### CI / Supply chain
- `.github/workflows/security.yml` — CodeQL SAST (security-extended queries), npm audit (critical-only), TruffleHog secret scanning
- `.github/workflows/sbom.yml` — CycloneDX SBOM on push to main + releases (attached to GitHub Releases)
- `.github/dependabot.yml` — Weekly npm + GitHub Actions dependency updates

### VDP / Disclosure
- `public/.well-known/security.txt` + `public/security.txt` — RFC 9116 security.txt
- `public/security-policy.html` — Full VDP with scope, SLA table, safe harbor, acknowledgments

### Process
- `docs/INCIDENT_RESPONSE.md` — P0–P3 severity matrix, 7-step incident process, hotfix checklist, communication templates

### Dependency fix
- `diff` upgraded `7.0.0 → ^8.0.3` to resolve DoS advisory GHSA-73rr

---

## 8. UI Enhancements (frontend-design)

### Favicon
- `public/favicon.svg` — Forge mark (// slash bars in brand gold `#b58900` on warm dark background)
- Wired via `metadata.icons` in `app/layout.tsx` and explicit `<link rel="icon">` in `<head>`

### Collapsible sidebar sections
- `components/layout/Sidebar.tsx` — Category headers are now click-to-toggle buttons
- Smooth animation via CSS `grid-template-rows: 0fr → 1fr` (no JS height calculation)
- `ChevronRightIcon` rotates 90° to indicate expanded/collapsed state
- Auto-expands all sections when a search query is active
- Collapsed sidebar (icon-only mode) bypasses the toggle UI entirely

---

## 9. Current State

- **47 tools** in registry
- **157 tests** passing (57 engine + 28 bugfixes + 72 fuzz)
- **Deployed**: Vercel (static export)
- **GitHub**: https://github.com/Ibuqun/Kaystons-Forge
- **Security hardening**: Phase 1 + Phase 2 complete; Phase 3 (external pentest, ISO 27001) deferred

### Known issues / future work
- Bundle is large (~513 kB first load) — needs dynamic imports per tool
- Theme switcher UI not implemented (light/dark CSS exists, no toggle button)
