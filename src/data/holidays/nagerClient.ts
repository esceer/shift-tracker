import { z } from 'zod';

import type { PublicHoliday } from '@/domain/types';

const responseSchema = z.array(
  z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    localName: z.string(),
    types: z.array(z.string()),
  }),
);

export type HolidayFetcher = (year: number) => Promise<PublicHoliday[]>;

/**
 * Hungarian public holidays for `year` from the free Nager.Date API
 * (https://date.nager.at). Names are the Hungarian ones; one holiday per date.
 */
export const fetchHungarianHolidays: HolidayFetcher = async (year) => {
  const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/HU`);
  if (!response.ok) throw new Error(`Holiday API responded ${response.status}`);
  return parseHolidays(await response.json());
};

export function parseHolidays(json: unknown): PublicHoliday[] {
  const byDate = new Map<string, PublicHoliday>();
  for (const holiday of responseSchema.parse(json)) {
    if (holiday.types.includes('Public') && !byDate.has(holiday.date)) {
      byDate.set(holiday.date, { date: holiday.date, name: holiday.localName });
    }
  }
  return [...byDate.values()];
}
