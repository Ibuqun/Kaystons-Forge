import { describe, expect, it } from "vitest";
import { processTool } from "@/lib/tools/engine";

describe("tool engine", () => {
  it("formats json", async () => {
    const out = await processTool("json-format-validate", '{"a":1}', {
      action: "default",
    });
    expect(out.output).toContain("\n");
    expect(out.output).toContain('"a"');
  });

  it("minifies json", async () => {
    const out = await processTool("json-format-validate", '{"a":1, "b":2}', {
      action: "minify",
    });
    expect(out.output).toBe('{"a":1,"b":2}');
  });

  it("parses loose json", async () => {
    const out = await processTool("json-format-validate", '{a:1,"b":"test"}');
    expect(out.output).toContain('"a"');
    expect(out.output).toContain('"b"');
  });

  it("encodes and decodes base64", async () => {
    const encoded = await processTool("base64-string", "hello", {
      action: "default",
    });
    const decoded = await processTool("base64-string", encoded.output, {
      action: "decode",
    });
    expect(decoded.output).toBe("hello");
  });

  it("encodes base64 url-safe", async () => {
    const out = await processTool("base64-string", "a+b/c", {
      action: "encode-url-safe",
    });
    expect(out.output).toBe("YStiL2M");
  });

  it("parses url", async () => {
    const out = await processTool(
      "url-parser",
      "https://example.com:8080/path?a=1#hash",
    );
    expect(out.output).toContain("protocol");
    expect(out.output).toContain("hostname");
    expect(out.output).toContain("8080");
  });

  it("url encodes and decodes", async () => {
    const encoded = await processTool(
      "url-encode-decode",
      "hello world&foo=bar",
    );
    expect(encoded.output).toBe("hello%20world&foo=bar");
    const decoded = await processTool("url-encode-decode", "hello%20world", {
      action: "decode",
    });
    expect(decoded.output).toBe("hello world");
  });

  it("builds hashes", async () => {
    const out = await processTool("hash-generator", "abc", {
      action: "sha256",
    });
    expect(out.output).toHaveLength(64);
  });

  it("generates md5", async () => {
    const out = await processTool("hash-generator", "test", { action: "md5" });
    expect(out.output).toBe("098f6bcd4621d373cade4e832627b4f6");
  });

  it("generates hmac", async () => {
    const out = await processTool("hash-generator", "message", {
      action: "hmac-sha256",
      secondInput: "key",
    });
    expect(out.output).toHaveLength(64);
  });

  it("converts yaml to json", async () => {
    const out = await processTool("yaml-to-json", "name: test\nvalue: 123");
    expect(out.output).toContain('"name"');
    expect(out.output).toContain('"test"');
  });

  it("converts json to yaml", async () => {
    const out = await processTool(
      "json-to-yaml",
      '{"name":"test","value":123}',
    );
    expect(out.output).toContain("name: test");
    expect(out.output).toContain("value: 123");
  });

  it("converts csv to json", async () => {
    const out = await processTool("csv-to-json", "name,age\nJohn,30");
    expect(out.output).toContain('"name"');
    expect(out.output).toContain("John");
  });

  it("converts json to csv", async () => {
    const out = await processTool("json-to-csv", '[{"name":"John","age":30}]');
    expect(out.output).toContain("name,age");
    expect(out.output).toContain("John,30");
  });

  it("formats sql", async () => {
    const out = await processTool(
      "sql-formatter",
      "select name from users where id=1",
    );
    expect(out.output).toContain("select");
    expect(out.output).toContain("from");
    expect(out.output).toContain("where");
  });

  it("encodes and decodes html entities", async () => {
    const encoded = await processTool("html-entity", "<div>test</div>");
    expect(encoded.output).toContain("&lt;");
    const decoded = await processTool("html-entity", "&lt;div&gt;", {
      action: "decode",
    });
    expect(decoded.output).toContain("<div>");
  });

  it("escapes and unescapes backslashes", async () => {
    const escaped = await processTool("backslash-escape", "line1\nline2");
    expect(escaped.output).toContain("\\n");
    const unescaped = await processTool("backslash-escape", "line1\\nline2", {
      action: "unescape",
    });
    expect(unescaped.output).toContain("\n");
  });

  it("generates uuid/ulid", async () => {
    const out = await processTool("uuid-ulid", "");
    const lines = out.output.split("\n");
    expect(lines[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4/);
    expect(lines[2]).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it("generates lorem ipsum", async () => {
    const out = await processTool("lorem-ipsum", "2");
    expect(out.output).toContain("Lorem ipsum");
    expect(out.output.split("\n").length).toBeGreaterThan(1);
  });

  it("generates lorem words", async () => {
    const out = await processTool("lorem-ipsum", "10", { action: "words" });
    const words = out.output.split(" ").length;
    expect(words).toBe(10);
  });

  it("inspects strings", async () => {
    const out = await processTool("string-inspector", "hello");
    expect(out.output).toContain("Grapheme count: 5");
    expect(out.output).toContain("Byte length (UTF-8): 5");
  });

  it("converts number bases", async () => {
    const out = await processTool("number-base", "255|10");
    expect(out.output).toContain("Binary: 11111111");
    expect(out.output).toContain("Hex: FF");
  });

  it("parses unix timestamp", async () => {
    const out = await processTool("unix-time-converter", "1704067200");
    expect(out.output).toContain("Local:");
    expect(out.output).toContain("UTC:");
    expect(out.output).toContain("Unix Seconds: 1704067200");
  });

  it("generates html preview", async () => {
    const out = await processTool("html-preview", "<h1>Test</h1>");
    expect(out.previewHtml).toContain("<h1>Test</h1>");
  });

  it("generates markdown preview", async () => {
    const out = await processTool("markdown-preview", "# Hello");
    expect(out.previewHtml).toContain("<h1>");
    expect(out.previewHtml).toContain("Hello");
  });

  it("tests regexp", async () => {
    const out = await processTool("regexp-tester", "\\d+", {
      secondInput: "abc123def",
    });
    expect(out.output).toContain("123");
  });

  it("generates diff", async () => {
    const out = await processTool("text-diff", "line1\nline2", {
      secondInput: "line1\nline3",
    });
    expect(out.output).toContain("-");
    expect(out.output).toContain("+");
  });

  it("converts html to jsx", async () => {
    const out = await processTool("html-to-jsx", '<div class="test">Hi</div>');
    expect(out.output).toContain("className");
    expect(out.output).not.toContain('class="');
  });

  it("beautifies and minifies xml", async () => {
    const beautified = await processTool(
      "xml-beautify",
      "<root><item>v</item></root>",
    );
    expect(beautified.output).toContain("\n");
    const minified = await processTool(
      "xml-beautify",
      "<root><item>v</item></root>",
      { action: "minify" },
    );
    expect(minified.output).toBe("<root><item>v</item></root>");
  });

  it("minifies js", async () => {
    const out = await processTool(
      "js-beautify",
      "function test() { const x = 1; return x; }",
      { action: "minify" },
    );
    expect(out.output).toBe("function test(){return 1}");
  });

  it("parses jwt", async () => {
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.signature";
    const out = await processTool("jwt-debugger", token);
    expect(out.output).toContain("Header:");
    expect(out.output).toContain("Payload:");
    expect(out.output).toContain("alg");
    expect(out.output).toContain("sub");
  });

  it("decodes ulid time", async () => {
    const out = await processTool("uuid-ulid", "01ARZ3NDEKTSV4RRFFQ69G5FAV", {
      action: "decode-ulid",
    });
    expect(out.output).toContain("2016");
  });

  it("php: unserializes string", async () => {
    const out = await processTool("php-unserializer", 's:5:"hello";');
    expect(out.output).toBe('"hello"');
  });

  it("php: unserializes array", async () => {
    const out = await processTool(
      "php-unserializer",
      'a:2:{s:4:"name";s:5:"Alice";s:3:"age";i:30;}',
    );
    expect(out.output).toContain('"name"');
    expect(out.output).toContain('"Alice"');
  });

  it("php: serializes json", async () => {
    const out = await processTool("php-serializer", '{"name":"Alice","age":30}');
    expect(out.output).toContain('s:4:"name"');
    expect(out.output).toContain('s:5:"Alice"');
    expect(out.output).toContain("i:30");
  });

  it("php: json-to-php array syntax", async () => {
    const out = await processTool("json-to-php", '{"name":"Alice","age":30}', {
      action: "to-array",
    });
    expect(out.output).toContain("'name'");
    expect(out.output).toContain("'Alice'");
    expect(out.output).toContain("30");
  });

  it("php: php-to-json from serialized", async () => {
    const out = await processTool(
      "php-to-json",
      'a:1:{s:3:"foo";s:3:"bar";}',
    );
    expect(out.output).toContain('"foo"');
    expect(out.output).toContain('"bar"');
  });

  it("curl: converts to javascript fetch", async () => {
    const out = await processTool(
      "curl-to-code",
      "curl -X POST https://api.example.com/users -H \"Content-Type: application/json\" -d '{\"name\":\"Alice\"}'",
      { action: "javascript" },
    );
    expect(out.output).toContain("fetch");
    expect(out.output).toContain("https://api.example.com/users");
    expect(out.output).toContain("POST");
  });

  it("curl: converts to python requests", async () => {
    const out = await processTool(
      "curl-to-code",
      "curl https://api.example.com/data",
      { action: "python" },
    );
    expect(out.output).toContain("requests");
    expect(out.output).toContain("https://api.example.com/data");
  });

  it("json-to-code: generates typescript interfaces", async () => {
    const out = await processTool(
      "json-to-code",
      '{"id":1,"name":"Alice","active":true}',
      { action: "typescript" },
    );
    expect(out.output).toContain("interface");
    expect(out.output).toContain("id:");
    expect(out.output).toContain("name:");
    expect(out.output).toContain("active:");
  });

  it("json-to-code: generates python dataclass", async () => {
    const out = await processTool(
      "json-to-code",
      '{"id":1,"name":"Alice"}',
      { action: "python" },
    );
    expect(out.output).toContain("@dataclass");
    expect(out.output).toContain("id:");
    expect(out.output).toContain("name:");
  });

  it("cert-decoder: reports invalid input gracefully", async () => {
    const out = await processTool("cert-decoder", "not a certificate");
    expect(out.output).toContain("Invalid");
  });

  it("cert-decoder: accepts PEM header", async () => {
    const pem = `-----BEGIN CERTIFICATE-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2a2rwplBQLzHPZe5TNJF
-----END CERTIFICATE-----`;
    const out = await processTool("cert-decoder", pem);
    expect(out.output).not.toBe("Tool not implemented.");
  });

  it("string-case: converts to snake_case", async () => {
    const out = await processTool("string-case", "helloWorldFromForge", { action: "snake" });
    expect(out.output).toBe("hello_world_from_forge");
  });

  it("string-case: converts to kebab-case", async () => {
    const out = await processTool("string-case", "Hello World", { action: "kebab" });
    expect(out.output).toBe("hello-world");
  });

  it("cron-parser: returns human readable", async () => {
    const out = await processTool("cron-parser", "0 9 * * 1-5");
    expect(out.output).toContain("9:00 AM");
    expect(out.output.toLowerCase()).toContain("monday");
  });

  it("color-converter: converts hex to all formats", async () => {
    const out = await processTool("color-converter", "#ff0000");
    expect(out.output).toContain("rgb(255, 0, 0)");
    expect(out.output).toContain("hsl(0,");
  });

  it("color-converter: converts rgb to hex", async () => {
    const out = await processTool("color-converter", "rgb(255, 0, 0)", { action: "to-hex" });
    expect(out.output.toLowerCase()).toContain("ff0000");
  });

  it("random-string: generates alphanumeric string", async () => {
    const out = await processTool("random-string", "16", { secondInput: "length=16\ncount=1" });
    expect(out.output).toMatch(/^[A-Za-z0-9]+$/);
    expect(out.output).toHaveLength(16);
  });

  it("svg-to-css: generates base64 background-image", async () => {
    const out = await processTool("svg-to-css", '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"/></svg>');
    expect(out.output).toContain("background-image");
    expect(out.output).toContain("base64");
  });

  it("hex-to-ascii: converts hex bytes to text", async () => {
    const out = await processTool("hex-to-ascii", "48 65 6c 6c 6f");
    expect(out.output).toBe("Hello");
  });

  it("ascii-to-hex: converts text to hex bytes", async () => {
    const out = await processTool("ascii-to-hex", "Hello");
    expect(out.output).toBe("48 65 6c 6c 6f");
  });

  it("line-sort: sorts ascending", async () => {
    const out = await processTool("line-sort", "banana\napple\ncherry");
    expect(out.output).toBe("apple\nbanana\ncherry");
  });

  it("line-sort: deduplicates lines", async () => {
    const out = await processTool("line-sort", "apple\nbanana\napple", { action: "dedupe" });
    const lines = out.output.split("\n");
    expect(lines.filter(l => l.toLowerCase() === "apple")).toHaveLength(1);
  });

  it("curl-to-code: converts to php", async () => {
    const out = await processTool("curl-to-code", "curl https://example.com/api", { action: "php" });
    expect(out.output).toContain("curl_init");
    expect(out.output).toContain("example.com");
  });

  it("json-to-code: generates go struct", async () => {
    const out = await processTool("json-to-code", '{"id":1,"name":"Alice"}', { action: "go" });
    expect(out.output).toContain("struct");
    expect(out.output).toContain("Id");
    expect(out.output).toContain("Name");
  });

  it("cert-decoder: invalid cert returns error message", async () => {
    const out = await processTool("cert-decoder", "invalid data");
    expect(out.output).toContain("Invalid");
  });
});
