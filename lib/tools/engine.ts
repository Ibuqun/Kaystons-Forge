import CryptoJS from 'crypto-js';
import { createPatch, diffLines } from 'diff';
import { parse as csvParse, unparse as csvUnparse } from 'papaparse';
import { load as yamlLoad, dump as yamlDump } from 'js-yaml';
import { format as formatSql } from 'sql-formatter';
import { minify as terserMinify } from 'terser';
import { XMLParser } from 'fast-xml-parser';
import xmlFormat from 'xml-formatter';
import htmlToJsx from 'html-to-jsx';
import { jwtDecode } from 'jwt-decode';
import { runSplitter, parseConfig as parseSplitterConfig, type SplitterConfig } from './list-splitter';
import { runCsvToSql, type SqlDialect } from './csv-to-sql';
import { runListCompare } from './list-compare';
import { ulid, decodeTime } from 'ulidx';
import { v4 as uuidv4, v7 as uuidv7 } from 'uuid';

export interface ProcessOptions {
  action?: string;
  secondInput?: string;
}

export interface ProcessResult {
  output: string;
  previewHtml?: string;
  table?: Array<Record<string, string>>;
  meta?: string;
}

function stringify(value: unknown, pretty = true) {
  return JSON.stringify(value, null, pretty ? 2 : 0);
}

function parseJsonLoose(raw: string) {
  const text = raw.trim();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    // Step 1: Quote unquoted keys
    let normalized = text.replace(/([{,]\s*)([A-Za-z_$][\w$-]*)(\s*:)/g, '$1"$2"$3');
    // Step 2: Replace single-quoted string values (not apostrophes inside double-quoted strings)
    normalized = normalized.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');
    // Step 3: Remove trailing commas
    normalized = normalized.replace(/,\s*([}\]])/g, '$1');
    try {
      return JSON.parse(normalized);
    } catch {
      if (!text.startsWith('{') && !text.startsWith('[')) return text;
      throw new Error('Invalid JSON. Ensure keys and string values are quoted correctly.');
    }
  }
}

function formatJsonError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Invalid JSON input.';
  return `JSON parse error: ${message}`;
}

function detectTimestamp(raw: string) {
  const cleaned = raw.trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (Number.isNaN(n)) return null;
  return cleaned.length > 10 ? n : n * 1000;
}

function relativeTime(targetMs: number) {
  const now = Date.now();
  const seconds = Math.round((targetMs - now) / 1000);
  const abs = Math.abs(seconds);
  const unit = abs < 60 ? 'second' : abs < 3600 ? 'minute' : abs < 86400 ? 'hour' : 'day';
  const divisor = unit === 'second' ? 1 : unit === 'minute' ? 60 : unit === 'hour' ? 3600 : 86400;
  const value = Math.round(seconds / divisor);
  return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(value, unit as Intl.RelativeTimeFormatUnit);
}

function htmlEntityEncode(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function htmlEntityDecode(value: string) {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&');
}

function escapeBackslash(value: string) {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('\n', '\\n')
    .replaceAll('\r', '\\r')
    .replaceAll('\t', '\\t')
    .replaceAll('"', '\\"')
    .replaceAll("'", "\\'");
}

function unescapeBackslash(value: string) {
  return value
    .replaceAll('\\n', '\n')
    .replaceAll('\\r', '\r')
    .replaceAll('\\t', '\t')
    .replaceAll('\\"', '"')
    .replaceAll("\\'", "'")
    .replaceAll('\\\\', '\\');
}

function parseUrl(value: string) {
  try {
    const parsed = new URL(value.trim());
    const queryRows: Array<Record<string, string>> = [];
    parsed.searchParams.forEach((v, k) => queryRows.push({ key: k, value: v }));
    return {
      output: [
        `protocol: ${parsed.protocol}`,
        `hostname: ${parsed.hostname}`,
        `port: ${parsed.port || '(default)'}`,
        `pathname: ${parsed.pathname}`,
        `search: ${parsed.search || '(none)'}`,
        `hash: ${parsed.hash || '(none)'}`,
      ].join('\n'),
      table: queryRows,
    };
  } catch {
    return { output: 'Invalid URL' };
  }
}

function flattenRecord(input: Record<string, unknown>, prefix = '', out: Record<string, unknown> = {}) {
  for (const [key, value] of Object.entries(input)) {
    const composed = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenRecord(value as Record<string, unknown>, composed, out);
    } else if (Array.isArray(value)) {
      out[composed] = value.join('|');
    } else {
      out[composed] = value ?? '';
    }
  }
  return out;
}

function detectEncoding(text: string) {
  return /^[\x00-\x7F]*$/.test(text) ? 'ASCII' : 'UTF-8';
}

function parseBase(value: string, base: number) {
  if (!Number.isInteger(base) || base < 2 || base > 36) throw new Error('Base must be between 2 and 36.');
  const negative = value.startsWith('-');
  const raw = negative ? value.slice(1) : value;
  if (!raw) return 0n;
  let acc = 0n;
  for (const ch of raw.toLowerCase()) {
    const code = ch.charCodeAt(0);
    const digit = code >= 48 && code <= 57 ? code - 48 : code >= 97 && code <= 122 ? code - 87 : 99;
    if (digit >= base) throw new Error(`Invalid digit '${ch}' for base ${base}.`);
    acc = acc * BigInt(base) + BigInt(digit);
  }
  return negative ? -acc : acc;
}

function escapeHtmlAttr(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Beautify HTML by indenting tags properly */
function beautifyHtml(html: string): string {
  const result: string[] = [];
  let indent = 0;
  const voidElements = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);

  // Split between all adjacent tags (with or without whitespace)
  const tokens = html.replace(/>\s*</g, '>\n<').split('\n');

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    // Closing tag
    if (/^<\//.test(trimmed)) {
      indent = Math.max(0, indent - 1);
      result.push('  '.repeat(indent) + trimmed);
    }
    // Self-closing or void
    else if (/\/>$/.test(trimmed) || voidElements.has((trimmed.match(/^<(\w+)/)?.[1] || '').toLowerCase())) {
      result.push('  '.repeat(indent) + trimmed);
    }
    // Opening tag
    else if (/^<\w/.test(trimmed)) {
      result.push('  '.repeat(indent) + trimmed);
      // Only increase indent if this line has an opening tag without its matching close
      const tagName = (trimmed.match(/^<(\w+)/)?.[1] || '').toLowerCase();
      if (tagName && !new RegExp(`</${tagName}>\\s*$`, 'i').test(trimmed)) {
        indent++;
      }
    }
    // Text or other content
    else {
      result.push('  '.repeat(indent) + trimmed);
    }
  }
  return result.join('\n');
}

/** Minify HTML by collapsing whitespace and removing comments */
function minifyHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')    // Remove comments
    .replace(/\s+/g, ' ')               // Collapse whitespace
    .replace(/>\s+</g, '><')            // Remove space between tags
    .replace(/\s+>/g, '>')              // Remove space before >
    .replace(/<\s+/g, '<')              // Remove space after <
    .trim();
}

/** Beautify CSS/LESS/SCSS by properly indenting rules */
function beautifyCss(css: string): string {
  const result: string[] = [];
  let indent = 0;

  // Normalize
  const normalized = css
    .replace(/\s*\{\s*/g, ' {\n')
    .replace(/\s*\}\s*/g, '\n}\n')
    .replace(/;\s*/g, ';\n')
    .replace(/\n{2,}/g, '\n');

  for (const line of normalized.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed === '}') {
      indent = Math.max(0, indent - 1);
      result.push('  '.repeat(indent) + trimmed);
    } else if (trimmed.endsWith('{')) {
      result.push('  '.repeat(indent) + trimmed);
      indent++;
    } else {
      result.push('  '.repeat(indent) + trimmed);
    }
  }
  return result.join('\n');
}

/** Minify CSS by collapsing whitespace and removing comments */
function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')   // Remove comments
    .replace(/\s+/g, ' ')               // Collapse whitespace
    .replace(/\s*([{}:;,])\s*/g, '$1')  // Remove space around syntax chars
    .replace(/;}/g, '}')                // Remove last semicolon before }
    .trim();
}

/** Beautify JS with basic indentation */
function beautifyJs(js: string): string {
  const result: string[] = [];
  let indent = 0;

  const normalized = js
    .replace(/\s*\{\s*/g, ' {\n')
    .replace(/\s*\}\s*/g, '\n}\n')
    .replace(/;\s*/g, ';\n')
    .replace(/\n{2,}/g, '\n');

  for (const line of normalized.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('}')) {
      indent = Math.max(0, indent - 1);
      result.push('  '.repeat(indent) + trimmed);
    } else if (trimmed.endsWith('{')) {
      result.push('  '.repeat(indent) + trimmed);
      indent++;
    } else {
      result.push('  '.repeat(indent) + trimmed);
    }
  }
  return result.join('\n');
}

export async function processTool(toolId: string, input: string, options: ProcessOptions = {}): Promise<ProcessResult> {
  const action = options.action ?? 'default';

  try {
    switch (toolId) {
      case 'unix-time-converter': {
        const ts = detectTimestamp(input);
        if (ts === null) {
          const date = new Date(input);
          if (Number.isNaN(date.getTime())) return { output: 'Invalid timestamp or date input.' };
          return {
            output: [
              `Local: ${date.toLocaleString()}`,
              `UTC: ${date.toUTCString()}`,
              `ISO: ${date.toISOString()}`,
              `Relative: ${relativeTime(date.getTime())}`,
              `Unix Seconds: ${Math.floor(date.getTime() / 1000)}`,
              `Unix Milliseconds: ${date.getTime()}`,
            ].join('\n'),
          };
        }
        const date = new Date(ts);
        if (Number.isNaN(date.getTime())) return { output: 'Invalid timestamp or date input.' };
        return {
          output: [
            `Local: ${date.toLocaleString()}`,
            `UTC: ${date.toUTCString()}`,
            `ISO: ${date.toISOString()}`,
            `Relative: ${relativeTime(date.getTime())}`,
            `Unix Seconds: ${Math.floor(date.getTime() / 1000)}`,
            `Unix Milliseconds: ${date.getTime()}`,
          ].join('\n'),
        };
      }

      case 'json-format-validate': {
        try {
          const parsed = parseJsonLoose(input);
          if (action === 'minify') return { output: stringify(parsed, false) };
          if (action === 'js-object') return { output: `const data = ${stringify(parsed, true)};` };
          return { output: stringify(parsed, true) };
        } catch (err) {
          return { output: formatJsonError(err) };
        }
      }

      case 'base64-string': {
        if (action === 'decode') {
          const normalized = input.trim().replaceAll('-', '+').replaceAll('_', '/');
          const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
          return { output: decodeURIComponent(escape(atob(padded))) };
        }
        const encoded = btoa(unescape(encodeURIComponent(input)));
        return { output: action === 'encode-url-safe' ? encoded.replaceAll('+', '-').replaceAll('/', '_').replaceAll(/=+$/g, '') : encoded };
      }

      case 'base64-image': {
        const raw = input.trim();
        if (!raw) return { output: '' };
        if (raw.startsWith('data:image/')) {
          const [head, body] = raw.split(',', 2);
          return {
            output: body || '',
            meta: head,
            previewHtml: `<img src="${escapeHtmlAttr(raw)}" alt="Base64 preview" style="max-width:100%;height:auto" />`,
          };
        }
        const safeBase64 = escapeHtmlAttr(raw);
        const dataUrl = `data:image/png;base64,${safeBase64}`;
        return {
          output: `data:image/png;base64,${raw}`,
          previewHtml: `<img src="${dataUrl}" alt="Base64 preview" style="max-width:100%;height:auto" />`,
        };
      }

      case 'jwt-debugger': {
        const token = input.trim();
        const [headSegment, payloadSegment] = token.split('.');
        if (!headSegment || !payloadSegment) return { output: 'Invalid JWT' };
        const decodeSegment = (segment: string) => JSON.parse(atob(segment.replaceAll('-', '+').replaceAll('_', '/')));
        const header = decodeSegment(headSegment);
        const payload = jwtDecode<Record<string, unknown>>(token);
        const exp = typeof payload.exp === 'number' ? new Date(payload.exp * 1000) : null;
        return {
          output: `Header:\n${stringify(header)}\n\nPayload:\n${stringify(payload)}\n\nExpires At: ${exp ? exp.toISOString() : 'N/A'}\nExpired: ${exp ? exp.getTime() < Date.now() : 'N/A'}`,
        };
      }

      case 'regexp-tester': {
        const flags = action === 'default' ? 'gm' : action;
        const regex = new RegExp(input, flags);
        const test = options.secondInput ?? '';
        const matches = [...test.matchAll(regex)].map((m, i) => {
          const groups = m.slice(1).map((g, idx) => `g${idx + 1}=${g ?? ''}`).join(', ');
          return `#${i + 1} "${m[0]}" @ ${m.index ?? 0}${groups ? ` (${groups})` : ''}`;
        });
        return { output: matches.length ? matches.join('\n') : 'No matches' };
      }

      case 'url-encode-decode': {
        if (action === 'decode') return { output: decodeURIComponent(input.replaceAll('+', ' ')) };
        if (action === 'component') return { output: encodeURIComponent(input) };
        if (action === 'form') return { output: encodeURIComponent(input).replaceAll('%20', '+') };
        return { output: encodeURI(input) };
      }

      case 'url-parser':
        return parseUrl(input);

      case 'html-entity':
        return { output: action === 'decode' ? htmlEntityDecode(input) : htmlEntityEncode(input) };

      case 'backslash-escape':
        return { output: action === 'unescape' ? unescapeBackslash(input) : escapeBackslash(input) };

      case 'uuid-ulid': {
        if (action === 'uuid-v4') return { output: uuidv4() };
        if (action === 'uuid-v7') return { output: uuidv7() };
        if (action === 'ulid') return { output: ulid() };
        if (action === 'decode-ulid') return { output: new Date(decodeTime(input.trim())).toISOString() };
        return { output: [uuidv4(), uuidv7(), ulid()].join('\n') };
      }

      case 'html-preview':
        return { output: input, previewHtml: input };

      case 'text-diff': {
        const right = options.secondInput ?? '';
        if (action === 'patch') return { output: createPatch('input', input, right) };
        return {
          output: diffLines(input, right)
            .map((p) => `${p.added ? '+' : p.removed ? '-' : ' '} ${p.value}`)
            .join('')
            .trim(),
        };
      }

      case 'yaml-to-json':
        return { output: stringify(yamlLoad(input), true) };

      case 'json-to-yaml':
        return { output: yamlDump(parseJsonLoose(input), { indent: 2, lineWidth: 120 }) };

      case 'number-base': {
        const [valuePart, basePart] = input.split('|').map((s) => s.trim());
        const base = Number(basePart || '10');
        const parsed = parseBase(valuePart || '0', base);
        return {
          output: [
            `Binary: ${parsed.toString(2)}`,
            `Octal: ${parsed.toString(8)}`,
            `Decimal: ${parsed.toString(10)}`,
            `Hex: ${parsed.toString(16).toUpperCase()}`,
          ].join('\n'),
        };
      }

      case 'html-beautify': {
        return { output: action === 'minify' ? minifyHtml(input) : beautifyHtml(input) };
      }

      case 'css-beautify':
      case 'less-beautify':
      case 'scss-beautify': {
        return { output: action === 'minify' ? minifyCss(input) : beautifyCss(input) };
      }

      case 'erb-beautify': {
        if (action === 'minify') return { output: minifyHtml(input) };
        return { output: beautifyHtml(input) };
      }

      case 'js-beautify': {
        if (action === 'minify') {
          const out = await terserMinify(input, { compress: true, mangle: true });
          return { output: out.code || '' };
        }
        return { output: beautifyJs(input) };
      }

      case 'xml-beautify': {
        const parser = new XMLParser();
        parser.parse(input);
        return { output: action === 'minify' ? input.replace(/>\s+</g, '><').trim() : xmlFormat(input, { indentation: '  ' }) };
      }

      case 'lorem-ipsum': {
        const count = Math.max(1, Math.min(1000, Number(input.trim() || '3')));
        const unit = action === 'words' ? 'words' : 'paragraphs';
        const base = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua';
        if (unit === 'words') {
          const words = base.split(' ');
          return { output: Array.from({ length: count }, (_, i) => words[i % words.length]).join(' ') };
        }
        const para = `${base}. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`;
        return { output: Array.from({ length: count }, () => para).join('\n\n') };
      }

      case 'qr-code':
        return { output: input };

      case 'string-inspector': {
        const graphemeCount = Array.from(new Intl.Segmenter().segment(input)).length;
        const utf8 = new TextEncoder().encode(input).length;
        const utf16 = input.length * 2;
        const lines = input.length ? input.split(/\r?\n/).length : 0;
        const words = (input.trim().match(/\S+/g) || []).length;
        const freq = new Map<string, number>();
        for (const ch of input) freq.set(ch, (freq.get(ch) || 0) + 1);
        const top = [...freq.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 12)
          .map(([k, v]) => `${JSON.stringify(k)}: ${v}`)
          .join('\n');
        return {
          output: [
            `Grapheme count: ${graphemeCount}`,
            `Byte length (UTF-8): ${utf8}`,
            `Byte length (UTF-16): ${utf16}`,
            `Line count: ${lines}`,
            `Word count: ${words}`,
            `Encoding: ${detectEncoding(input)}`,
            '',
            'Top characters:',
            top,
          ].join('\n'),
        };
      }

      case 'json-to-csv': {
        const parsed = parseJsonLoose(input);
        if (!Array.isArray(parsed)) return { output: 'Input must be a JSON array of objects.' };
        const rows = parsed.map((item) => flattenRecord(item as Record<string, unknown>));
        return { output: csvUnparse(rows) };
      }

      case 'csv-to-json': {
        const parsed = csvParse<Record<string, unknown>>(input, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
        });
        if (parsed.errors.length) {
          return { output: `CSV parse error: ${parsed.errors[0].message}` };
        }
        return { output: stringify(parsed.data, true) };
      }

      case 'hash-generator': {
        const key = options.secondInput || '';
        const algo = action || 'sha256';
        let digest;
        switch (algo) {
          case 'md5':
            digest = CryptoJS.MD5(input);
            break;
          case 'sha1':
            digest = CryptoJS.SHA1(input);
            break;
          case 'sha256':
            digest = CryptoJS.SHA256(input);
            break;
          case 'sha512':
            digest = CryptoJS.SHA512(input);
            break;
          case 'hmac-sha256':
            digest = CryptoJS.HmacSHA256(input, key);
            break;
          default:
            digest = CryptoJS.SHA256(input);
        }
        return {
          output: digest.toString(CryptoJS.enc.Hex),
          meta: [
            `Algorithm: ${algo.toUpperCase()}${algo === 'hmac-sha256' ? ` (key: ${key ? 'provided' : 'none'})` : ''}`,
            `Base64: ${digest.toString(CryptoJS.enc.Base64)}`,
            `Base64URL: ${digest.toString(CryptoJS.enc.Base64).replaceAll('+', '-').replaceAll('/', '_').replaceAll(/=+$/g, '')}`,
          ].join('\n'),
        };
      }

      case 'html-to-jsx':
        return { output: htmlToJsx(input) };

      case 'markdown-preview': {
        const { marked } = await import('marked');
        const rawHtml = await marked.parse(input || '', { gfm: true, breaks: false });
        // Sanitize to prevent XSS - strip script tags, event handlers, etc.
        const sanitized = rawHtml
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
          .replace(/\bon\w+\s*=\s*[^\s>]*/gi, '')
          .replace(/javascript\s*:/gi, 'blocked:')
          .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
          .replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, '')
          .replace(/<embed\b[^>]*>/gi, '');
        return { output: sanitized, previewHtml: sanitized };
      }

      case 'sql-formatter': {
        const language = action === 'default' ? 'sql' : action;
        return { output: formatSql(input, { language: language as any }) };
      }

      case 'list-splitter': {
        const cfg = parseSplitterConfig(options.secondInput || '');
        const template = action === 'default' ? (cfg.template || 'plain') : action;
        const config: SplitterConfig = {
          delimiter: cfg.delimiter || 'auto',
          mode: cfg.mode || 'items_per_group',
          value: cfg.value || 5,
          dedupe: cfg.dedupe || 'none',
          template: template as SplitterConfig['template'],
        };
        const result = runSplitter(input, config);
        return { output: result.output, meta: result.meta };
      }

      case 'csv-to-sql': {
        const dialect = (action === 'default' ? 'mysql' : action) as SqlDialect;
        const result = runCsvToSql(input, dialect, options.secondInput || '');
        return { output: result.output, meta: result.meta };
      }

      case 'list-compare': {
        const result = runListCompare(input, options.secondInput || '', action || 'intersection');
        return { output: result.output, meta: result.meta };
      }

      case 'text-separator': {
        const cfg: Record<string, string> = {};
        for (const line of (options.secondInput || '').split('\n')) {
          const eq = line.indexOf('=');
          if (eq > 0) cfg[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
        }
        const sepMap: Record<string, string> = {
          newline: '\n', comma: ',', comma_space: ', ', semicolon: ';',
          tab: '\t', space: ' ', pipe: '|',
        };
        const fromSep = cfg.from_sep === 'custom' ? (cfg.custom_from || ',') : (sepMap[cfg.from_sep] || '\n');
        const toSep = cfg.to_sep === 'custom' ? (cfg.custom_to || ',') : (sepMap[cfg.to_sep] || ',');
        const doTrim = cfg.trim !== 'false';
        const removeEmpty = cfg.remove_empty !== 'false';

        let items = input.split(fromSep);
        if (doTrim) items = items.map(s => s.trim());
        if (removeEmpty) items = items.filter(Boolean);

        let result: string;
        switch (action) {
          case 'sort': result = [...items].sort((a, b) => a.localeCompare(b)).join(toSep); break;
          case 'unique': result = [...new Set(items)].join(toSep); break;
          case 'count': result = `${items.length} items`; break;
          default: result = items.join(toSep);
        }
        return { output: result, meta: `${items.length} items | From: ${cfg.from_sep || 'newline'} → To: ${cfg.to_sep || 'comma'}` };
      }

      default:
        return { output: 'Tool not implemented.' };
    }
  } catch (error) {
    return { output: error instanceof Error ? error.message : 'Processing failed.' };
  }
}
