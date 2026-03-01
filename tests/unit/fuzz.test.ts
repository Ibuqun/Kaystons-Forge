import { describe, it, expect } from 'vitest';
import { phpUnserialize, phpSerialize, parsePhpArraySyntax } from '@/lib/tools/php-tools';
import { curlToJs, curlToPython, curlToPhp } from '@/lib/tools/curl-to-code';
import { processTool } from '@/lib/tools/engine';

// ─── PHP Unserialize ──────────────────────────────────────────────────────────

describe('phpUnserialize — malformed inputs should throw', () => {
  const BAD_INPUTS: [string, string][] = [
    ['empty string', ''],
    ['truncated null', 'N'],
    ['truncated bool', 'b:'],
    ['truncated int', 'i:'],
    ['truncated float', 'd:'],
    ['string len > actual content', 's:99:"hi";'],
    ['negative string length', 's:-1:"";'],
    ['array count mismatch', 'a:3:{s:1:"a";i:1;}'],
    ['truncated object', 'O:99:'],
    ['unknown type Z', 'Z:1;'],
    ['html injection attempt', '<script>alert(1)</script>'],
    ['array missing braces', 'a:0:'],
    ['absurdly large length', `s:${'9'.repeat(15)}:"x";`],
    ['multiple values (trailing garbage)', 'i:1;i:2;'],
  ];

  it.each(BAD_INPUTS)('%s', (_label, input) => {
    expect(() => phpUnserialize(input)).toThrow();
  });
});

describe('phpUnserialize — edge cases that should NOT throw', () => {
  it('null literal N;', () => {
    expect(phpUnserialize('N;')).toBeNull();
  });

  it('empty array a:0:{}', () => {
    expect(phpUnserialize('a:0:{}')).toEqual([]);
  });

  it('bool true b:1;', () => {
    expect(phpUnserialize('b:1;')).toBe(true);
  });

  it('bool false b:0;', () => {
    expect(phpUnserialize('b:0;')).toBe(false);
  });

  it('zero integer i:0;', () => {
    expect(phpUnserialize('i:0;')).toBe(0);
  });

  it('negative integer i:-42;', () => {
    expect(phpUnserialize('i:-42;')).toBe(-42);
  });

  it('empty string s:0:"";', () => {
    expect(phpUnserialize('s:0:"";')).toBe('');
  });
});

// ─── PHP Serialize round-trip ─────────────────────────────────────────────────

describe('phpSerialize → phpUnserialize round-trip', () => {
  const ROUND_TRIP_CASES = [
    null,
    true,
    false,
    0,
    -1,
    42,
    3.14,
    '',
    'hello',
    "with \"quotes\" and 'apostrophes'",
    [],
    [1, 2, 3],
    ['a', 'b', 'c'],
    { key: 'value' },
    [null, false, 0, ''],
  ];

  it.each(ROUND_TRIP_CASES)('round-trips %j', (value) => {
    const serialized = phpSerialize(value);
    const deserialized = phpUnserialize(serialized);
    expect(deserialized).toEqual(value);
  });
});

// ─── PHP Array Syntax Parser ──────────────────────────────────────────────────

describe('parsePhpArraySyntax — malformed inputs should throw', () => {
  const BAD_PHP_ARRAY: [string, string][] = [
    ['empty string', ''],
    ['unclosed bracket', '[1, 2, 3'],
    ["unterminated string", "'unclosed"],
    ['dangling arrow', '[1 => ]'],
    ['only arrow', '=>'],
    ['unclosed nested', '["a" => ["b"'],
  ];

  it.each(BAD_PHP_ARRAY)('%s', (_label, input) => {
    expect(() => parsePhpArraySyntax(input)).toThrow();
  });
});

describe('parsePhpArraySyntax — edge cases that should NOT throw', () => {
  it('empty array []', () => {
    expect(parsePhpArraySyntax('[]')).toEqual([]);
  });

  it('null literal', () => {
    expect(parsePhpArraySyntax('null')).toBeNull();
  });

  it('true literal', () => {
    expect(parsePhpArraySyntax('true')).toBe(true);
  });

  it('negative number', () => {
    expect(parsePhpArraySyntax('-42')).toBe(-42);
  });
});

// ─── cURL to Code ─────────────────────────────────────────────────────────────

describe('curlToJs — edge cases should not throw', () => {
  it('empty string produces valid fetch call', () => {
    const result = curlToJs('');
    expect(result).toContain('fetch(');
    expect(result).toContain('method:');
  });

  it('URL only (no curl prefix)', () => {
    const result = curlToJs('https://example.com/api');
    expect(result).toContain('https://example.com/api');
    expect(result).toContain('"GET"');
  });

  it('curl with URL only', () => {
    const result = curlToJs('curl https://example.com');
    expect(result).toContain('https://example.com');
  });

  it('-d flag switches to POST', () => {
    const result = curlToJs("curl https://example.com -d '{\"x\":1}'");
    expect(result).toContain('"POST"');
  });

  it('empty header value does not crash', () => {
    expect(() => curlToJs('curl -H "Content-Type:" https://example.com')).not.toThrow();
  });

  it('unterminated quoted string does not crash', () => {
    expect(() => curlToJs("curl 'https://example.com")).not.toThrow();
  });

  it('header with no colon does not crash', () => {
    expect(() => curlToJs('curl -H "NoColonHeader" https://example.com')).not.toThrow();
  });

  it('very long URL does not crash', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2000);
    expect(() => curlToJs(`curl ${longUrl}`)).not.toThrow();
  });
});

describe('curlToPython — edge cases should not throw', () => {
  it('empty string', () => {
    expect(() => curlToPython('')).not.toThrow();
  });

  it('auth flag -u user:pass', () => {
    const result = curlToPython('curl -u user:pass https://example.com');
    expect(result).toContain('auth=');
    expect(result).toContain('"user"');
  });

  it('auth with no password (user only)', () => {
    const result = curlToPython('curl -u user https://example.com');
    expect(result).toContain('auth=');
  });
});

describe('curlToPhp — edge cases should not throw', () => {
  it('empty string', () => {
    expect(() => curlToPhp('')).not.toThrow();
  });

  it('multiple headers', () => {
    const result = curlToPhp('curl -H "Accept: application/json" -H "X-Api-Key: abc123" https://example.com');
    expect(result).toContain('CURLOPT_HTTPHEADER');
    expect(result).toContain('Accept: application/json');
    expect(result).toContain('X-Api-Key: abc123');
  });
});

// ─── Cert Decoder (via engine) ────────────────────────────────────────────────

describe('cert-decoder tool — malformed inputs should return error message', () => {
  it('empty string returns error', () => {
    const result = processTool('cert-decoder', '', {});
    expect(result.output.toLowerCase()).toMatch(/error|invalid|no certificate|empty/);
  });

  it('plain text (not PEM) returns error', () => {
    const result = processTool('cert-decoder', 'hello world', {});
    expect(result.output.toLowerCase()).toMatch(/error|invalid|no certificate|pem/);
  });

  it('PEM with wrong type does not throw uncaught exception', () => {
    const fakePem = '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA\n-----END RSA PRIVATE KEY-----';
    expect(() => processTool('cert-decoder', fakePem, {})).not.toThrow();
  });

  it('PEM header/footer with no body returns error', () => {
    const emptyPem = '-----BEGIN CERTIFICATE-----\n-----END CERTIFICATE-----';
    const result = processTool('cert-decoder', emptyPem, {});
    expect(result.output.toLowerCase()).toMatch(/error|invalid|empty/);
  });

  it('truncated base64 in PEM does not throw', () => {
    const truncated = '-----BEGIN CERTIFICATE-----\nMIIBIjANBgkq\n-----END CERTIFICATE-----';
    expect(() => processTool('cert-decoder', truncated, {})).not.toThrow();
  });
});

// ─── Regex tool (via engine) ──────────────────────────────────────────────────

describe('regex tool — adversarial inputs should not throw', () => {
  it('invalid regex pattern does not throw', () => {
    expect(() => processTool('regex-tester', 'test', { pattern: 'unclosed( group', flags: 'g' })).not.toThrow();
  });

  it('very large input does not throw', () => {
    const bigInput = 'a'.repeat(50_000);
    expect(() => processTool('regex-tester', bigInput, { pattern: 'a', flags: 'g' })).not.toThrow();
  });

  it('empty pattern does not throw', () => {
    expect(() => processTool('regex-tester', 'test input', { pattern: '' })).not.toThrow();
  });
});

// ─── Line Sort (via engine) ───────────────────────────────────────────────────

describe('line-sort tool — robustness', () => {
  it('very large input does not throw', () => {
    const lines = Array.from({ length: 10_000 }, (_, i) => `line${i}`).join('\n');
    expect(() => processTool('line-sort', lines, { action: 'sort-asc', dedupe: true })).not.toThrow();
  });

  it('all duplicate lines with dedupe=true returns one line', () => {
    const result = processTool('line-sort', 'apple\napple\napple', { action: 'sort-asc', dedupe: true });
    expect(result.output.trim()).toBe('apple');
  });

  it('empty input returns empty output', () => {
    const result = processTool('line-sort', '', { action: 'sort-asc', dedupe: false });
    expect(result.output).toBe('');
  });

  it('single line returns same line', () => {
    const result = processTool('line-sort', 'hello', { action: 'sort-asc', dedupe: false });
    expect(result.output.trim()).toBe('hello');
  });

  it('mixed case dedupe preserves first-seen casing', () => {
    const result = processTool('line-sort', 'Apple\napple\nAPPLE', { action: 'sort-asc', dedupe: true });
    const lines = result.output.trim().split('\n').filter(Boolean);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('Apple');
  });
});
