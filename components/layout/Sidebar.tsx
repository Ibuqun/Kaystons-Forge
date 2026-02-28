'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { categoryLabels, tools } from '@/lib/tools/registry';

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter((t) => `${t.name} ${t.keywords.join(' ')}`.toLowerCase().includes(q));
  }, [query]);

  const byCategory = useMemo(() => {
    return Object.keys(categoryLabels).map((key) => ({
      key,
      label: categoryLabels[key as keyof typeof categoryLabels],
      items: filtered.filter((tool) => tool.category === key),
    }));
  }, [filtered]);

  return (
    <aside
      className={`flex h-screen flex-col border-r border-border-subtle bg-bgSecondary transition-[width] duration-300 ease-out ${
        collapsed ? 'w-[56px]' : 'w-[260px]'
      } overflow-hidden`}
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 border-b px-3 py-4 ${collapsed ? 'justify-center' : ''}`} style={{ borderColor: 'var(--border-subtle)' }}>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
          style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
        >
          AF
        </div>
        {!collapsed && (
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', letterSpacing: '-0.01em' }}>
            Adler&apos;s Forge
          </span>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              className="w-full rounded-lg border py-1.5 pl-8 pr-3 text-sm transition-colors duration-150"
              style={{
                borderColor: 'var(--border-subtle)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
              placeholder="Search tools..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search tools"
            />
          </div>
        </div>
      )}

      {/* Tool list */}
      <nav className="flex-1 overflow-auto px-2 py-2" role="navigation" aria-label="Tool navigation">
        {byCategory.map((section) => {
          if (section.items.length === 0) return null;
          return (
            <div key={section.key} className="mb-3">
              {!collapsed && (
                <div
                  className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.08em]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {section.label}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((tool) => {
                  const active = pathname === `/tools/${tool.id}`;
                  const Icon = tool.icon;
                  return (
                    <Link
                      key={tool.id}
                      href={`/tools/${tool.id}`}
                      className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-all duration-150 ${
                        active
                          ? 'font-medium'
                          : 'hover:bg-bgTertiary/50'
                      } ${collapsed ? 'justify-center' : ''}`}
                      style={active ? {
                        background: 'var(--accent-subtle)',
                        color: 'var(--accent)',
                        boxShadow: 'inset 2px 0 0 var(--accent)',
                      } : {
                        color: 'var(--text-secondary)',
                      }}
                      title={tool.name}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon className={`h-4 w-4 shrink-0 transition-colors ${active ? '' : 'group-hover:text-textPrimary'}`} />
                      {!collapsed && <span className="truncate">{tool.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t px-4 py-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            <kbd className="rounded border px-1 py-0.5 text-[10px]" style={{ borderColor: 'var(--border)', background: 'var(--bg-tertiary)' }}>⌘K</kbd>
            <span>Command Palette</span>
          </div>
        </div>
      )}
    </aside>
  );
}
