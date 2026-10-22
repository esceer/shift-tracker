import { mergeEntries } from './holidays';
import type { DayEntry, PublicHoliday } from './types';

const holidays: PublicHoliday[] = [
  { date: '2026-10-23', name: 'Nemzeti ünnep' },
  { date: '2026-11-01', name: 'Mindenszentek' },
];
const workedOnHoliday: DayEntry = {
  date: '2026-10-23',
  kind: 'actual',
  minutes: 240,
  note: null,
};

describe('mergeEntries', () => {
  it('adds synced holidays as virtual holiday entries', () => {
    expect(mergeEntries([], holidays, true)).toEqual([
      { date: '2026-10-23', kind: 'holiday', minutes: null, note: 'Nemzeti ünnep', synced: true },
      { date: '2026-11-01', kind: 'holiday', minutes: null, note: 'Mindenszentek', synced: true },
    ]);
  });

  it('lets a user entry override a holiday', () => {
    const merged = mergeEntries([workedOnHoliday], holidays, true);
    expect(merged).toHaveLength(2);
    expect(merged[0]).toEqual({ ...workedOnHoliday, synced: false });
  });

  it('ignores holidays when sync is off', () => {
    expect(mergeEntries([workedOnHoliday], holidays, false)).toEqual([
      { ...workedOnHoliday, synced: false },
    ]);
  });

  it('sorts by date', () => {
    const early: DayEntry = { date: '2026-10-01', kind: 'sick', minutes: null, note: null };
    const dates = mergeEntries([workedOnHoliday, early], holidays, true).map((e) => e.date);
    expect(dates).toEqual(['2026-10-01', '2026-10-23', '2026-11-01']);
  });
});
