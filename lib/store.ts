'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '@/types';

type State = {
  sidebarOpen: boolean;
  activeToolId: string;
  commandPaletteOpen: boolean;
  settings: AppSettings;
  setActiveTool: (id: string) => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
};

const defaults: AppSettings = {
  theme: 'light',
  editorFontSize: 14,
  editorTabSize: 2,
  autoFormatOnPaste: false,
  preserveHistory: true,
};

// Migrate old localStorage key
if (typeof window !== 'undefined') {
  const old = localStorage.getItem('adlers-forge-ui');
  if (old && !localStorage.getItem('kaystons-forge-ui')) {
    localStorage.setItem('kaystons-forge-ui', old);
    localStorage.removeItem('adlers-forge-ui');
  }
}

export const useAppStore = create<State>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      activeToolId: 'json-format-validate',
      commandPaletteOpen: false,
      settings: defaults,
      setActiveTool: (id) => set({ activeToolId: id }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      updateSettings: (partial) => set((s) => ({ settings: { ...s.settings, ...partial } })),
    }),
    { name: 'kaystons-forge-ui' },
  ),
);
