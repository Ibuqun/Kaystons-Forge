# PLAN.md

## DevUtils Web - Browser-Based Developer Utilities Suite

A comprehensive, client-side developer tools platform replicating the functionality of the DevUtils desktop application. All processing occurs in the browser with zero server dependencies.

---

## 1. PROJECT OVERVIEW

**Name:** DevUtils Web

**Description:** A browser-based collection of essential developer utilities. All tools run locally in your browser—no data is sent to any server.

**Core Principles:**
- Privacy-first: All computation happens client-side
- Offline-capable: Full functionality without network connection
- Keyboard-driven: Efficient navigation without mouse dependency
- Consistent interface: Unified patterns across all tools

---

## 2. TECHNOLOGY STACK

| Category | Technology |
|----------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Icons | Heroicons (solid/outline variants) |
| Code Editor | Monaco Editor |
| Storage | IndexedDB via Dexie.js |
| Testing | Vitest + React Testing Library |
| Build Output | Static export |

---

## 3. ICON SYSTEM

Use **Heroicons** (https://heroicons.com/) exclusively. Map each tool to appropriate semantic icons:

**Icon Mapping:**
- Unix Time Converter: `ClockIcon`
- JSON Format/Validate: `CodeBracketIcon`
- Base64 String Encode/Decode: `HashtagIcon` or `ArrowPathIcon`
- Base64 Image Encode/Decode: `PhotoIcon`
- JWT Debugger: `KeyIcon` or `ShieldCheckIcon`
- RegExp Tester: `MagnifyingGlassIcon`
- URL Encode/Decode: `LinkIcon`
- URL Parser: `LinkIcon` or `GlobeAltIcon`
- HTML Entity Encode/Decode: `CodeBracketSquareIcon`
- Backslash Escape/Unescape: `ArrowUturnLeftIcon`
- UUID/ULID Generate/Decode: `FingerPrintIcon`
- HTML Preview: `EyeIcon` or `WindowIcon`
- Text Diff Checker: `ArrowsRightLeftIcon`
- YAML to JSON: `ArrowRightIcon` (with file indicators)
- JSON to YAML: `ArrowRightIcon` (with file indicators)
- Number Base Converter: `CalculatorIcon` or `NumberedListIcon`
- HTML Beautify/Minify: `SparklesIcon` or `CompressIcon`
- CSS Beautify/Minify: `PaintBrushIcon`
- JS Beautify/Minify: `BeakerIcon` or `CogIcon`
- ERB Beautify/Minify: `TemplateIcon`
- LESS Beautify/Minify: `ColorSwatchIcon`
- SCSS Beautify/Minify: `ColorSwatchIcon`
- XML Beautify/Minify: `DocumentTextIcon`
- Lorem Ipsum Generator: `PencilSquareIcon`
- QR Code Reader/Generator: `QrCodeIcon` or `Square2StackIcon`
- String Inspector: `MagnifyingGlassCircleIcon`
- JSON to CSV: `TableCellsIcon` or `ArrowDownTrayIcon`
- CSV to JSON: `TableCellsIcon` or `ArrowUpTrayIcon`
- Hash Generator: `LockClosedIcon`
- HTML to JSX: `CodeBracketIcon` or `VariableIcon`
- Markdown Preview: `DocumentTextIcon` or `BookOpenIcon`
- SQL Formatter: `CircleStackIcon` or `CommandLineIcon`

**Icon Implementation:**
```typescript
import { 
  ClockIcon, 
  CodeBracketIcon, 
  HashtagIcon,
  // ... etc
} from '@heroicons/react/24/outline';

// Use outline variant for sidebar navigation
// Use solid variant for active states or small indicators
4. COMPLETE TOOL SPECIFICATIONS
Based on the DevUtils desktop application (v1.17.0), implement all 30 tools organized into logical categories.
CATEGORY A: Encoding & Encryption
A1. Unix Time Converter
Purpose: Convert between Unix timestamps and human-readable dates.
Features:
Input: Unix timestamp (seconds or milliseconds auto-detect) or ISO date string
Output formats: Local time, UTC, ISO 8601, Relative time (e.g., "2 hours ago")
Live conversion as you type
Copy button for each output format
Current timestamp button (inserts now)
Technical: Native Date object, Intl.RelativeTimeFormat for relative display.
A2. JSON Format/Validate
Purpose: Format, validate, and inspect JSON data.
Features:
Input: Raw JSON string
Actions: Prettify, Minify, Validate
Error highlighting with line numbers
Tree view expandable/collapsible
Search within JSON
Convert to JavaScript object notation
Technical: Native JSON.parse with error recovery, Monaco Editor for syntax highlighting.
A3. Base64 String Encode/Decode
Purpose: Encode/decode text to/from Base64.
Features:
Text input with character counter
Encode/Decode toggle
UTF-8 safe handling
URL-safe Base64 option
File drop support for automatic encoding
Technical: btoa/atob with UTF-8 encoding handling, TextEncoder API.
A4. Base64 Image Encode/Decode
Purpose: Convert images to Base64 data URLs and vice versa.
Features:
Drag-and-drop image upload
Preview thumbnail
Output: Base64 string, Data URL, HTML img tag, CSS background
Decode: Paste Base64, extract to downloadable image
File size indicator
Format detection (PNG, JPEG, etc.)
Technical: FileReader API, Canvas for preview, download attribute for saving.
A5. JWT Debugger
Purpose: Decode and inspect JSON Web Tokens.
Features:
Paste JWT token
Decode header (algorithm, type)
Decode payload (claims, expiration)
Signature verification display (informational only)
Color-coded expiration status (green/red)
Common claim explanations (iss, sub, aud, exp, iat)
Technical: jwt-decode library, manual Base64Url decoding for header.
A6. RegExp Tester
Purpose: Test regular expressions against input text.
Features:
Pattern input with syntax highlighting
Test string input
Match highlighting in real-time
Match groups display table
Explanation of pattern components
Common patterns library (email, URL, phone, etc.)
Flags toggle (g, i, m, s, u, y)
Technical: Native RegExp constructor with try-catch, custom highlighter for matches.
A7. URL Encode/Decode
Purpose: Encode and decode URL components.
Features:
Full URL encoding
Component encoding (encodeURIComponent)
Form data encoding (application/x-www-form-urlencoded)
Decode all variants
Space handling options (+ vs %20)
Technical: encodeURI, encodeURIComponent, decode counterparts.
A8. URL Parser
Purpose: Break down URLs into components.
Features:
Input: Full URL
Output sections: Protocol, Hostname, Port, Pathname, Search/Query, Hash
Query parameters table (key-value pairs with decode)
Copy buttons for each component
Reconstruct URL from components (editable fields)
Technical: Native URL constructor, URLSearchParams for query handling.
CATEGORY B: Escaping & Entities
B1. HTML Entity Encode/Decode
Purpose: Convert special characters to HTML entities.
Features:
Named entities (&, <, etc.)
Numeric entities (<, <)
Decode all variants back to characters
Preserve whitespace option
Technical: DOM textarea method for decoding, entity map for encoding.
B2. Backslash Escape/Unescape
Purpose: Handle escape sequences in strings.
Features:
Common escapes: \n, \t, \r, ", ', \
Unicode escapes: \uXXXX, \xXX
Raw string output option
Line ending conversion (CRLF/LF)
Technical: Custom parser with state machine, JSON.parse as fallback for valid JSON strings.
B3. UUID/ULID Generate/Decode
Purpose: Generate unique identifiers.
Features:
UUID v4 (random) generation
UUID v7 (timestamp-based) generation
ULID generation
Bulk generation (1-1000 at once)
Decode ULID to timestamp
Format options: lowercase, uppercase, with/without dashes
Technical: crypto.randomUUID for v4, uuid library for v7, ulidx library for ULID.
CATEGORY C: Preview & Comparison
C1. HTML Preview
Purpose: Render HTML in sandboxed environment.
Features:
HTML input with live preview
Sandboxed iframe (no JS execution)
Mobile viewport simulation (320px, 375px, 768px, 1024px)
Fullscreen preview mode
Export as .html file
Technical: iframe srcdoc with sandbox attribute, CSP headers.
C2. Text Diff Checker
Purpose: Compare two text blocks.
Features:
Side-by-side or inline diff view
Original vs Modified inputs
Character-level diff highlighting
Added/removed line indicators
Patch format export
Ignore whitespace option
Technical: diff-match-patch library or diff library, custom diff renderer.
CATEGORY D: Format Converters
D1. YAML to JSON
Purpose: Convert YAML documents to JSON.
Features:
YAML input with error highlighting
JSON output (prettified or minified)
Multiple document support
Anchor/alias resolution display
Validation of YAML syntax
Technical: js-yaml library with schema options.
D2. JSON to YAML
Purpose: Convert JSON to YAML format.
Features:
JSON input
YAML output with formatting options
Quote style options
Indentation configuration
Technical: js-yaml dump with options.
D3. Number Base Converter
Purpose: Convert between number bases.
Features:
Input any base (2-36)
Output to all common bases simultaneously: Binary, Octal, Decimal, Hexadecimal
Arbitrary base conversion
BigInt support for large numbers
Two's complement option for negative numbers
Technical: Native parseInt and toString with BigInt for large values.
CATEGORY E: Code Beautifiers
E1. HTML Beautify/Minify
Purpose: Format or compress HTML.
Features:
Prettier formatting (indentation, attribute wrapping)
Custom print width
Minification (remove whitespace, optional attribute quote removal)
Self-closing tag handling
Technical: prettier/standalone with HTML parser, html-minifier-terser.
E2. CSS Beautify/Minify
Purpose: Format or compress CSS.
Features:
Prettier formatting
Property sorting option
Minification (clean-css or csso)
SCSS basic support for formatting
Technical: prettier/standalone with CSS parser, csso for minification.
E3. JS Beautify/Minify
Purpose: Format or compress JavaScript.
Features:
Prettier formatting with config
Terser minification
TypeScript support
Source map generation option (minify mode)
Technical: prettier/standalone, terser (loaded in Web Worker due to size).
E4. ERB Beautify/Minify
Purpose: Format Embedded Ruby templates.
Features:
Handle <% %>, <%= %>, <%# %> tags
Indentation inside Ruby blocks
HTML formatting around ERB tags
Technical: Prettier with ERB plugin or custom formatter preserving ERB tags.
E5. LESS Beautify/Minify
Purpose: Format and compile LESS to CSS.
Features:
LESS formatting
Compile to CSS
Variable/mixin preservation in formatting
Source map option for compilation
Technical: less.js compiler in browser.
E6. SCSS Beautify/Minify
Purpose: Format and compile SCSS to CSS.
Features:
SCSS formatting
Compile to CSS
Nested rule handling
Variable interpolation support
Technical: sass.js (WebAssembly build) for compilation.
E7. XML Beautify/Minify
Purpose: Format and compress XML.
Features:
Pretty print with configurable indentation
Attribute line wrapping
Minification (remove whitespace between tags)
XML validation
XPath tester (bonus feature)
Technical: xml-formatter, fast-xml-parser for validation.
CATEGORY F: Generators
F1. Lorem Ipsum Generator
Purpose: Generate placeholder text.
Features:
Generate by: Paragraphs, Words, Bytes, Lists
HTML wrapping option (<p><ul>
Start with "Lorem ipsum" toggle
Copy as plain text or HTML
Technical: Classic Cicero text generation, word/byte counting.
F2. QR Code Reader/Generator
Purpose: Create and read QR codes.
Features:
Generate: Text/URL input, error correction level, size, download PNG/SVG
Read: Upload image, paste image, camera capture (getUserMedia)
History of generated codes
Technical: qrcode library for generation, jsQR library for reading, Canvas API for image processing.
F3. String Inspector
Purpose: Analyze string properties.
Features:
Character count (grapheme clusters)
Byte length (UTF-8, UTF-16)
Line count
Word count
Encoding detection (ASCII, UTF-8, etc.)
Character frequency table
Show invisible characters (spaces, tabs, newlines)
Technical: Intl.Segmenter for graphemes, TextEncoder for byte lengths.
CATEGORY G: Data Transformers
G1. JSON to CSV
Purpose: Convert JSON arrays to CSV format.
Features:
Flatten nested objects (dot notation keys)
Array handling (join or expand)
Header ordering
Delimiter selection (comma, semicolon, tab)
Download CSV file
Technical: flat library for nesting, PapaParse for CSV generation.
G2. CSV to JSON
Purpose: Parse CSV to JSON.
Features:
Delimiter auto-detection
Header row handling
Type inference (numbers, booleans, null)
Skip empty lines option
Preview first 10 rows
Download JSON file
Technical: PapaParse with dynamicTyping and transform functions.
G3. Hash Generator
Purpose: Generate cryptographic hashes.
Features:
Algorithms: MD5, SHA-1, SHA-256, SHA-512
HMAC with secret key
Text input or file upload (hash file contents)
Output formats: Hex, Base64, Base64URL
Drag-and-drop file hashing with progress for large files
Technical: crypto-js for algorithms not in Web Crypto, SubtleCrypto for SHA-256/512 in modern browsers, FileReader for file hashing.
G4. HTML to JSX
Purpose: Convert HTML to React JSX.
Features:
HTML to JSX conversion
Attribute naming (class -> className, for -> htmlFor)
Style string to object conversion
Self-closing tag handling
TypeScript JSX option
Technical: html-to-jsx library or custom parser with DOM parsing.
G5. Markdown Preview
Purpose: Render Markdown with live preview.
Features:
GitHub Flavored Markdown
Syntax highlighting in code blocks
Table of Contents generation from headers
Mermaid diagram support (optional)
Export to HTML
Split view or tab view
Technical: marked parser, highlight.js or Prism for code, DOMPurify for sanitization.
G6. SQL Formatter
Purpose: Format SQL queries.
Features:
Multiple dialect support: Standard SQL, PostgreSQL, MySQL, SQLite, BigQuery
Configurable indentation
Uppercase/lowercase keywords option
Comma placement (start or end of line)
Parenthesis handling
Technical: sql-formatter library with language configuration.
5. GLOBAL INTERFACE COMPONENTS
5.1 Sidebar Navigation
Layout:
Fixed left side, 280px width (collapsible to 60px icons-only)
Categories collapsible (Encoding, Formatting, Generators, etc.)
Search filter at top
Favorites section (pinned tools)
Recent tools section (last 5 used)
Behavior:
Toggle with ⌘1 (Ctrl+1 on Windows/Linux)
Persist collapsed state in localStorage
Drag to reorder favorites
Right-click context menu: Pin, Open in new tab (if supported)
5.2 Command Palette
Trigger: ⌘K (Ctrl+K)
Features:
Fuzzy search across all tool names and keywords
Recent tools prioritized
Keyboard navigation (arrow keys, enter to select)
Esc to close
Max 10 results visible, scrollable
5.3 Tool Layout Template
Every tool uses a consistent layout:
┌─────────────────────────────────────────────────────┐
│ Tool Name                    [Settings] [History]   │
├─────────────────────────────────────────────────────┤
│ Input Area                                          │
│ [Editor with line numbers]                          │
│ [Drag-drop zone indication]                         │
│                                                     │
│ [Format] [Minify] [Validate] — Tool-specific actions │
├─────────────────────────────────────────────────────┤
│ Output Area                                         │
│ [Editor or Preview]                                 │
│                                                     │
│ [Copy] [Download] [Clear]                           │
└─────────────────────────────────────────────────────┘
5.4 Editor Component Specifications
Monaco Editor Configuration:
Theme: vs-dark (matching app theme)
Font: JetBrains Mono or Fira Code
Font size: 14px
Line numbers: on
Minimap: off (or optional)
Word wrap: on by default
Scroll beyond last line: off
Features:
Syntax highlighting appropriate to content type
Error squiggles where applicable
Auto-indentation
Bracket matching
Multiple cursor support
5.5 History System
Storage: IndexedDB via Dexie.js
Schema:
interface HistoryEntry {
  id: string;           // Auto-generated
  toolId: string;       // Which tool
  timestamp: number;    // Unix ms
  input: string;        // Input content (truncated if >100KB)
  output: string;       // Output content
  starred: boolean;     // User starred
}
Features:
Save last 50 entries per tool (configurable)
Star/unstar entries (persist indefinitely)
Search history content
Restore to input button
Export history as JSON
Clear history per tool or global
6. KEYBOARD SHORTCUTS
| Shortcut | Action                                        |
| -------- | --------------------------------------------- |
| ⌘K       | Open command palette                          |
| ⌘1       | Toggle sidebar                                |
| ⌘/       | Focus search in sidebar                       |
| ⌘Enter   | Execute primary action (format, encode, etc.) |
| ⌘Shift+C | Copy output to clipboard                      |
| ⌘Shift+S | Save/download output                          |
| ⌘Shift+V | Paste and process (if applicable)             |
| Esc      | Clear current input or close modal            |
| ⌘\[      | Previous tool                                 |
| ⌘]       | Next tool                                     |
Platform detection: Use Cmd (⌘) on macOS, Ctrl on Windows/Linux. Display appropriate symbols.
7. STATE MANAGEMENT
Zustand Store Structure:
interface AppState {
  // UI State
  sidebarOpen: boolean;
  sidebarWidth: number;
  activeToolId: string;
  commandPaletteOpen: boolean;
  
  // Settings
  settings: {
    theme: 'dark' | 'light' | 'system';
    editorFontSize: number;
    editorTabSize: number;
    autoFormatOnPaste: boolean;
    preserveHistory: boolean;
  };
  
  // History (loaded from IndexedDB)
  history: HistoryEntry[];
  
  // Actions
  toggleSidebar: () => void;
  setActiveTool: (id: string) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  updateSettings: (settings: Partial<Settings>) => void;
}
8. DATA PERSISTENCE
IndexedDB Schema (Dexie):
class DevUtilsDB extends Dexie {
  history!: Table<HistoryEntry>;
  favorites!: Table<string>; // tool IDs
  settings!: Table<{ id: string; value: any }>;
  
  constructor() {
    super('DevUtilsDB');
    this.version(1).stores({
      history: '++id, toolId, timestamp, starred',
      favorites: '++id',
      settings: 'id'
    });
  }
}
localStorage (minimal):
Last active tool (for restore on reload)
Sidebar collapsed state
Theme preference (before DB loads)
9. STYLING SPECIFICATION
Color Palette:
| Token              | Value     | Usage                    |
| ------------------ | --------- | ------------------------ |
| `--bg-primary`     | `#0f172a` | Main background          |
| `--bg-secondary`   | `#1e293b` | Sidebar, cards           |
| `--bg-tertiary`    | `#334155` | Hover states             |
| `--border`         | `#475569` | Borders, dividers        |
| `--text-primary`   | `#f8fafc` | Headings, primary text   |
| `--text-secondary` | `#94a3b8` | Labels, descriptions     |
| `--accent`         | `#10b981` | Success, primary actions |
| `--accent-hover`   | `#059669` | Hover state              |
| `--error`          | `#ef4444` | Errors, destructive      |
| `--warning`        | `#f59e0b` | Warnings                 |
| `--info`           | `#3b82f6` | Information              |
Typography:
Sans-serif: Inter, system-ui fallback
Monospace: JetBrains Mono, Menlo, Monaco, monospace
Base size: 14px
Line height: 1.5
Spacing Scale:
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
10. PROJECT FILE STRUCTURE
devutils-web/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with providers
│   ├── page.tsx                 # Redirects to default tool
│   ├── globals.css              # Tailwind + custom properties
│   ├── tools/
│   │   └── [toolId]/
│   │       └── page.tsx         # Dynamic tool route
│   └── api/                     # No API routes (static export)
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── Header.tsx
│   │   └── ToolLayout.tsx
│   ├── ui/                      # Base components (Button, Input, etc.)
│   ├── editor/
│   │   ├── MonacoEditor.tsx
│   │   └── DiffEditor.tsx
│   └── tools/                   # Tool-specific UI components
│       ├── JsonTool/
│       ├── Base64Tool/
│       └── ... (one directory per tool)
├── hooks/
│   ├── useLocalStorage.ts
│   ├── useHistory.ts
│   ├── useClipboard.ts
│   └── useTool.ts
├── lib/
│   ├── db.ts                    # IndexedDB/Dexie setup
│   ├── tools/                   # Tool logic (pure functions)
│   │   ├── index.ts             # Tool registry
│   │   ├── json.ts
│   │   ├── base64.ts
│   │   └── ... (30 tool modules)
│   └── utils.ts                 # Shared utilities
├── types/
│   └── index.ts                 # TypeScript definitions
├── public/
│   ├── manifest.json            # PWA manifest
│   └── icons/                   # App icons
├── tests/
│   ├── unit/                    # Tool logic tests
│   └── e2e/                     # Playwright tests
├── next.config.js               # Static export config
├── tailwind.config.ts
├── tsconfig.json
└── package.json
11. TOOL REGISTRY
Central registry in lib/tools/index.ts:
import { 
  ClockIcon, 
  CodeBracketIcon,
  // ... all Heroicons
} from '@heroicons/react/24/outline';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: 'encoding' | 'formatting' | 'generators' | 'preview' | 'data' | 'web';
  icon: React.ComponentType<{ className?: string }>;
  component: React.LazyExoticComponent<React.FC>;
  keywords: string[];
  hasSettings: boolean;
}

export const tools: ToolDefinition[] = [
  {
    id: 'unix-time-converter',
    name: 'Unix Time Converter',
    description: 'Convert between Unix timestamps and human-readable dates',
    category: 'encoding',
    icon: ClockIcon,
    component: lazy(() => import('@/components/tools/UnixTimeTool')),
    keywords: ['timestamp', 'epoch', 'date', 'time'],
    hasSettings: false
  },
  // ... all 30 tools
];

export const categories = {
  encoding: 'Encoding & Encryption',
  formatting: 'Formatting & Conversion',
  generators: 'Generators',
  preview: 'Preview & Inspection',
  data: 'Data Transformation',
  web: 'Web Tools'
} as const;
12. PWA CONFIGURATION
12. PWA CONFIGURATION
Manifest Requirements:
Name: "DevUtils Web"
Short name: "DevUtils"
Start URL: "/"
Display: standalone
Background color: #0f172a
Theme color: #0f172a
Icons: 192x192, 512x512 PNGs
Service Worker:
Cache all static assets
Cache tool logic for offline use
No network-first strategy needed (no API calls)
13. IMPLEMENTATION PHASES
Phase 1: Foundation (Week 1)
Project setup (Next.js, Tailwind, TypeScript)
Base layout components (Sidebar, Header)
Command palette skeleton
Monaco Editor integration
IndexedDB setup
Tool registry system
Phase 2: Core Tools (Week 2)
Implement in order:
JSON Format/Validate
Base64 String Encode/Decode
URL Encode/Decode
Unix Time Converter
UUID Generator
HTML Preview
Markdown Preview
JWT Debugger
Phase 3: Format Converters (Week 3)
YAML to JSON / JSON to YAML
Number Base Converter
All Beautify/Minify tools (HTML, CSS, JS)
Text Diff Checker
Phase 4: Advanced Tools (Week 4)
Base64 Image tool
QR Code Generator/Reader
Hash Generator
JSON to CSV / CSV to JSON
RegExp Tester
SQL Formatter
Phase 5: Remaining Tools (Week 5)
HTML Entity Encode/Decode
Backslash Escape/Unescape
URL Parser
ERB/LESS/SCSS tools
HTML to JSX
String Inspector
Lorem Ipsum Generator
Phase 6: Polish (Week 6)
PWA configuration
Keyboard shortcuts
History system
Settings panel
Testing
Performance optimization
Documentation
14. TESTING REQUIREMENTS
Unit Tests (Vitest):
Every tool logic function must have tests
Edge cases: empty input, malformed input, very large input
Encoding/decoding round-trip tests
Integration Tests:
File upload/download flows
Clipboard operations (mocked)
IndexedDB operations
E2E Tests (Playwright):
Navigation between tools
Command palette flow
Sidebar collapse/expand
Tool execution and copy functionality
15. PERFORMANCE GUIDELINES
Bundle Splitting: Each tool loaded via React.lazy()
Monaco Editor: Loaded on demand, not in initial bundle
Heavy Libraries: Terser, Sass compiled to Web Workers
Image Processing: Use Canvas, avoid large library dependencies
Large File Handling: Stream file reading for hash generation
Debouncing: 300ms debounce on live preview tools
Targets:
First Contentful Paint: < 1.5s
Time to Interactive: < 3s
Lighthouse Performance: > 90
16. ACCESSIBILITY CHECKLIST
[ ] All interactive elements keyboard accessible
[ ] ARIA labels on icon-only buttons
[ ] Focus visible indicators
[ ] Color contrast ratio > 4.5:1
[ ] Screen reader announcements for async operations
[ ] Reduced motion media query support
[ ] Skip navigation link
17. DELIVERABLES
Upon completion, provide:
Source Code: Complete Next.js application
Build: Static export in dist/ folder
Documentation: README with deployment instructions
Tests: Passing test suite
PWA: Installable application with offline support
No backend required. Deploy to any static hosting: Vercel, Netlify, GitHub Pages, Cloudflare Pages.
18. REFERENCE MATERIAL
Since no screenshot is available during implementation, refer to:
DevUtils macOS app (if accessible) for UX patterns
Similar tools: jsonformatter.org, base64decode.org, jwt.io for individual tool UIs
Design inspiration: VS Code, GitHub's dark theme, Vercel's dashboard
END OF SPECIFICATION
Implement all 30 tools with complete functionality as described. Ensure consistent UI patterns, full keyboard navigation, and offline capability. The application must be production-ready with no placeholder functionality.


This PLAN.md provides a complete, self-contained specification for building the DevUtils web application. It includes all 30 tools with detailed functionality descriptions, the Heroicons icon mapping (replacing Lucide), professional naming without taglines, and comprehensive technical architecture. The plan is designed to be fed directly to an AI coding system without requiring the original screenshot reference.