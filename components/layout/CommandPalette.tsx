'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tools, categoryLabels } from '@/lib/tools/registry';
import { useAppStore } from '@/lib/store';

export function CommandPalette() {
  const router = useRouter();
  const open = useAppStore((s) => s.commandPaletteOpen);
  const setOpen = useAppStore((s) => s.setCommandPaletteOpen);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tools.slice(0, 12);
    return tools
      .filter((tool) => {
        const corpus = `${tool.name} ${tool.description} ${tool.keywords.join(' ')}`.toLowerCase();
        return corpus.includes(q);
      })
      .slice(0, 12);
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        router.push(`/tools/${results[selectedIndex].id}`);
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results, selectedIndex, router, setOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-palette-item]');
    items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="animate-slide-in w-full max-w-xl overflow-hidden rounded-xl border"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--bg-secondary)',
          boxShadow: 'var(--shadow-lg), 0 0 80px rgba(212, 145, 94, 0.06)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <svg className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            ref={inputRef}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
            placeholder="Search tools..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search tools"
          />
          <kbd
            className="shrink-0 rounded border px-1.5 py-0.5 text-[10px]"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg-tertiary)' }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[360px] overflow-auto p-2" role="listbox">
          {results.length === 0 && (
            <div className="px-3 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              No tools found for &ldquo;{query}&rdquo;
            </div>
          )}
          {results.map((tool, i) => {
            const Icon = tool.icon;
            const catLabel = categoryLabels[tool.category as keyof typeof categoryLabels] ?? tool.category;
            return (
              <button
                key={tool.id}
                data-palette-item
                role="option"
                aria-selected={i === selectedIndex}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-100 ${
                  i === selectedIndex ? '' : 'hover:bg-bgTertiary/40'
                }`}
                style={i === selectedIndex ? {
                  background: 'var(--accent-subtle)',
                  color: 'var(--accent)',
                } : {}}
                onClick={() => {
                  router.push(`/tools/${tool.id}`);
                  setOpen(false);
                }}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-70" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{tool.name}</div>
                  <div className="truncate text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {tool.description}
                  </div>
                </div>
                <span className="shrink-0 text-[10px]" style={{ color: 'var(--text-muted)' }}>{catLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
