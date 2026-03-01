interface CurlParsed {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string | null;
  auth: string | null;
}

function tokenize(line: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (/\s/.test(line[i])) { i++; continue; }
    if (line[i] === '"' || line[i] === "'") {
      const q = line[i++];
      let tok = '';
      while (i < line.length && line[i] !== q) {
        if (line[i] === '\\') { i++; tok += line[i] ?? ''; }
        else tok += line[i];
        i++;
      }
      i++; // skip closing quote
      tokens.push(tok);
    } else {
      let tok = '';
      while (i < line.length && !/\s/.test(line[i])) tok += line[i++];
      tokens.push(tok);
    }
  }
  return tokens;
}

function parseCurl(input: string): CurlParsed {
  const line = input.replace(/\\\n\s*/g, ' ').trim();
  const tokens = tokenize(line);
  let method = 'GET';
  let url = '';
  const headers: Record<string, string> = {};
  let body: string | null = null;
  let auth: string | null = null;

  let j = 1; // skip 'curl'
  while (j < tokens.length) {
    const tok = tokens[j];
    if (tok === '-X' || tok === '--request') {
      method = tokens[++j] ?? 'GET';
    } else if (tok === '-H' || tok === '--header') {
      const h = tokens[++j] ?? '';
      const colon = h.indexOf(':');
      if (colon > 0) headers[h.slice(0, colon).trim()] = h.slice(colon + 1).trim();
    } else if (tok === '-d' || tok === '--data' || tok === '--data-raw' || tok === '--data-binary') {
      body = tokens[++j] ?? '';
      if (method === 'GET') method = 'POST';
    } else if (tok === '--user' || tok === '-u') {
      auth = tokens[++j] ?? '';
    } else if (!tok.startsWith('-') && !url) {
      url = tok;
    }
    j++;
  }
  return { method, url, headers, body, auth };
}

export function curlToJs(input: string): string {
  const { method, url, headers, body, auth } = parseCurl(input);
  const hEntries = { ...headers };
  if (auth) hEntries['Authorization'] = `Basic ${btoa(auth)}`;
  const hasHeaders = Object.keys(hEntries).length > 0;

  const lines = [`const response = await fetch(${JSON.stringify(url)}, {`];
  lines.push(`  method: ${JSON.stringify(method)},`);
  if (hasHeaders) {
    lines.push('  headers: {');
    for (const [k, v] of Object.entries(hEntries)) {
      lines.push(`    ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
    }
    lines.push('  },');
  }
  if (body) lines.push(`  body: ${JSON.stringify(body)},`);
  lines.push('});');
  lines.push('const data = await response.json();');
  return lines.join('\n');
}

export function curlToPython(input: string): string {
  const { method, url, headers, body, auth } = parseCurl(input);
  const lines = ['import requests', ''];
  if (Object.keys(headers).length) {
    lines.push(`headers = ${JSON.stringify(headers, null, 2)}`);
    lines.push('');
  }
  if (body) { lines.push(`data = ${JSON.stringify(body)}`); lines.push(''); }
  const args: string[] = [JSON.stringify(url)];
  if (Object.keys(headers).length) args.push('headers=headers');
  if (body) args.push('data=data');
  if (auth) {
    const [u, p = ''] = auth.split(':');
    args.push(`auth=(${JSON.stringify(u)}, ${JSON.stringify(p)})`);
  }
  lines.push(`response = requests.${method.toLowerCase()}(${args.join(', ')})`);
  lines.push('print(response.json())');
  return lines.join('\n');
}

export function curlToPhp(input: string): string {
  const { method, url, headers, body, auth } = parseCurl(input);
  const lines = [
    '<?php',
    '$ch = curl_init();',
    `curl_setopt($ch, CURLOPT_URL, ${JSON.stringify(url)});`,
    'curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);',
    `curl_setopt($ch, CURLOPT_CUSTOMREQUEST, ${JSON.stringify(method)});`,
  ];
  if (Object.keys(headers).length) {
    const hArr = Object.entries(headers)
      .map(([k, v]) => `    ${JSON.stringify(`${k}: ${v}`)}`)
      .join(',\n');
    lines.push(`curl_setopt($ch, CURLOPT_HTTPHEADER, [\n${hArr}\n]);`);
  }
  if (body) lines.push(`curl_setopt($ch, CURLOPT_POSTFIELDS, ${JSON.stringify(body)});`);
  if (auth) lines.push(`curl_setopt($ch, CURLOPT_USERPWD, ${JSON.stringify(auth)});`);
  lines.push('$response = curl_exec($ch);', 'curl_close($ch);', '$data = json_decode($response, true);', '?>');
  return lines.join('\n');
}
