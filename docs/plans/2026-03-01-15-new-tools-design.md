# Design: 15 New Tools for Kayston's Forge

**Date:** 2026-03-01
**Status:** Approved
**Approach:** Modular files + cronstrue + pure-JS cert parser (Approach B)

---

## Overview

Add 15 new developer utility tools to Kayston's Forge. All tools are client-side, privacy-first, and follow the existing three-file pattern: `registry.ts` → `engine.ts` → `ToolWorkbench.tsx`.

**New dependency:** `cronstrue` (~30 KB) for cron expression → English translation. All other logic is pure JavaScript.

---

## Tool Registry

| # | Name | Tool ID | Category | Icon |
|---|------|---------|----------|------|
| 1 | String Case Converter | `string-case` | data | `VariableIcon` |
| 2 | Cron Job Parser | `cron-parser` | encoding | `ClockIcon` |
| 3 | Color Converter | `color-converter` | format | `PaintBrushIcon` |
| 4 | PHP to JSON | `php-to-json` | data | `CodeBracketIcon` |
| 5 | JSON to PHP | `json-to-php` | data | `CodeBracketIcon` |
| 6 | PHP Serializer | `php-serializer` | data | `CodeBracketIcon` |
| 7 | PHP Unserializer | `php-unserializer` | data | `CodeBracketIcon` |
| 8 | Random String Generator | `random-string` | generator | `SparklesIcon` |
| 9 | SVG to CSS | `svg-to-css` | format | `PaintBrushIcon` |
| 10 | cURL to Code | `curl-to-code` | format | `CodeBracketSquareIcon` |
| 11 | JSON to Code | `json-to-code` | format | `CodeBracketSquareIcon` |
| 12 | Certificate Decoder | `cert-decoder` | encoding | `LockClosedIcon` |
| 13 | Hex to ASCII | `hex-to-ascii` | format | `HashtagIcon` |
| 14 | ASCII to Hex | `ascii-to-hex` | format | `HashtagIcon` |
| 15 | Line Sort/Dedupe | `line-sort` | data | `Bars3BottomLeftIcon` |

---

## Engine Logic

### Inline in `engine.ts`

- **`string-case`**: Split input on word boundaries (spaces, hyphens, underscores, camelCase transitions) → rejoin as camelCase / PascalCase / snake_case / kebab-case / SCREAMING_SNAKE / Title Case.
- **`color-converter`**: Parse input as hex (`#rrggbb`), `rgb(r,g,b)`, or `hsl(h,s%,l%)` → output all 4 formats (HEX, RGB, HSL, HSV) plus a CSS custom property block.
- **`random-string`**: Use `crypto.getRandomValues()` for CSPRNG. Charset-based sampling for alphanumeric/hex/base64/symbols. Passphrase mode selects from a built-in 256-word list. Options: length (default 32), count (default 1).
- **`svg-to-css`**: `btoa()` or `encodeURIComponent()` encode SVG → wrap as `background-image: url("data:image/svg+xml;base64,...")` or `url("data:image/svg+xml,<encoded>")`.
- **`hex-to-ascii`**: Split hex string (space-separated or pairs) → `String.fromCharCode(parseInt(byte, 16))`.
- **`ascii-to-hex`**: `[...str].map(c => c.charCodeAt(0).toString(16).padStart(2,'0')).join(' ')`.
- **`line-sort`**: Split on `\n` → sort ascending/descending, dedupe (preserve order), or dedupe + sort. Return line count in `meta`.

### New Modules

**`lib/tools/php-tools.ts`** — shared by all 4 PHP tools:
- `phpUnserialize(str)`: Parses PHP `serialize()` wire format (`a:2:{s:3:"key";s:5:"val";}`) → JS value.
- `phpSerialize(val)`: JS value → PHP wire format.
- `phpArraySyntax(val)`: JS value → PHP array literal (`['key' => 'val']`).
- `parsePhpArraySyntax(str)`: PHP array literal → JS value.
- Tool routing: `php-to-json` (unserialize → JSON), `json-to-php` (JSON → serialize or array syntax), `php-serializer` (input → serialize), `php-unserializer` (wire format → readable).

**`lib/tools/curl-to-code.ts`**:
- Tokenize cURL command: extract `-X` method, URL, `-H` headers, `-d`/`--data` body, `--user`, `--compressed`.
- Emit: JavaScript (`fetch`), Python (`requests`), PHP (`curl_exec`).

**`lib/tools/json-to-code.ts`**:
- Walk JSON value tree → infer types (string, number, boolean, null, array, object, nested).
- Emit: TypeScript interfaces, Python dataclass, Go struct, Rust struct.

**`lib/tools/cert-decoder.ts`**:
- Accept PEM (`-----BEGIN CERTIFICATE-----`) or raw base64 DER.
- Base64-decode → walk ASN.1 DER byte array with a minimal tag-length-value reader.
- Extract: version, serial number, signature algorithm, issuer DN, validity (notBefore/notAfter), subject DN, public key algorithm + key size, Subject Alternative Names (SAN extension).
- No external library — ~150 lines of pure JS.

**`cronstrue` (npm)**:
- `cron-parser` tool: `cronstrue.toString(expr)` → English description.
- Next 5 runs: implement a simple cron tick iterator using `Date` arithmetic.

---

## ToolWorkbench Additions

### `actionConfig`

| Tool ID | Actions |
|---------|---------|
| `string-case` | camelCase, PascalCase, snake_case, kebab-case, SCREAMING_SNAKE, Title Case |
| `cron-parser` | Human Readable, Next 5 Runs |
| `color-converter` | To HEX, To RGB, To HSL, To HSV |
| `php-to-json` | From Serialized, From Array Syntax |
| `json-to-php` | To Serialized, To Array Syntax |
| `php-serializer` | Serialize |
| `php-unserializer` | Unserialize, To Array Syntax |
| `random-string` | Alphanumeric, Hex, Base64, Symbols, Passphrase |
| `svg-to-css` | Base64, URL-encoded |
| `curl-to-code` | JavaScript, Python, PHP |
| `json-to-code` | TypeScript, Python, Go, Rust |
| `cert-decoder` | (single Parse — no action buttons) |
| `hex-to-ascii` | (single direction — no action buttons) |
| `ascii-to-hex` | (single direction — no action buttons) |
| `line-sort` | Sort A→Z, Sort Z→A, Dedupe, Dedupe + Sort |

### `sampleInput`

| Tool ID | Sample |
|---------|--------|
| `string-case` | `hello world from kaystons forge` |
| `cron-parser` | `0 9 * * 1-5` |
| `color-converter` | `#3b82f6` |
| `php-to-json` | `a:2:{s:4:"name";s:5:"Alice";s:3:"age";i:30;}` |
| `json-to-php` | `{"name":"Alice","age":30}` |
| `php-serializer` | `{"name":"Alice","age":30}` |
| `php-unserializer` | `a:2:{s:4:"name";s:5:"Alice";s:3:"age";i:30;}` |
| `random-string` | `32` |
| `svg-to-css` | `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>` |
| `curl-to-code` | `curl -X POST https://api.example.com/users -H "Authorization: Bearer token123" -H "Content-Type: application/json" -d '{"name":"Alice"}'` |
| `json-to-code` | `{"id":1,"name":"Alice","email":"alice@example.com","active":true,"score":9.5}` |
| `cert-decoder` | (short self-signed PEM stub) |
| `hex-to-ascii` | `48 65 6c 6c 6f 20 57 6f 72 6c 64` |
| `ascii-to-hex` | `Hello World` |
| `line-sort` | `banana\napple\ncherry\napple\ndate\nbanana` |

### `toolControls`

`random-string` gets two controls:
- `length`: number input, label "Length", default `32`
- `count`: number input, label "Count", default `1`, max `100`

---

## File Changes

### New files
```
lib/tools/php-tools.ts
lib/tools/curl-to-code.ts
lib/tools/json-to-code.ts
lib/tools/cert-decoder.ts
docs/plans/2026-03-01-15-new-tools-design.md
```

### Modified files
```
lib/tools/registry.ts            # +15 tool entries
lib/tools/engine.ts              # +15 switch cases + imports
components/tools/ToolWorkbench.tsx  # +actionConfig, sampleInput, toolControls
package.json                     # +cronstrue
tests/unit/engine.test.ts        # +15 test cases
```

### No changes needed
- Routing (`app/tools/[toolId]/page.tsx`) — uses `generateStaticParams()` from registry automatically
- Layout, DB schema, store, hooks — unchanged
