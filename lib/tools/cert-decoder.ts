// Minimal ASN.1 DER reader and X.509 certificate decoder

const OID_NAMES: Record<string, string> = {
  '2.5.4.3': 'CN',
  '2.5.4.6': 'C',
  '2.5.4.7': 'L',
  '2.5.4.8': 'ST',
  '2.5.4.9': 'STREET',
  '2.5.4.10': 'O',
  '2.5.4.11': 'OU',
  '2.5.4.17': 'POSTAL',
  '1.2.840.113549.1.1.1': 'rsaEncryption',
  '1.2.840.113549.1.1.5': 'sha1WithRSAEncryption',
  '1.2.840.113549.1.1.11': 'sha256WithRSAEncryption',
  '1.2.840.113549.1.1.12': 'sha384WithRSAEncryption',
  '1.2.840.113549.1.1.13': 'sha512WithRSAEncryption',
  '1.2.840.10040.4.1': 'id-dsa',
  '1.2.840.10045.2.1': 'id-ecPublicKey',
  '2.5.29.17': 'subjectAltName',
  '2.5.29.19': 'basicConstraints',
  '2.5.29.15': 'keyUsage',
  '2.5.29.14': 'subjectKeyIdentifier',
  '2.5.29.35': 'authorityKeyIdentifier',
  '1.3.6.1.5.5.7.1.1': 'authorityInfoAccess',
};

interface DerNode {
  tag: number;
  constructed: boolean;
  bytes: Uint8Array;
  children?: DerNode[];
}

function readLength(buf: Uint8Array, pos: number): [number, number] {
  const first = buf[pos++];
  if (first < 0x80) return [first, pos];
  const numBytes = first & 0x7f;
  let len = 0;
  for (let i = 0; i < numBytes; i++) len = (len << 8) | buf[pos++];
  return [len, pos];
}

function parseDer(buf: Uint8Array, start = 0, end?: number): DerNode[] {
  end = end ?? buf.length;
  const nodes: DerNode[] = [];
  let pos = start;
  while (pos < end) {
    const tag = buf[pos++];
    const constructed = (tag & 0x20) !== 0;
    const [len, nextPos] = readLength(buf, pos);
    pos = nextPos;
    const bytes = buf.slice(pos, pos + len);
    const node: DerNode = { tag, constructed, bytes };
    if (constructed) node.children = parseDer(bytes);
    nodes.push(node);
    pos += len;
  }
  return nodes;
}

function oidBytes(bytes: Uint8Array): string {
  const parts: number[] = [];
  const first = bytes[0];
  parts.push(Math.floor(first / 40), first % 40);
  let value = 0;
  for (let i = 1; i < bytes.length; i++) {
    value = (value << 7) | (bytes[i] & 0x7f);
    if ((bytes[i] & 0x80) === 0) { parts.push(value); value = 0; }
  }
  return parts.join('.');
}

function utf8orLatin(bytes: Uint8Array): string {
  try { return new TextDecoder('utf-8').decode(bytes); }
  catch { return new TextDecoder('latin1').decode(bytes); }
}

function parseDN(seqNode: DerNode): string {
  const parts: string[] = [];
  for (const setNode of (seqNode.children ?? [])) {
    for (const attrNode of (setNode.children ?? [])) {
      const ch = attrNode.children ?? [];
      if (ch.length < 2) continue;
      const oidName = OID_NAMES[oidBytes(ch[0].bytes)] ?? oidBytes(ch[0].bytes);
      const val = utf8orLatin(ch[1].bytes);
      parts.push(`${oidName}=${val}`);
    }
  }
  return parts.join(', ');
}

function parseGeneralizedTime(bytes: Uint8Array): string {
  const s = new TextDecoder().decode(bytes);
  if (s.length === 13) { // UTCTime
    const yy = parseInt(s.slice(0, 2));
    const year = yy >= 50 ? 1900 + yy : 2000 + yy;
    return `${year}-${s.slice(2, 4)}-${s.slice(4, 6)} ${s.slice(6, 8)}:${s.slice(8, 10)}:${s.slice(10, 12)} UTC`;
  }
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)} ${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)} UTC`;
}

function bigIntHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').replace(/^0+/, '') || '0';
}

export function decodeCertificate(input: string): string {
  try {
    const pem = input.trim();
    const b64 = pem.includes('-----')
      ? pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
      : pem.replace(/\s+/g, '');

    let der: Uint8Array;
    try {
      der = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    } catch {
      return 'Invalid certificate: failed to base64-decode input.';
    }

    const root = parseDer(der);
    if (!root.length || !root[0].children) return 'Invalid certificate: cannot parse DER structure.';

    const cert = root[0].children; // [TBSCertificate, signatureAlgorithm, signature]
    if (cert.length < 3) return 'Invalid certificate: unexpected structure.';

    const tbs = cert[0].children ?? [];
    let idx = 0;

    // Version: [0] EXPLICIT INTEGER (optional)
    let version = 'v1';
    if (tbs[idx] && (tbs[idx].tag & 0x1f) === 0) {
      const vInt = (tbs[idx].children ?? [])[0];
      if (vInt) version = `v${(vInt.bytes[0] ?? 0) + 1}`;
      idx++;
    }

    // Serial number
    const serial = tbs[idx++];
    const serialHex = serial ? bigIntHex(serial.bytes) : 'unknown';

    // Signature algorithm
    const sigAlgNode = tbs[idx++];
    const sigAlgOid = (sigAlgNode?.children ?? [])[0];
    const sigAlg = sigAlgOid ? (OID_NAMES[oidBytes(sigAlgOid.bytes)] ?? oidBytes(sigAlgOid.bytes)) : 'unknown';

    // Issuer
    const issuerNode = tbs[idx++];
    const issuer = issuerNode ? parseDN(issuerNode) : 'unknown';

    // Validity
    const validityNode = tbs[idx++];
    const validityChildren = validityNode?.children ?? [];
    const notBefore = validityChildren[0] ? parseGeneralizedTime(validityChildren[0].bytes) : 'unknown';
    const notAfter = validityChildren[1] ? parseGeneralizedTime(validityChildren[1].bytes) : 'unknown';

    // Subject
    const subjectNode = tbs[idx++];
    const subject = subjectNode ? parseDN(subjectNode) : 'unknown';

    // SubjectPublicKeyInfo
    const spkiNode = tbs[idx++];
    const spkiChildren = spkiNode?.children ?? [];
    const pkAlgOid = (spkiChildren[0]?.children ?? [])[0];
    const pkAlg = pkAlgOid ? (OID_NAMES[oidBytes(pkAlgOid.bytes)] ?? oidBytes(pkAlgOid.bytes)) : 'unknown';
    let keySize = '';
    if (spkiChildren[1] && pkAlg === 'rsaEncryption') {
      try {
        const bitStringContent = spkiChildren[1].bytes.slice(1);
        const inner = parseDer(bitStringContent);
        const modulus = (inner[0]?.children ?? [])[0];
        if (modulus) keySize = ` (${(modulus.bytes.length - 1) * 8} bits)`;
      } catch { /* ignore */ }
    }

    // Extensions: [3] EXPLICIT SEQUENCE (optional)
    const sans: string[] = [];
    for (let i = idx; i < tbs.length; i++) {
      if ((tbs[i].tag & 0x1f) !== 3) continue;
      const extsSeq = (tbs[i].children ?? [])[0];
      for (const extNode of (extsSeq?.children ?? [])) {
        const extCh = extNode.children ?? [];
        if (!extCh.length) continue;
        const extOid = oidBytes(extCh[0].bytes);
        if (extOid === '2.5.29.17') {
          const octet = extCh.find(n => n.tag === 0x04);
          if (octet) {
            try {
              const sanSeq = parseDer(octet.bytes)[0]?.children ?? [];
              for (const name of sanSeq) {
                const tagType = name.tag & 0x1f;
                if (tagType === 2) sans.push(`DNS:${utf8orLatin(name.bytes)}`);
                else if (tagType === 7) sans.push(`IP:${Array.from(name.bytes).join('.')}`);
                else if (tagType === 1) sans.push(`email:${utf8orLatin(name.bytes)}`);
              }
            } catch { /* ignore */ }
          }
        }
      }
    }

    // Outer signature algorithm
    const outerSigAlgNode = cert[1].children?.[0];
    const outerSigAlg = outerSigAlgNode
      ? (OID_NAMES[oidBytes(outerSigAlgNode.bytes)] ?? oidBytes(outerSigAlgNode.bytes))
      : sigAlg;

    const lines = [
      `Version:            ${version}`,
      `Serial Number:      ${serialHex}`,
      `Signature Alg:      ${outerSigAlg}`,
      ``,
      `Subject:            ${subject}`,
      `Issuer:             ${issuer}`,
      ``,
      `Not Before:         ${notBefore}`,
      `Not After:          ${notAfter}`,
      ``,
      `Public Key:         ${pkAlg}${keySize}`,
    ];

    if (sans.length) {
      lines.push('', `Subject Alt Names:`);
      for (const s of sans) lines.push(`  ${s}`);
    }

    return lines.join('\n');
  } catch (e) {
    return `Invalid certificate: ${e instanceof Error ? e.message : 'parse error'}`;
  }
}
