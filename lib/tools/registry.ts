import {
  ArrowPathIcon,
  ArrowRightIcon,
  ArrowsRightLeftIcon,
  ArrowUturnLeftIcon,
  BeakerIcon,
  CircleStackIcon,
  ClockIcon,
  CodeBracketIcon,
  CodeBracketSquareIcon,
  DocumentTextIcon,
  EyeIcon,
  FingerPrintIcon,
  GlobeAltIcon,
  HashtagIcon,
  KeyIcon,
  LinkIcon,
  ListBulletIcon,
  LockClosedIcon,
  MagnifyingGlassCircleIcon,
  MagnifyingGlassIcon,
  PaintBrushIcon,
  PencilSquareIcon,
  PhotoIcon,
  QrCodeIcon,
  ScaleIcon,
  SparklesIcon,
  TableCellsIcon,
  VariableIcon,
} from '@heroicons/react/24/outline';
import type { ToolDefinition } from '@/types';

export const categoryLabels = {
  encoding: 'Encoding & Encryption',
  escaping: 'Escaping & Entities',
  preview: 'Preview & Comparison',
  format: 'Format Converters',
  beautify: 'Code Beautifiers',
  generator: 'Generators',
  data: 'Data Transformers',
} as const;

export const tools: ToolDefinition[] = [
  { id: 'unix-time-converter', name: 'Unix Time Converter', description: 'Epoch and date conversion', category: 'encoding', icon: ClockIcon, keywords: ['timestamp', 'epoch', 'date'] },
  { id: 'json-format-validate', name: 'JSON Format/Validate', description: 'Validate and format JSON', category: 'encoding', icon: CodeBracketIcon, keywords: ['json', 'validate', 'prettify'] },
  { id: 'base64-string', name: 'Base64 String Encode/Decode', description: 'Encode or decode UTF-8 text', category: 'encoding', icon: HashtagIcon, keywords: ['base64', 'utf8', 'decode'] },
  { id: 'base64-image', name: 'Base64 Image Encode/Decode', description: 'Convert image content and data URLs', category: 'encoding', icon: PhotoIcon, keywords: ['base64', 'image', 'data url'] },
  { id: 'jwt-debugger', name: 'JWT Debugger', description: 'Inspect JWT header and payload', category: 'encoding', icon: KeyIcon, keywords: ['jwt', 'token', 'claims'] },
  { id: 'regexp-tester', name: 'RegExp Tester', description: 'Test regular expressions', category: 'encoding', icon: MagnifyingGlassIcon, keywords: ['regex', 'pattern', 'match'] },
  { id: 'url-encode-decode', name: 'URL Encode/Decode', description: 'Encode and decode URL content', category: 'encoding', icon: LinkIcon, keywords: ['url', 'encode', 'decode'] },
  { id: 'url-parser', name: 'URL Parser', description: 'Break down URL components', category: 'encoding', icon: GlobeAltIcon, keywords: ['url', 'params', 'hostname'] },

  { id: 'html-entity', name: 'HTML Entity Encode/Decode', description: 'Convert text and HTML entities', category: 'escaping', icon: CodeBracketSquareIcon, keywords: ['html', 'entity', 'escape'] },
  { id: 'backslash-escape', name: 'Backslash Escape/Unescape', description: 'Handle escaped string content', category: 'escaping', icon: ArrowUturnLeftIcon, keywords: ['escape', 'unescape', 'unicode'] },
  { id: 'uuid-ulid', name: 'UUID/ULID Generate/Decode', description: 'Generate UUID and ULID values', category: 'escaping', icon: FingerPrintIcon, keywords: ['uuid', 'ulid', 'id'] },

  { id: 'html-preview', name: 'HTML Preview', description: 'Render HTML safely in an iframe', category: 'preview', icon: EyeIcon, keywords: ['html', 'preview', 'iframe'] },
  { id: 'text-diff', name: 'Text Diff Checker', description: 'Compare two text blocks', category: 'preview', icon: ArrowsRightLeftIcon, keywords: ['diff', 'compare', 'patch'] },

  { id: 'yaml-to-json', name: 'YAML to JSON', description: 'Convert YAML documents to JSON', category: 'format', icon: ArrowRightIcon, keywords: ['yaml', 'json', 'convert'] },
  { id: 'json-to-yaml', name: 'JSON to YAML', description: 'Convert JSON documents to YAML', category: 'format', icon: ArrowRightIcon, keywords: ['json', 'yaml', 'convert'] },
  { id: 'number-base', name: 'Number Base Converter', description: 'Convert values across numeric bases', category: 'format', icon: HashtagIcon, keywords: ['binary', 'hex', 'base'] },

  { id: 'html-beautify', name: 'HTML Beautify/Minify', description: 'Format or minify HTML', category: 'beautify', icon: SparklesIcon, keywords: ['html', 'format', 'minify'] },
  { id: 'css-beautify', name: 'CSS Beautify/Minify', description: 'Format or minify CSS', category: 'beautify', icon: PaintBrushIcon, keywords: ['css', 'format', 'minify'] },
  { id: 'js-beautify', name: 'JS Beautify/Minify', description: 'Format or minify JS/TS', category: 'beautify', icon: BeakerIcon, keywords: ['javascript', 'typescript', 'minify'] },
  { id: 'erb-beautify', name: 'ERB Beautify/Minify', description: 'Format ERB templates', category: 'beautify', icon: VariableIcon, keywords: ['erb', 'ruby', 'template'] },
  { id: 'less-beautify', name: 'LESS Beautify/Minify', description: 'Format LESS content', category: 'beautify', icon: PaintBrushIcon, keywords: ['less', 'css'] },
  { id: 'scss-beautify', name: 'SCSS Beautify/Minify', description: 'Format SCSS content', category: 'beautify', icon: PaintBrushIcon, keywords: ['scss', 'sass'] },
  { id: 'xml-beautify', name: 'XML Beautify/Minify', description: 'Format, minify, and validate XML', category: 'beautify', icon: DocumentTextIcon, keywords: ['xml', 'xhtml', 'format'] },

  { id: 'lorem-ipsum', name: 'Lorem Ipsum Generator', description: 'Generate placeholder text', category: 'generator', icon: PencilSquareIcon, keywords: ['lorem', 'placeholder', 'text'] },
  { id: 'qr-code', name: 'QR Code Reader/Generator', description: 'Generate and decode QR codes', category: 'generator', icon: QrCodeIcon, keywords: ['qr', 'barcode', 'scan'] },
  { id: 'string-inspector', name: 'String Inspector', description: 'Inspect text characteristics', category: 'generator', icon: MagnifyingGlassCircleIcon, keywords: ['string', 'unicode', 'bytes'] },

  { id: 'json-to-csv', name: 'JSON to CSV', description: 'Convert JSON arrays to CSV', category: 'data', icon: TableCellsIcon, keywords: ['json', 'csv', 'table'] },
  { id: 'csv-to-json', name: 'CSV to JSON', description: 'Convert CSV to JSON', category: 'data', icon: TableCellsIcon, keywords: ['csv', 'json', 'table'] },
  { id: 'hash-generator', name: 'Hash Generator', description: 'Generate MD5/SHA hashes', category: 'data', icon: LockClosedIcon, keywords: ['hash', 'sha', 'md5'] },
  { id: 'html-to-jsx', name: 'HTML to JSX', description: 'Convert HTML markup to JSX', category: 'data', icon: CodeBracketIcon, keywords: ['html', 'jsx', 'react'] },
  { id: 'markdown-preview', name: 'Markdown Preview', description: 'Render Markdown to HTML', category: 'data', icon: DocumentTextIcon, keywords: ['markdown', 'md', 'preview'] },
  { id: 'sql-formatter', name: 'SQL Formatter', description: 'Format SQL across dialects', category: 'data', icon: CircleStackIcon, keywords: ['sql', 'query', 'formatter'] },
  { id: 'list-splitter', name: 'List Splitter', description: 'Split lists into batches', category: 'data', icon: ListBulletIcon, keywords: ['list', 'split', 'batch', 'chunk'] },
  { id: 'csv-to-sql', name: 'CSV to SQL INSERT', description: 'Generate SQL INSERT from CSV', category: 'data', icon: CircleStackIcon, keywords: ['csv', 'sql', 'insert', 'import'] },
  { id: 'list-compare', name: 'List Compare', description: 'Compare lists, find differences', category: 'data', icon: ScaleIcon, keywords: ['list', 'compare', 'diff', 'venn', 'intersection'] },
];

export const defaultToolId = 'json-format-validate';

export const toolMap = new Map(tools.map((tool) => [tool.id, tool]));
