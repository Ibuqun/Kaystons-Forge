'use client';

import { useEffect, useMemo, useState } from 'react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { useClipboard } from '@/hooks/useClipboard';
import { useHistory } from '@/hooks/useHistory';
import { toolMap } from '@/lib/tools/registry';
import { processTool } from '@/lib/tools/engine';
import { Button } from '@/components/ui/Button';
import {
  PlayIcon,
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ClockIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

type Action = { id: string; label: string };

const actionConfig: Record<string, Action[]> = {
  'json-format-validate': [
    { id: 'default', label: 'Prettify' },
    { id: 'minify', label: 'Minify' },
    { id: 'js-object', label: 'To JS Object' },
  ],
  'base64-string': [
    { id: 'default', label: 'Encode' },
    { id: 'decode', label: 'Decode' },
    { id: 'encode-url-safe', label: 'URL-safe' },
  ],
  'regexp-tester': [
    { id: 'gm', label: 'gm' },
    { id: 'gim', label: 'gim' },
    { id: 'g', label: 'g' },
  ],
  'url-encode-decode': [
    { id: 'default', label: 'encodeURI' },
    { id: 'component', label: 'encodeURIComponent' },
    { id: 'form', label: 'Form Encode (+)' },
    { id: 'decode', label: 'Decode' },
  ],
  'html-entity': [
    { id: 'default', label: 'Encode' },
    { id: 'decode', label: 'Decode' },
  ],
  'backslash-escape': [
    { id: 'default', label: 'Escape' },
    { id: 'unescape', label: 'Unescape' },
  ],
  'uuid-ulid': [
    { id: 'uuid-v4', label: 'UUID v4' },
    { id: 'uuid-v7', label: 'UUID v7' },
    { id: 'ulid', label: 'ULID' },
    { id: 'decode-ulid', label: 'Decode ULID' },
  ],
  'text-diff': [
    { id: 'default', label: 'Diff' },
    { id: 'patch', label: 'Patch' },
  ],
  'html-beautify': [
    { id: 'default', label: 'Beautify' },
    { id: 'minify', label: 'Minify' },
  ],
  'css-beautify': [
    { id: 'default', label: 'Beautify' },
    { id: 'minify', label: 'Minify' },
  ],
  'js-beautify': [
    { id: 'default', label: 'Beautify' },
    { id: 'minify', label: 'Minify' },
  ],
  'erb-beautify': [
    { id: 'default', label: 'Beautify' },
    { id: 'minify', label: 'Minify' },
  ],
  'less-beautify': [
    { id: 'default', label: 'Beautify' },
    { id: 'minify', label: 'Minify' },
  ],
  'scss-beautify': [
    { id: 'default', label: 'Beautify' },
    { id: 'minify', label: 'Minify' },
  ],
  'xml-beautify': [
    { id: 'default', label: 'Beautify' },
    { id: 'minify', label: 'Minify' },
  ],
  'lorem-ipsum': [
    { id: 'default', label: 'Paragraphs' },
    { id: 'words', label: 'Words' },
  ],
  'hash-generator': [
    { id: 'md5', label: 'MD5' },
    { id: 'sha1', label: 'SHA-1' },
    { id: 'sha256', label: 'SHA-256' },
    { id: 'sha512', label: 'SHA-512' },
  ],
  'sql-formatter': [
    { id: 'sql', label: 'SQL' },
    { id: 'postgresql', label: 'PostgreSQL' },
    { id: 'mysql', label: 'MySQL' },
    { id: 'sqlite', label: 'SQLite' },
    { id: 'bigquery', label: 'BigQuery' },
  ],
};

const sampleInput: Record<string, string> = {
  'json-format-validate': '{"name":"Adlers Forge","tools":30,"active":true}',
  'yaml-to-json': 'name: Adlers Forge\ntools: 30\nactive: true',
  'json-to-yaml': '{"name":"Adlers Forge","tools":30}',
  'url-parser': 'https://example.com:8080/path?q=forge#hash',
  'regexp-tester': '\\b\\w+@\\w+\\.\\w+\\b',
  'text-diff': 'line 1\nline 2\nline 3',
  'number-base': 'FF|16',
  'sql-formatter': 'select id,name from users where active = 1 order by created_at desc;',
  'html-to-jsx': '<div class="card"><label for="email">Email</label></div>',
};

const sampleSecondInput: Record<string, string> = {
  'regexp-tester': 'mail me at hello@example.com and admin@forge.dev',
  'text-diff': 'line 1\nline 2 changed\nline 4',
};

const needsSecondInput = new Set(['regexp-tester', 'text-diff', 'hash-generator']);
const needsPreview = new Set(['html-preview', 'markdown-preview', 'base64-image']);

export function ToolWorkbench({ toolId }: { toolId: string }) {
  const tool = toolMap.get(toolId);
  const [input, setInput] = useState('');
  const [secondInput, setSecondInput] = useState('');
  const [output, setOutput] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [meta, setMeta] = useState('');
  const [activeAction, setActiveAction] = useState('default');
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [wrapInput, setWrapInput] = useState(true);
  const [wrapOutput, setWrapOutput] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const { copy, copied } = useClipboard();
  const { entries, save, clear } = useHistory(toolId);

  const actions = useMemo(() => actionConfig[toolId] ?? [{ id: 'default', label: 'Run' }], [toolId]);

  useEffect(() => {
    setInput(sampleInput[toolId] ?? '');
    setSecondInput(sampleSecondInput[toolId] ?? '');
    setOutput('');
    setPreviewHtml('');
    setMeta('');
    setQrDataUrl('');
    setShowHistory(false);
    setActiveAction((actionConfig[toolId] ?? [{ id: 'default', label: 'Run' }])[0].id);
  }, [toolId]);

  const run = async (action = activeAction) => {
    setLoading(true);
    try {
      if (toolId === 'qr-code') {
        const data = await QRCode.toDataURL(input || '', { errorCorrectionLevel: 'M', width: 360, margin: 2 });
        setQrDataUrl(data);
        setOutput(data);
        setMeta('Generated QR PNG data URL.');
        await save(input, data);
        return;
      }

      const result = await processTool(toolId, input, { action, secondInput });
      setOutput(result.output);
      setPreviewHtml(result.previewHtml ?? '');
      setMeta(result.meta ?? '');
      await save(input, result.output);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cmd = e.metaKey || e.ctrlKey;
      if (cmd && e.key === 'Enter') {
        e.preventDefault();
        void run();
      }
      if (cmd && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        void copy(output);
      }
      if (cmd && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${toolId}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
      if (e.key === 'Escape') {
        setInput('');
        setSecondInput('');
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [copy, output, toolId]);

  async function decodeQrFromFile(file: File) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context.');
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const decoded = jsQR(imageData.data, imageData.width, imageData.height);
    if (!decoded) {
      setMeta('No QR code found in image.');
      return;
    }
    setOutput(decoded.data);
    setMeta('QR decoded from uploaded image.');
  }

  if (!tool) return <div className="flex h-full items-center justify-center" style={{ color: 'var(--text-muted)' }}>Tool not found.</div>;

  return (
    <section className="flex h-full flex-col gap-2.5 overflow-hidden animate-fade-in">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-2.5" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-secondary)' }}>
        <div className="flex flex-wrap items-center gap-1.5">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => {
                setActiveAction(action.id);
                void run(action.id);
              }}
              className="rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150"
              style={activeAction === action.id ? {
                background: 'var(--accent)',
                color: '#111',
                boxShadow: '0 0 12px rgba(212, 145, 94, 0.2)',
              } : {
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
              }}
            >
              {action.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <label className="flex items-center gap-1.5 text-[11px] cursor-pointer" style={{ color: 'var(--text-muted)' }}>
            <input type="checkbox" checked={wrapInput} onChange={(e) => setWrapInput(e.target.checked)} className="accent-[var(--accent)]" />
            Wrap
          </label>

          <div className="mx-1 h-4 w-px" style={{ background: 'var(--border)' }} />

          <Button variant="primary" size="sm" onClick={() => void run()} disabled={loading}>
            <PlayIcon className="h-3 w-3" />
            {loading ? 'Running...' : 'Run'}
          </Button>

          <Button variant="ghost" size="sm" onClick={() => void copy(output)} aria-label="Copy output">
            {copied ? <CheckIcon className="h-3 w-3" style={{ color: 'var(--success)' }} /> : <ClipboardDocumentIcon className="h-3 w-3" />}
          </Button>

          <Button variant="ghost" size="sm" aria-label="Download output" onClick={() => {
            const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${toolId}.txt`;
            a.click();
            URL.revokeObjectURL(url);
          }}>
            <ArrowDownTrayIcon className="h-3 w-3" />
          </Button>

          <Button variant="ghost" size="sm" aria-label="Clear" onClick={() => { setInput(''); setSecondInput(''); setOutput(''); setPreviewHtml(''); setMeta(''); }}>
            <XMarkIcon className="h-3 w-3" />
          </Button>

          <div className="mx-1 h-4 w-px" style={{ background: 'var(--border)' }} />

          <Button
            variant={showHistory ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            aria-label="Toggle history"
          >
            <ClockIcon className="h-3 w-3" />
            <span className="hidden sm:inline">History</span>
          </Button>
        </div>
      </div>

      {/* Main workspace */}
      <div className="flex min-h-0 flex-1 gap-2.5">
        {/* Editor panels */}
        <div className={`flex min-h-0 min-w-0 flex-1 flex-col gap-2.5 lg:flex-row ${showHistory ? '' : ''}`}>
          {/* Input panel */}
          <div className="flex min-h-0 flex-1 flex-col rounded-xl border p-3" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-secondary)' }}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--text-muted)' }}>Input</span>
              {tool.description && <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{tool.description}</span>}
            </div>
            <textarea
              className={`editor min-h-0 flex-1 ${wrapInput ? '' : 'whitespace-pre'}`}
              placeholder="Paste or type your input here..."
              value={input}
              wrap={wrapInput ? 'soft' : 'off'}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Tool input"
            />
            {needsSecondInput.has(toolId) && (
              <textarea
                className={`editor mt-2 h-24 ${wrapInput ? '' : 'whitespace-pre'}`}
                placeholder={toolId === 'hash-generator' ? 'Secret key (optional, for HMAC)' : 'Secondary input'}
                value={secondInput}
                wrap={wrapInput ? 'soft' : 'off'}
                onChange={(e) => setSecondInput(e.target.value)}
                aria-label="Secondary input"
              />
            )}
            {toolId === 'qr-code' && (
              <div className="mt-2">
                <label className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Upload QR image to decode</label>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 block w-full text-xs"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void decodeQrFromFile(file);
                  }}
                />
              </div>
            )}
          </div>

          {/* Output panel */}
          <div className="flex min-h-0 flex-1 flex-col rounded-xl border p-3" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-secondary)' }}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--text-muted)' }}>Output</span>
              {output && (
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {output.length.toLocaleString()} chars
                </span>
              )}
            </div>
            <textarea
              className={`editor min-h-0 flex-1 ${wrapOutput ? '' : 'whitespace-pre'}`}
              value={output}
              wrap={wrapOutput ? 'soft' : 'off'}
              readOnly
              aria-label="Tool output"
            />

            {meta && (
              <pre className="mt-2 max-h-20 overflow-auto rounded-lg border p-2.5 text-[11px]" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
                {meta}
              </pre>
            )}

            {needsPreview.has(toolId) && previewHtml && toolId !== 'base64-image' && (
              <iframe
                title="Preview"
                sandbox=""
                srcDoc={previewHtml}
                className="mt-2 h-40 w-full rounded-lg border"
                style={{ borderColor: 'var(--border-subtle)', background: '#fff' }}
              />
            )}

            {toolId === 'base64-image' && previewHtml && (
              <div className="mt-2 max-h-40 overflow-auto rounded-lg border p-2" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-primary)' }} dangerouslySetInnerHTML={{ __html: previewHtml }} />
            )}

            {toolId === 'qr-code' && qrDataUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img src={qrDataUrl} alt="QR code" className="h-24 w-24 rounded-lg border p-1" style={{ borderColor: 'var(--border)', background: '#fff' }} />
                <a
                  className="rounded-lg border px-3 py-1.5 text-xs transition-colors hover:bg-bgTertiary/50"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                  href={qrDataUrl}
                  download="qr-code.png"
                >
                  Download PNG
                </a>
              </div>
            )}
          </div>
        </div>

        {/* History sidebar */}
        {showHistory && (
          <div
            className="flex w-[260px] shrink-0 flex-col rounded-xl border animate-fade-in"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-secondary)' }}
          >
            <div className="flex items-center justify-between border-b px-3 py-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: 'var(--text-muted)' }}>History</span>
              <Button variant="danger" size="sm" onClick={() => void clear()}>
                <TrashIcon className="h-3 w-3" />
                Clear
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-2">
              {entries.length === 0 && (
                <div className="px-2 py-8 text-center text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  No history yet. Run a tool to see entries here.
                </div>
              )}
              {entries.map((entry) => (
                <button
                  key={entry.id}
                  className="mb-1 w-full rounded-lg border px-2.5 py-2 text-left transition-colors duration-100 hover:border-[var(--border)]"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-primary)' }}
                  onClick={() => {
                    setInput(entry.input);
                    setOutput(entry.output);
                  }}
                >
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{new Date(entry.timestamp).toLocaleString()}</div>
                  <div className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{entry.input || '(empty)'}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
