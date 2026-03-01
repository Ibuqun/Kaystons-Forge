// Extracted and adapted from Vennom — list comparison engine

export interface CompareOptions {
  caseSensitive: boolean;
  fuzzyMatch: boolean;
  fuzzyDistance: number;
}

export interface CompareResult {
  intersection: string[];
  onlyA: string[];
  onlyB: string[];
  union: string[];
  stats: {
    sizeA: number;
    sizeB: number;
    intersection: number;
    union: number;
    onlyA: number;
    onlyB: number;
    jaccard: number;
  };
}

function normalize(item: string, caseSensitive: boolean): string {
  const trimmed = item.trim();
  return caseSensitive ? trimmed : trimmed.toLowerCase();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[b.length][a.length];
}

function detectDelimiter(raw: string): 'newline' | 'comma' | 'semicolon' | 'tab' {
  const counts = {
    newline: (raw.match(/\n/g) ?? []).length,
    comma: (raw.match(/,/g) ?? []).length,
    semicolon: (raw.match(/;/g) ?? []).length,
    tab: (raw.match(/\t/g) ?? []).length,
  };
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as 'newline') || 'newline';
}

const DELIMITERS: Record<string, string | RegExp> = {
  newline: /\r?\n/,
  comma: ',',
  semicolon: ';',
  tab: '\t',
};

export function splitItems(raw: string): string[] {
  if (!raw.trim()) return [];
  const mode = detectDelimiter(raw);
  return raw.split(DELIMITERS[mode]).map(s => s.trim()).filter(Boolean);
}

export function compareLists(listA: string[], listB: string[], opts: CompareOptions): CompareResult {
  const normA = listA.map(i => normalize(i, opts.caseSensitive)).filter(Boolean);
  const normB = listB.map(i => normalize(i, opts.caseSensitive)).filter(Boolean);

  // Maps from normalized → first-seen original (trimmed) for case-preserving output
  const origA = new Map<string, string>();
  const origB = new Map<string, string>();
  listA.forEach(i => { const n = normalize(i, opts.caseSensitive); if (n && !origA.has(n)) origA.set(n, i.trim()); });
  listB.forEach(i => { const n = normalize(i, opts.caseSensitive); if (n && !origB.has(n)) origB.set(n, i.trim()); });

  const setA = new Set(normA);
  const setB = new Set(normB);

  // Fuzzy matching
  const fuzzyPairs = new Map<string, string>();
  // Lower the threshold significantly to prevent UI thread lockup. 25k is much safer.
  if (opts.fuzzyMatch && setA.size * setB.size <= 25_000) {
    const arrB = [...setB];
    for (const a of setA) {
      if (setB.has(a)) continue;
      // Do not attempt fuzzy matching on absurdly long strings
      if (a.length > 500) continue;

      for (const b of arrB) {
        if (b.length > 500) continue;
        if (Math.abs(b.length - a.length) > opts.fuzzyDistance + 1) continue;
        if (levenshtein(a, b) <= opts.fuzzyDistance) { fuzzyPairs.set(a, b); break; }
      }
    }
  }

  const intersection: string[] = [];
  const onlyA: string[] = [];
  const usedB = new Set<string>();

  for (const a of setA) {
    const original = origA.get(a) ?? a;
    if (setB.has(a)) { intersection.push(original); usedB.add(a); }
    else if (fuzzyPairs.has(a)) { intersection.push(original); usedB.add(fuzzyPairs.get(a)!); }
    else onlyA.push(original);
  }

  const onlyB = [...setB].filter(b => !usedB.has(b) && !setA.has(b)).map(b => origB.get(b) ?? b);
  const union = [...new Set([...setA, ...setB])].sort((a, b) => a.localeCompare(b)).map(n => origA.get(n) ?? origB.get(n) ?? n);

  const unionSize = union.length;
  const intSize = intersection.length;

  return {
    intersection: intersection.sort(),
    onlyA: onlyA.sort(),
    onlyB: onlyB.sort(),
    union,
    stats: {
      sizeA: setA.size,
      sizeB: setB.size,
      intersection: intSize,
      union: unionSize,
      onlyA: onlyA.length,
      onlyB: onlyB.length,
      jaccard: unionSize === 0 ? 0 : intSize / unionSize,
    },
  };
}

export function runListCompare(
  inputA: string, inputB: string, action: string
): { output: string; meta: string } {
  const listA = splitItems(inputA);
  const listB = splitItems(inputB);
  const result = compareLists(listA, listB, { caseSensitive: false, fuzzyMatch: false, fuzzyDistance: 2 });

  let output: string;
  switch (action) {
    case 'only-a':
      output = result.onlyA.join('\n');
      break;
    case 'only-b':
      output = result.onlyB.join('\n');
      break;
    case 'union':
      output = result.union.join('\n');
      break;
    case 'stats':
      output = [
        `List A:        ${result.stats.sizeA} unique items`,
        `List B:        ${result.stats.sizeB} unique items`,
        `Intersection:  ${result.stats.intersection} items`,
        `Only in A:     ${result.stats.onlyA} items`,
        `Only in B:     ${result.stats.onlyB} items`,
        `Union:         ${result.stats.union} items`,
        `Jaccard Index: ${(result.stats.jaccard * 100).toFixed(1)}%`,
      ].join('\n');
      break;
    default: // intersection
      output = result.intersection.join('\n');
      break;
  }

  const meta = `A: ${result.stats.sizeA} | B: ${result.stats.sizeB} | Intersection: ${result.stats.intersection} | Jaccard: ${(result.stats.jaccard * 100).toFixed(1)}%`;
  return { output, meta };
}
