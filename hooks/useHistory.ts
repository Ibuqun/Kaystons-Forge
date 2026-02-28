'use client';

import { useCallback, useEffect, useState } from 'react';
import { db } from '@/lib/db';
import type { HistoryEntry } from '@/types';

export function useHistory(toolId: string) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  const refresh = useCallback(async () => {
    const result = await db.history.where('toolId').equals(toolId).reverse().limit(50).toArray();
    setEntries(result);
  }, [toolId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (input: string, output: string) => {
      const trimmed = input.length > 100_000 ? `${input.slice(0, 100_000)}...` : input;
      await db.history.add({ toolId, input: trimmed, output, timestamp: Date.now(), starred: false });
      const old = await db.history.where('toolId').equals(toolId).reverse().offset(50).toArray();
      if (old.length) {
        await db.history.bulkDelete(old.map((x) => x.id!).filter(Boolean));
      }
      await refresh();
    },
    [refresh, toolId],
  );

  const clear = useCallback(async () => {
    await db.history.where('toolId').equals(toolId).delete();
    await refresh();
  }, [refresh, toolId]);

  return { entries, save, clear, refresh };
}
