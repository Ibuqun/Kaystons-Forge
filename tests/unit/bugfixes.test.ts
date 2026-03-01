import { describe, expect, it } from 'vitest';
import { processTool } from '@/lib/tools/engine';

describe('fix #1: hash-generator SHA-256 no longer becomes HMAC', () => {
  it('sha256 with key still produces SHA-256, not HMAC', async () => {
    const withoutKey = await processTool('hash-generator', 'test', { action: 'sha256' });
    const withKey = await processTool('hash-generator', 'test', { action: 'sha256', secondInput: 'mykey' });
    expect(withKey.output).toBe(withoutKey.output);
    expect(withKey.output).toBe('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
  });

  it('hmac-sha256 action works explicitly', async () => {
    const out = await processTool('hash-generator', 'message', { action: 'hmac-sha256', secondInput: 'key' });
    expect(out.output).toHaveLength(64);
    expect(out.meta).toContain('HMAC-SHA256');
  });
});

describe('fix #2: HTML beautify now handles HTML tags', () => {
  it('beautifies HTML with proper indentation', async () => {
    const input = '<html><head><title>Test</title></head><body><div>Hello</div></body></html>';
    const out = await processTool('html-beautify', input);
    expect(out.output).toContain('\n');
    expect(out.output).toContain('  '); // indentation
  });

  it('minifies HTML properly', async () => {
    const input = '<div>\n  <p>hello</p>\n  <span>world</span>\n</div>';
    const out = await processTool('html-beautify', input, { action: 'minify' });
    expect(out.output).toBe('<div><p>hello</p><span>world</span></div>');
  });
});

describe('fix #3: markdown preview XSS sanitized', () => {
  it('strips script tags from markdown output', async () => {
    const out = await processTool('markdown-preview', '<script>alert("xss")</script>');
    expect(out.previewHtml).not.toContain('<script>');
  });

  it('strips event handlers', async () => {
    const out = await processTool('markdown-preview', '<img src=x onerror="alert(1)">');
    expect(out.previewHtml).not.toContain('onerror');
  });

  it('blocks javascript: URLs', async () => {
    const out = await processTool('markdown-preview', '<a href="javascript:alert(1)">click</a>');
    expect(out.previewHtml).not.toContain('javascript:');
  });
});

describe('fix #4: base64 image XSS via attribute injection', () => {
  it('escapes malicious input in previewHtml', async () => {
    const malicious = '" onerror="alert(1)" data-x="';
    const out = await processTool('base64-image', malicious);
    if (out.previewHtml) {
      // Quotes must be escaped so the attribute can't break out
      expect(out.previewHtml).toContain('&quot;');
      expect(out.previewHtml).not.toContain('onerror="alert');
    }
  });
});

describe('fix #5: unix time converter empty input', () => {
  it('returns error for empty input', async () => {
    const out = await processTool('unix-time-converter', '');
    expect(out.output).toContain('Invalid');
  });

  it('returns error for whitespace-only input', async () => {
    const out = await processTool('unix-time-converter', '   ');
    expect(out.output).toContain('Invalid');
  });

  it('still works for valid timestamps', async () => {
    const out = await processTool('unix-time-converter', '1704067200');
    expect(out.output).toContain('Unix Seconds: 1704067200');
  });
});

describe('fix #6: JSON loose parser apostrophe handling', () => {
  it('handles unquoted keys with double-quoted values containing apostrophes', async () => {
    const out = await processTool('json-format-validate', '{name: "it\'s a test"}');
    expect(out.output).not.toContain('parse error');
    expect(out.output).toContain("it's a test");
  });

  it('handles single-quoted string values', async () => {
    const out = await processTool('json-format-validate', "{name: 'hello'}");
    expect(out.output).toContain('"hello"');
  });
});

describe('fix #7: CSS/LESS/SCSS beautify quality', () => {
  it('beautifies CSS with proper indentation', async () => {
    const input = '.container{max-width:720px;margin:0 auto;}';
    const out = await processTool('css-beautify', input);
    expect(out.output).toContain('\n');
    expect(out.output).toContain('  ');
  });

  it('minifies CSS removing whitespace', async () => {
    const input = '.a {\n  color: red;\n}\n.b {\n  color: blue;\n}';
    const out = await processTool('css-beautify', input, { action: 'minify' });
    expect(out.output).not.toContain('\n');
  });

  it('beautifies LESS', async () => {
    const out = await processTool('less-beautify', '.parent{.child{color:red;}}');
    expect(out.output).toContain('\n');
  });

  it('beautifies SCSS', async () => {
    const out = await processTool('scss-beautify', '$color:red;.test{color:$color;}');
    expect(out.output).toContain('\n');
  });
});

describe('fix: JS beautify quality', () => {
  it('beautifies JS with proper indentation', async () => {
    const out = await processTool('js-beautify', 'function test(){const x=1;return x;}', { action: 'default' });
    expect(out.output).toContain('\n');
    expect(out.output).toContain('  ');
  });
});

describe('Codex fix #1: Algorithmic DoS in List Compare', () => {
  it('does not freeze on massive fuzzy matching inputs due to length limits', async () => {
    const { compareLists } = await import('@/lib/tools/list-compare');
    const listA = Array.from({ length: 500 }, (_, i) => `long_string_a_${i}_` + 'a'.repeat(600));
    const listB = Array.from({ length: 500 }, (_, i) => `long_string_b_${i}_` + 'b'.repeat(600));
    const start = Date.now();
    const result = compareLists(listA, listB, { caseSensitive: false, fuzzyMatch: true, fuzzyDistance: 2 });
    const end = Date.now();
    expect(end - start).toBeLessThan(1000); // Should resolve quickly, ignoring the long strings
    expect(result.intersection.length).toBe(0);
  });
});

describe('Codex fix #2: Negative Unix Timestamps', () => {
  it('calculates negative timestamps precisely for seconds and milliseconds', async () => {
    // Length is 11, should still be treated as seconds because absolute length is 10.
    const outSeconds = await processTool('unix-time-converter', '-1704067200');
    expect(outSeconds.output).toContain('1916'); // roughly 1915/1916 depending on UTC
    expect(outSeconds.output).toContain('Unix Seconds: -1704067200');

    // Milliseconds example
    const outMilli = await processTool('unix-time-converter', '-1704067200000');
    expect(outMilli.output).toContain('Unix Seconds: -1704067200');
  });
});

describe('Codex fix #3: Multiple Document Support in YAML', () => {
  it('parses multiple docs joined by ---', async () => {
    const out = await processTool('yaml-to-json', 'a: 1\n---\nb: 2');
    expect(out.output).toContain('"a": 1');
    expect(out.output).toContain('"b": 2');
    expect(out.output).toContain('['); // Root should be array
    expect(out.output).toContain(']');
  });

  it('parses single doc as object not array', async () => {
    const out = await processTool('yaml-to-json', 'a: 1');
    expect(out.output).not.toContain('[');
  });
});

describe('Codex fix #4: Hex Color Alpha Channel', () => {
  it('preserves alpha for 8-digit hex', async () => {
    const out = await processTool('color-converter', '#ff000088');
    expect(out.output).toContain('rgba(255, 0, 0, 0.53'); // 0x88 is ~0.53
    expect(out.output).toContain('hsla(0, 100%, 50%, 0.53');
  });

  it('outputs regular hex if no alpha', async () => {
    const out = await processTool('color-converter', '#ff0000');
    expect(out.output).not.toContain('rgba');
  });
});

describe('Codex fix #5: URL Decoder + Corruption', () => {
  it('keeps plus symbols when standard decoding', async () => {
    const out = await processTool('url-encode-decode', 'hello+world%2Bplus', { action: 'decode' });
    expect(out.output).toBe('hello+world+plus');
  });

  it('converts plus symbols to space when form decoding', async () => {
    const out = await processTool('url-encode-decode', 'hello+world%2Bplus', { action: 'form-decode' });
    expect(out.output).toBe('hello world+plus');
  });
});

describe('Codex fix #6: Loose JSON Parser ReDoS & Functionality', () => {
  it('parses valid loose JSON rapidly without freezing', async () => {
    const out = await processTool('json-format-validate', "{a: 'hello \\\\" + "a".repeat(1000) + "'}");
    expect(out.output).toContain('"a"');
  });

  it('blocks dangerous functions', async () => {
    const out = await processTool('json-format-validate', "{a: () => alert(1)}");
    expect(out.output).toContain('error');
    expect(out.output).not.toContain('alert');
  });
});
