import Dexie, { Table } from 'dexie';
import type { HistoryEntry } from '@/types';

export class AdlersForgeDB extends Dexie {
  history!: Table<HistoryEntry, number>;
  favorites!: Table<{ id?: number; toolId: string }, number>;
  settings!: Table<{ id: string; value: unknown }, string>;

  constructor() {
    super('AdlersForgeDB');
    this.version(1).stores({
      history: '++id, toolId, timestamp, starred',
      favorites: '++id, toolId',
      settings: 'id',
    });
  }
}

export const db = new AdlersForgeDB();
