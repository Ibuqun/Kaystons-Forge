'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { ToolWorkbench } from '@/components/tools/ToolWorkbench';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { tools } from '@/lib/tools/registry';

export function AppShell({ toolId }: { toolId: string }) {
  const router = useRouter();
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setPalette = useAppStore((s) => s.setCommandPaletteOpen);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  useEffect(() => {
    const currentIndex = tools.findIndex((x) => x.id === toolId);
    const onKeyDown = (e: KeyboardEvent) => {
      const cmd = e.metaKey || e.ctrlKey;
      if (cmd && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette(true);
      }
      if (cmd && e.key === '[') {
        e.preventDefault();
        const prev = tools[(currentIndex - 1 + tools.length) % tools.length];
        router.push(`/tools/${prev.id}`);
      }
      if (cmd && e.key === ']') {
        e.preventDefault();
        const next = tools[(currentIndex + 1) % tools.length];
        router.push(`/tools/${next.id}`);
      }
      if (cmd && e.key === '1') {
        e.preventDefault();
        useAppStore.getState().toggleSidebar();
      }
      if (e.key === 'Escape') {
        window.dispatchEvent(new CustomEvent('kaystons:escape'));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [router, setPalette, toolId]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={!sidebarOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header toolId={toolId} />
        <main className="flex-1 overflow-hidden p-3">
          <ErrorBoundary key={toolId}>
            <ToolWorkbench toolId={toolId} />
          </ErrorBoundary>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
