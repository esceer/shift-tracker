import { z } from 'zod';

import type { WorkdaySwap } from '@/domain/types';

const responseSchema = z.record(z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.enum(['work', 'rest']));

export type SwapFetcher = () => Promise<WorkdaySwap[]>;

/**
 * Hungarian swapped days (áthelyezett munkanapok) from `data/hu-workday-swaps.json` in this
 * repository: `{ "2026-01-02": "rest", "2026-01-10": "work" }`. Update it when the yearly
 * decree comes out; the app picks it up on the next sync.
 */
export const fetchHungarianWorkdaySwaps: SwapFetcher = async () => {
  const response = await fetch(
    'https://raw.githubusercontent.com/esceer/shift-tracker/main/data/hu-workday-swaps.json',
  );
  if (!response.ok) throw new Error(`Swapped days file responded ${response.status}`);
  return parseWorkdaySwaps(await response.json());
};

export function parseWorkdaySwaps(json: unknown): WorkdaySwap[] {
  return Object.entries(responseSchema.parse(json))
    .map(([date, kind]) => ({ date, kind }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
