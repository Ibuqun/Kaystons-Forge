interface PhpArray extends Array<PhpValue> {}
interface PhpRecord extends Record<string, PhpValue> {}
type PhpValue = null | boolean | number | string | PhpArray | PhpRecord;

// ─── Deserialize ────────────────────────────────────────────────────────────

export function phpUnserialize(input: string): PhpValue {
  const text = input.trim();
  let pos = 0;

  function read(n: number): string {
    const s = text.slice(pos, pos + n);
    pos += n;
    return s;
  }

  function readUntil(char: string): string {
    const start = pos;
    while (pos < text.length && text[pos] !== char) pos++;
    const result = text.slice(start, pos);
    pos++; // skip delimiter
    return result;
  }

  function parse(): PhpValue {
    const type = text[pos++];
    if (pos < text.length && text[pos] === ':') pos++; // skip ':'

    switch (type) {
      case 'N': {
        pos++; // skip ';'
        return null;
      }
      case 'b': {
        const val = readUntil(';');
        return val === '1';
      }
      case 'i': {
        const val = readUntil(';');
        return parseInt(val, 10);
      }
      case 'd': {
        const val = readUntil(';');
        return parseFloat(val);
      }
      case 's': {
        const len = parseInt(readUntil(':'));
        pos++; // skip opening "
        const str = read(len);
        pos += 2; // skip ";
        return str;
      }
      case 'a': {
        const count = parseInt(readUntil(':'));
        pos++; // skip '{'
        const result: Record<string, PhpValue> = {};
        for (let i = 0; i < count; i++) {
          const key = parse() as string | number;
          const value = parse();
          result[String(key)] = value;
        }
        pos++; // skip '}'
        const keys = Object.keys(result);
        const isSequential = keys.every((k, i) => k === String(i));
        return isSequential ? Object.values(result) : result;
      }
      case 'O': {
        const classLen = parseInt(readUntil(':'));
        pos++; // skip '"'
        const className = read(classLen);
        pos += 2; // skip '":'
        const count = parseInt(readUntil(':'));
        pos++; // skip '{'
        const result: Record<string, PhpValue> = { __class: className };
        for (let i = 0; i < count; i++) {
          const key = parse() as string | number;
          const value = parse();
          result[String(key)] = value;
        }
        pos++; // skip '}'
        return result;
      }
      default:
        throw new Error(`Unknown PHP serialize type '${type}' at position ${pos}`);
    }
  }

  // 'N;' is the only type that doesn't follow 'type:...' format
  if (text === 'N;') return null;
  return parse();
}

// ─── Serialize ───────────────────────────────────────────────────────────────

export function phpSerialize(value: PhpValue): string {
  if (value === null) return 'N;';
  if (typeof value === 'boolean') return `b:${value ? 1 : 0};`;
  if (typeof value === 'number') {
    return Number.isInteger(value) ? `i:${value};` : `d:${value};`;
  }
  if (typeof value === 'string') {
    const byteLen = new TextEncoder().encode(value).length;
    return `s:${byteLen}:"${value}";`;
  }
  if (Array.isArray(value)) {
    const items = value.map((v, i) => `i:${i};${phpSerialize(v)}`).join('');
    return `a:${value.length}:{${items}}`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    const items = entries
      .map(([k, v]) => {
        const key = /^\d+$/.test(k)
          ? `i:${parseInt(k)};`
          : `s:${new TextEncoder().encode(k).length}:"${k}";`;
        return key + phpSerialize(v);
      })
      .join('');
    return `a:${entries.length}:{${items}}`;
  }
  return 'N;';
}

// ─── PHP Array Syntax ────────────────────────────────────────────────────────

export function phpArraySyntax(value: PhpValue, indent = 0): string {
  const pad = '    '.repeat(indent);
  const inner = '    '.repeat(indent + 1);

  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value
      .map((v) => `${inner}${phpArraySyntax(v, indent + 1)}`)
      .join(',\n');
    return `[\n${items},\n${pad}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '[]';
    const items = entries
      .map(([k, v]) => {
        const key = /^\d+$/.test(k) ? k : `'${k}'`;
        return `${inner}${key} => ${phpArraySyntax(v, indent + 1)}`;
      })
      .join(',\n');
    return `[\n${items},\n${pad}]`;
  }
  return 'null';
}

// ─── Parse PHP Array Syntax ──────────────────────────────────────────────────

export function parsePhpArraySyntax(input: string): PhpValue {
  const text = input.trim();
  let pos = 0;

  function skip() {
    while (pos < text.length && /\s/.test(text[pos])) pos++;
  }

  function parseVal(): PhpValue {
    skip();
    const ch = text[pos];

    if (text.startsWith('null', pos)) { pos += 4; return null; }
    if (text.startsWith('true', pos)) { pos += 4; return true; }
    if (text.startsWith('false', pos)) { pos += 5; return false; }

    // Number
    if (ch === '-' || (ch >= '0' && ch <= '9')) {
      const start = pos;
      if (text[pos] === '-') pos++;
      while (pos < text.length && /[\d.]/.test(text[pos])) pos++;
      const num = text.slice(start, pos);
      return num.includes('.') ? parseFloat(num) : parseInt(num, 10);
    }

    // Quoted string
    if (ch === "'" || ch === '"') {
      const q = text[pos++];
      let str = '';
      while (pos < text.length && text[pos] !== q) {
        if (text[pos] === '\\') { pos++; str += text[pos] ?? ''; }
        else str += text[pos];
        pos++;
      }
      pos++; // closing quote
      return str;
    }

    // Array: [...] or array(...)
    const isShortArray = ch === '[';
    const isLongArray = text.startsWith('array(', pos);
    if (isShortArray || isLongArray) {
      pos += isShortArray ? 1 : 6;
      const close = isShortArray ? ']' : ')';
      const result: Record<string, PhpValue> = {};
      let idx = 0;
      skip();
      while (pos < text.length && text[pos] !== close) {
        const val = parseVal();
        skip();
        if (text.startsWith('=>', pos)) {
          pos += 2;
          skip();
          result[String(val)] = parseVal();
        } else {
          result[String(idx++)] = val;
        }
        skip();
        if (text[pos] === ',') pos++;
        skip();
      }
      pos++; // skip close
      const keys = Object.keys(result);
      return keys.every((k, i) => k === String(i)) ? Object.values(result) : result;
    }

    throw new Error(`Unexpected token at position ${pos}: "${text.slice(pos, pos + 20)}"`);
  }

  return parseVal();
}
