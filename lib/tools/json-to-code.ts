export interface JsonArray extends Array<JsonValue> {}
export interface JsonRecord extends Record<string, JsonValue> {}
export type JsonValue = null | boolean | number | string | JsonArray | JsonRecord;

function toPascalCase(s: string): string {
  return s.replace(/(^|[_\-\s])([a-zA-Z])/g, (_, __, c: string) => c.toUpperCase()).replace(/^(.)/, (c: string) => c.toUpperCase());
}

function toSnakeCase(s: string): string {
  return s.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/[^a-z0-9_]/g, '_');
}

/** Returns true if s is a valid JS/TS identifier (no quoting needed in interfaces) */
function isValidIdentifier(s: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(s);
}

/** Sanitize a key to a valid Python identifier */
function toPythonIdentifier(s: string): string {
  const snake = toSnakeCase(s).replace(/^(\d)/, '_$1') || '_field';
  return snake;
}

// ─── TypeScript ───────────────────────────────────────────────────────────────

function tsInferType(value: JsonValue, name: string, out: Map<string, string>): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') return 'string';
  if (Array.isArray(value)) {
    if (!value.length) return 'unknown[]';
    return `${tsInferType(value[0] as JsonValue, `${name}Item`, out)}[]`;
  }
  // object
  const ifaceName = toPascalCase(name) || 'Root';
  const fields = Object.entries(value as Record<string, JsonValue>)
    .map(([k, v]) => {
      // Quote keys that are not valid identifiers (e.g. "first-name")
      const fieldName = isValidIdentifier(k) ? k : JSON.stringify(k);
      return `  ${fieldName}: ${tsInferType(v, k, out)};`;
    })
    .join('\n');
  out.set(ifaceName, `interface ${ifaceName} {\n${fields}\n}`);
  return ifaceName;
}

export function jsonToTypeScript(value: JsonValue, rootName = 'Root'): string {
  const out = new Map<string, string>();
  tsInferType(value, rootName, out);
  return [...out.values()].join('\n\n');
}

// ─── Python ───────────────────────────────────────────────────────────────────

function pyInferType(value: JsonValue, name: string, out: Map<string, string>): string {
  if (value === null) return 'Optional[Any]';
  if (typeof value === 'boolean') return 'bool';
  if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'float';
  if (typeof value === 'string') return 'str';
  if (Array.isArray(value)) {
    if (!value.length) return 'List[Any]';
    return `List[${pyInferType(value[0] as JsonValue, `${name}Item`, out)}]`;
  }
  const className = toPascalCase(name) || 'Root';
  const fields = Object.entries(value as Record<string, JsonValue>)
    .map(([k, v]) => {
      const fieldName = toPythonIdentifier(k);
      // Add comment if the field name was sanitized from the original key
      const comment = fieldName !== k ? `  # originally "${k}"` : '';
      return `    ${fieldName}: ${pyInferType(v, k, out)}${comment}`;
    })
    .join('\n');
  out.set(className, `@dataclass\nclass ${className}:\n${fields}`);
  return className;
}

export function jsonToPython(value: JsonValue, rootName = 'Root'): string {
  const out = new Map<string, string>();
  pyInferType(value, rootName, out);
  const header = 'from dataclasses import dataclass\nfrom typing import Any, List, Optional\n\n';
  return header + [...out.values()].join('\n\n');
}

// ─── Go ───────────────────────────────────────────────────────────────────────

function goInferType(value: JsonValue, name: string, out: Map<string, string>): string {
  if (value === null) return 'interface{}';
  if (typeof value === 'boolean') return 'bool';
  if (typeof value === 'number') return Number.isInteger(value) ? 'int64' : 'float64';
  if (typeof value === 'string') return 'string';
  if (Array.isArray(value)) {
    if (!value.length) return '[]interface{}';
    return `[]${goInferType(value[0] as JsonValue, `${name}Item`, out)}`;
  }
  const structName = toPascalCase(name) || 'Root';
  const fields = Object.entries(value as Record<string, JsonValue>)
    .map(([k, v]) => {
      const fieldName = toPascalCase(k);
      const jsonTag = `\`json:"${k}"\``;
      return `\t${fieldName} ${goInferType(v, k, out)} ${jsonTag}`;
    })
    .join('\n');
  out.set(structName, `type ${structName} struct {\n${fields}\n}`);
  return structName;
}

export function jsonToGo(value: JsonValue, rootName = 'Root'): string {
  const out = new Map<string, string>();
  goInferType(value, rootName, out);
  return `package main\n\n` + [...out.values()].join('\n\n');
}

// ─── Rust ─────────────────────────────────────────────────────────────────────

function rustInferType(value: JsonValue, name: string, out: Map<string, string>): string {
  if (value === null) return 'Option<serde_json::Value>';
  if (typeof value === 'boolean') return 'bool';
  if (typeof value === 'number') return Number.isInteger(value) ? 'i64' : 'f64';
  if (typeof value === 'string') return 'String';
  if (Array.isArray(value)) {
    if (!value.length) return 'Vec<serde_json::Value>';
    return `Vec<${rustInferType(value[0] as JsonValue, `${name}Item`, out)}>`;
  }
  const structName = toPascalCase(name) || 'Root';
  const fields = Object.entries(value as Record<string, JsonValue>)
    .map(([k, v]) => {
      const fieldName = toSnakeCase(k);
      const rename = fieldName !== k ? `    #[serde(rename = "${k}")]\n` : '';
      return `${rename}    pub ${fieldName}: ${rustInferType(v, k, out)},`;
    })
    .join('\n');
  out.set(structName, `#[derive(Debug, Serialize, Deserialize)]\npub struct ${structName} {\n${fields}\n}`);
  return structName;
}

export function jsonToRust(value: JsonValue, rootName = 'Root'): string {
  const out = new Map<string, string>();
  rustInferType(value, rootName, out);
  const header = 'use serde::{Deserialize, Serialize};\n\n';
  return header + [...out.values()].join('\n\n');
}
