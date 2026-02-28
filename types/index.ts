import type { ComponentType } from 'react';

export type ToolCategory =
  | 'encoding'
  | 'escaping'
  | 'preview'
  | 'format'
  | 'beautify'
  | 'generator'
  | 'data';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: ComponentType<{ className?: string }>;
  keywords: string[];
}

export interface HistoryEntry {
  id?: number;
  toolId: string;
  timestamp: number;
  input: string;
  output: string;
  starred: boolean;
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system';
  editorFontSize: number;
  editorTabSize: number;
  autoFormatOnPaste: boolean;
  preserveHistory: boolean;
}
