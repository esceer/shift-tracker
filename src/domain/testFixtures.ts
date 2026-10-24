import type { DayEntry, LegalRules, ScheduleVersion } from './types';

const h = (hours: number) => hours * 60;

/** Mon off, Tue 6h, Wed 8h, Thu 8h, Fri 6h, weekend off (28h/week). */
export const standardSchedule: ScheduleVersion = {
  id: 'v1',
  effectiveFrom: '2026-01-01',
  minutesByWeekday: { 1: 0, 2: h(6), 3: h(8), 4: h(8), 5: h(6), 6: 0, 7: 0 },
};

/** 6h munkarend (30h/week), no national calendar. */
export const partTimeRules: LegalRules = {
  dailyMinutes: h(6),
  holidays: new Set(),
  swaps: new Map(),
};

/** October 2026 entries used in the design mockups; +2h 45m vs the plan. */
export const octoberEntries: DayEntry[] = [
  { date: '2026-10-05', kind: 'adjustment', minutes: h(4), note: 'Inventory count' },
  { date: '2026-10-14', kind: 'adjustment', minutes: -h(2), note: 'Left early' },
  { date: '2026-10-15', kind: 'actual', minutes: h(9.5), note: null },
  { date: '2026-10-20', kind: 'adjustment', minutes: 75, note: 'Stayed for delivery' },
  { date: '2026-10-28', kind: 'adjustment', minutes: -h(2), note: 'Leave 2h earlier' },
];
