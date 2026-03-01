import Dexie, { Table } from 'dexie';
import type { HistoryEntry } from '@/types';

export class KaystonsForgeDB extends Dexie {
  history!: Table<HistoryEntry, number>;
  favorites!: Table<{ id?: number; toolId: string }, number>;
  settings!: Table<{ id: string; value: unknown }, string>;

  constructor() {
    super('KaystonsForgeDB');
    this.version(1).stores({
      history: '++id, toolId, timestamp, starred',
      favorites: '++id, toolId',
      settings: 'id',
    });
  }
}

export const db = new KaystonsForgeDB();

// Migrate data from old DB name
if (typeof window !== 'undefined') {
  (async () => {
    try {
      const names = await Dexie.getDatabaseNames();
      if (names.includes('AdlersForgeDB')) {
        const oldDb = new Dexie('AdlersForgeDB');
        oldDb.version(1).stores({ history: '++id, toolId, timestamp, starred', favorites: '++id, toolId', settings: 'id' });
        const oldHistory = await oldDb.table('history').toArray();
        if (oldHistory.length > 0) {
          await db.history.bulkAdd(oldHistory.map(({ id, ...rest }) => rest as HistoryEntry));
        }
        await oldDb.delete();
      }
    } catch { /* migration optional */ }
  })();
}
