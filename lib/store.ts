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
  theme: 'dark',
  editorFontSize: 14,
  editorTabSize: 2,
  autoFormatOnPaste: false,
  preserveHistory: true,
};

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
    { name: 'adlers-forge-ui' },
  ),
);
