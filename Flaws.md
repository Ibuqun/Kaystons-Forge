# Implementation Plan: Codex Edge Cases & Stress Tests

Based on the edge cases and stress tests that Codex likely pointed out, here is the list of problems found and the proposed fixes.

## Issues Identified

### 1. Algorithmic Denial of Service (DoS) in `list-compare`
**Problem:** The fuzzy match logic `(setA.size * setB.size <= 2_500_000)` allows an $O(N \times M \times L_1 \times L_2)$ operation on the main thread. Comparing two lists of 1,500 items (100 chars each) requires over 22 billion operations, instantly freezing the browser tab indefinitely since it runs synchronously on the main UI thread.
**Fix:** Drastically lower the fuzzy matching threshold or offload this extensive text processing to a Web Worker so the UI is not blocked. A simpler constraint (e.g., maximum string length for fuzzy matching) is also required.

### 2. Negative Unix Timestamps (Seconds vs Milliseconds)
**Problem:** The `unix-time-converter` relies on `cleaned.length > 10` to distinguish between milliseconds and seconds. A negative timestamp in seconds like `-1704067200` has a length of 11 (due to the minus sign), causing it to incorrectly evaluate as milliseconds and yielding a date in 1969 instead of 1916. 
**Fix:** Measure the length of the string without the `-` sign or evaluate the absolute integer values before falling back to string length heuristics.

### 3. Missing Multiple Document Support in YAML to JSON
**Problem:** The original specification dictates "Multiple document support" for YAML. However, `engine.ts` uses `yamlLoad` which throws an error (`bad indentation of a mapping entry`) if the YAML has a `---` document separator. 
**Fix:** Import and use `js-yaml`'s `loadAll` method instead of `load`, and wrap the output in a JSON array.

### 4. Hex Color Alpha Channel Loss
**Problem:** The `color-converter` regex ignores 4-digit (`#rgba`) and 8-digit (`#rrggbbaa`) hex codes' alpha (transparency) channels. For example, `#ff000088` correctly assigns the R, G, B channels, but silently drops the `88` alpha value, treating it equivalently to `#ff0000`.
**Fix:** Update the regex and logic to parse out the alpha channel if present, and include `rgba()`, `hsla()`, and hex with transparency in the converted output. 

### 5. URL Decoder '+' Corruption
**Problem:** Standard URL encoding uses `%20` for spaces, but `form-encoded` URLs use `+`. The `url-encode-decode` tool applies `.replaceAll('+', ' ')` *before* `decodeURIComponent` for all decodes. This corrupts valid, correctly encoded `+` symbols in strictly percent-encoded input. 
**Fix:** Ensure standard URL decoding only uses `decodeURIComponent`, while form-decoded input uses the space-replace logic. 

### 6. Loose JSON Parser Fragility
**Problem:** The `parseJsonLoose` implementation uses regex to wrap unquoted keys (`text.replace(/([{,]\s*)([A-Za-z_$][\w$-]*)(\s*:)/g, '$1"$2"$3')`). This regex lacks context awareness and can fail corruptly on strings containing colons or in deeply nested properties with varying spacing, throwing obscure syntax errors.
**Fix:** Since a robust loose JSON parser is difficult with regex, we should improve the handling to gracefully degrade or use a proper AST-based loose parser library like `json5` (which was removed previously due to bundle issues, but should be handled properly).

## User Review Required

Please confirm if these are the exact edge cases the Codex stress test pointed out. If this matches your expectations, I am ready to implement the fixes in the codebase and verify the results.

## Proposed Changes

### `lib/tools/engine.ts`
- **[MODIFY]** `detectTimestamp` calculation logic.
- **[MODIFY]** `yaml-to-json` case to use `loadAll`.
- **[MODIFY]** `color-converter` to parse alpha transparency properly.
- **[MODIFY]** `url-encode-decode` case behavior.

### `lib/tools/list-compare.ts`
- **[MODIFY]** Decrease `fuzzyMatch` limit and implement stricter constraints.

## Verification Plan

### Automated Tests
- I will add specific test cases for all 6 edge cases within `tests/unit/bugfixes.test.ts`. 
- Run tests via `npm run test` to guarantee the bugs are fully squashed without regressions.

## SECTION 2: Codex Edge-Case Findings

### 1. [P0] Arbitrary code execution in JSON parser fallback
- **Issue:** `parseJsonLoose` executes user input with `new Function(...)`.
- **Impact:** Code execution risk in tools that rely on loose JSON parsing (`json-format-validate`, `json-to-yaml`, `json-to-php`, `php-serializer`, `json-to-code`).
- **Reference:** `lib/tools/engine.ts:39`, `lib/tools/engine.ts:54`

### 2. [P1] `json-to-code` can emit invalid code for common JSON keys
- **Issue:** Keys like `first-name` are emitted directly as identifiers.
- **Impact:** Generated TypeScript/Python output can be syntactically invalid.
- **Reference:** `lib/tools/json-to-code.ts:27`, `lib/tools/json-to-code.ts:52`

### 3. [P1] `csv-to-sql` corrupts quoted multiline CSV fields
- **Issue:** CSV parser splits by line before quote-aware parsing.
- **Impact:** Quoted multiline fields are broken into extra rows.
- **Reference:** `lib/tools/csv-to-sql.ts:125`

### 4. [P1] Hex/ASCII tools have byte-level correctness bugs
- **Issue A:** `ascii-to-hex` uses UTF-16 code units instead of UTF-8 bytes.  
- **Issue B:** `hex-to-ascii` accepts invalid byte chunks (e.g., odd-length tokens).
- **Impact:** Incorrect conversions and silent data corruption for non-ASCII text.
- **Reference:** `lib/tools/engine.ts:911`, `lib/tools/engine.ts:926`

### 5. [P1] PHP unserializer does not fully validate input
- **Issue:** Trailing garbage after valid serialized payload is accepted.
- **Impact:** Invalid/malicious payloads can be treated as valid.
- **Reference:** `lib/tools/php-tools.ts:47`, `lib/tools/php-tools.ts:90`

### 6. [P1] `json-to-csv` accepts non-object arrays
- **Issue:** Arrays like `[1,2,3]` are cast and passed through instead of rejected.
- **Impact:** Produces malformed/meaningless CSV output.
- **Reference:** `lib/tools/engine.ts:583`

### 7. [P2] `curl-to-code` drops URL when input does not start with `curl`
- **Issue:** Parser starts from token index `1`, assuming token `0` is always `curl`.
- **Impact:** URL-only inputs generate `fetch("")`.
- **Reference:** `lib/tools/curl-to-code.ts:42`

### 8. [P2] `svg-to-css` accepts non-SVG XML
- **Issue:** Any `<?xml` payload is accepted without checking for `<svg>` root.
- **Impact:** Invalid SVG inputs still produce CSS output.
- **Reference:** `lib/tools/engine.ts:900`

### 9. [P2] `list-compare` loses original case in outputs
- **Issue:** Normalization lowercases values and outputs normalized forms.
- **Impact:** Case-sensitive identifiers are destructively altered in results.
- **Reference:** `lib/tools/list-compare.ts:25`, `lib/tools/list-compare.ts:69`, `lib/tools/list-compare.ts:156`

### 10. [P2] Color converter UI action mismatch (`to-hex`)
- **Issue:** UI exposes `to-hex`, but engine has no `to-hex` action branch.
- **Impact:** Action behaves like default output instead of dedicated HEX conversion.
- **Reference:** `components/tools/ToolWorkbench.tsx:156`, `lib/tools/engine.ts:854`

### 11. [P3] `line-sort` dedupe behavior is inconsistent with duplicate stats
- **Issue:** `dedupe` uses lowercased raw lines, while `dedupe-sort` trims first.
- **Impact:** Whitespace/casing variants produce inconsistent duplicate outcomes.
- **Reference:** `lib/tools/engine.ts:936`, `lib/tools/engine.ts:940`

### Edge-Case Sweep Summary
- Temporary edge-case run: **30 tests**, **14 failures** (used to isolate defects).
- Full registry smoke run: **51/51 tools** responded and none returned `"Tool not implemented."`.
