'use client';

import { useMemo } from 'react';
import { toolMap } from '@/lib/tools/registry';

export function useTool(toolId: string) {
  return useMemo(() => toolMap.get(toolId), [toolId]);
}
