'use client';

import { useRouter } from 'next/navigation';
import { tools, categoryLabels } from '@/lib/tools/registry';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';

export function Header({ toolId }: { toolId: string }) {
  const router = useRouter();
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const setPalette = useAppStore((s) => s.setCommandPaletteOpen);
  const theme = useAppStore((s) => s.settings.theme);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const toggleTheme = () => {
    updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' });
  };

  const idx = tools.findIndex((x) => x.id === toolId);
  const current = tools[idx] ?? tools[0];
  const categoryLabel = categoryLabels[current.category as keyof typeof categoryLabels] ?? current.category;

  const goPrev = () => {
    const target = tools[(idx - 1 + tools.length) % tools.length];
    router.push(`/tools/${target.id}`);
  };
  const goNext = () => {
    const target = tools[(idx + 1) % tools.length];
    router.push(`/tools/${target.id}`);
  };

  return (
    <header
      className="flex items-center justify-between border-b px-4 py-2.5"
      style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-secondary)' }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 transition-colors hover:bg-bgTertiary/50"
          aria-label="Toggle sidebar"
        >
          <Bars3Icon className="h-4.5 w-4.5" style={{ color: 'var(--text-secondary)' }} />
        </button>

        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="rounded-md p-1 transition-colors hover:bg-bgTertiary/50" aria-label="Previous tool">
            <ChevronLeftIcon className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          </button>
          <button onClick={goNext} className="rounded-md p-1 transition-colors hover:bg-bgTertiary/50" aria-label="Next tool">
            <ChevronRightIcon className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        <div className="h-5 w-px" style={{ background: 'var(--border)' }} />

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-semibold" style={{ letterSpacing: '-0.01em' }}>{current.name}</h1>
          </div>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{categoryLabel}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <SunIcon className="h-3.5 w-3.5" />
          ) : (
            <MoonIcon className="h-3.5 w-3.5" />
          )}
        </Button>

        <div className="h-4 w-px" style={{ background: 'var(--border)' }} />

        <Button
          variant="subtle"
          size="sm"
          onClick={() => setPalette(true)}
          aria-label="Open command palette"
        >
          <MagnifyingGlassIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="ml-1 hidden rounded border px-1 py-0.5 text-[10px] sm:inline-block" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>⌘K</kbd>
        </Button>
      </div>
    </header>
  );
}
