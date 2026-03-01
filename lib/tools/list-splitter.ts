// Extracted and adapted from SplitBox — batch list splitting engine

export type SplitMode = 'items_per_group' | 'max_chars_per_group' | 'target_group_count';
export type InputDelimiter = 'newline' | 'comma' | 'tab' | 'auto';
export type DedupeMode = 'none' | 'case_sensitive' | 'case_insensitive';
export type OutputTemplate = 'plain' | 'sql_in' | 'quoted_csv' | 'json_array';

interface SplitGroup {
  index: number;
  items: string[];
  label: string;
}

function getTokenSplitter(delimiter: InputDelimiter, rawInput: string): RegExp {
  if (delimiter === 'auto') {
    if (!rawInput.includes('\n') && !rawInput.includes('\t') && !rawInput.includes(',')) {
      return /\r?\n/;
    }
    return /(?:\r?\n|,|\t)/;
  }
  if (delimiter === 'newline') return /\r?\n/;
  if (delimiter === 'comma') return /(?:\r?\n|,)/;
  return /(?:\r?\n|\t)/;
}

export function parseItems(rawInput: string, delimiter: InputDelimiter): string[] {
  return rawInput.split(getTokenSplitter(delimiter, rawInput)).map(s => s.trim()).filter(Boolean);
}

export function deduplicateItems(items: string[], mode: DedupeMode): { items: string[]; removed: number } {
  if (mode === 'none') return { items, removed: 0 };
  const seen = new Set<string>();
  const result: string[] = [];
  let removed = 0;
  for (const item of items) {
    const key = mode === 'case_insensitive' ? item.toLowerCase() : item;
    if (seen.has(key)) { removed++; continue; }
    seen.add(key);
    result.push(item);
  }
  return { items: result, removed };
}

function buildGroups(chunks: string[][]): SplitGroup[] {
  return chunks.map((chunk, i) => ({ index: i, items: chunk, label: `Batch ${i + 1} (${chunk.length} items)` }));
}

export function splitItems(items: string[], mode: SplitMode, value: number): SplitGroup[] {
  if (items.length === 0 || value < 1) return [];

  if (mode === 'items_per_group') {
    const chunks: string[][] = [];
    for (let i = 0; i < items.length; i += value) chunks.push(items.slice(i, i + value));
    return buildGroups(chunks);
  }

  if (mode === 'target_group_count') {
    const count = Math.min(value, items.length);
    const base = Math.floor(items.length / count);
    const remainder = items.length % count;
    const chunks: string[][] = [];
    let cursor = 0;
    for (let i = 0; i < count; i++) {
      const size = base + (i < remainder ? 1 : 0);
      chunks.push(items.slice(cursor, cursor + size));
      cursor += size;
    }
    return buildGroups(chunks);
  }

  // max_chars_per_group
  const chunks: string[][] = [];
  let current: string[] = [];
  let len = 0;
  for (const item of items) {
    const sep = current.length > 0 ? 1 : 0;
    if (current.length > 0 && len + sep + item.length > value) {
      chunks.push(current);
      current = [item];
      len = item.length;
    } else {
      current.push(item);
      len = current.length === 1 ? item.length : len + sep + item.length;
    }
  }
  if (current.length > 0) chunks.push(current);
  return buildGroups(chunks);
}

function escapeSql(v: string): string { return `'${v.replaceAll("'", "''")}'`; }
function escapeCsv(v: string): string { return `"${v.replaceAll('"', '""')}"`; }

export function formatBatch(items: string[], template: OutputTemplate): string {
  if (template === 'sql_in') return `(${items.map(escapeSql).join(', ')})`;
  if (template === 'quoted_csv') return items.map(escapeCsv).join(',');
  if (template === 'json_array') return JSON.stringify(items, null, 2);
  return items.join('\n');
}

export interface SplitterConfig {
  delimiter: InputDelimiter;
  mode: SplitMode;
  value: number;
  dedupe: DedupeMode;
  template: OutputTemplate;
}

export function parseConfig(raw: string): Partial<SplitterConfig> {
  const cfg: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const eq = line.indexOf('=');
    if (eq > 0) cfg[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return {
    delimiter: (['newline', 'comma', 'tab', 'auto'].includes(cfg.delimiter) ? cfg.delimiter : 'auto') as InputDelimiter,
    mode: (['items_per_group', 'max_chars_per_group', 'target_group_count'].includes(cfg.mode) ? cfg.mode : 'items_per_group') as SplitMode,
    value: parseInt(cfg.value) > 0 ? parseInt(cfg.value) : 5,
    dedupe: (['none', 'case_sensitive', 'case_insensitive'].includes(cfg.dedupe) ? cfg.dedupe : 'none') as DedupeMode,
    template: (['plain', 'sql_in', 'quoted_csv', 'json_array'].includes(cfg.template) ? cfg.template : undefined) as OutputTemplate | undefined,
  };
}

export function runSplitter(input: string, config: SplitterConfig): { output: string; meta: string } {
  const items = parseItems(input, config.delimiter);
  const { items: deduped, removed } = deduplicateItems(items, config.dedupe);
  const groups = splitItems(deduped, config.mode, config.value);

  const formatted = groups.map(g => {
    const header = `--- ${g.label} ---`;
    const body = formatBatch(g.items, config.template);
    return `${header}\n${body}`;
  }).join('\n\n');

  const parts = [`${deduped.length} items → ${groups.length} batch${groups.length !== 1 ? 'es' : ''}`];
  if (removed > 0) parts.push(`${removed} duplicates removed`);
  parts.push(`Mode: ${config.mode.replace(/_/g, ' ')}, Value: ${config.value}`);

  return { output: formatted, meta: parts.join(' | ') };
}
