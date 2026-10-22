import { initialForm, setSign, stepForm, toEntry, workedMinutes } from './entryForm';

const date = '2026-10-28';

describe('entryForm', () => {
  it('starts as an empty "more" adjustment with actual hours = schedule', () => {
    expect(initialForm(undefined, 480)).toEqual({
      kind: 'adjustment',
      sign: 1,
      adjustMinutes: 0,
      actualMinutes: 480,
      note: '',
    });
  });

  it('loads an existing negative adjustment', () => {
    const form = initialForm({ date, kind: 'adjustment', minutes: -120, note: 'Leave early' }, 480);
    expect(form).toMatchObject({ sign: -1, adjustMinutes: 120, note: 'Leave early' });
    expect(workedMinutes(form, 480)).toBe(360);
  });

  it('steps in 15 minutes and never goes below 0 or past the schedule for "less"', () => {
    let form = setSign(initialForm(undefined, 60), -1, 60);
    form = stepForm(form, 3, 60);
    expect(form.adjustMinutes).toBe(45);
    form = stepForm(form, 5, 60);
    expect(form.adjustMinutes).toBe(60); // can't work less than 0h
    form = stepForm(form, -10, 60);
    expect(form.adjustMinutes).toBe(0);
  });

  it('shrinks the amount when switching to "less" on a short day', () => {
    const more = stepForm(initialForm(undefined, 60), 8, 60); // +2h
    expect(setSign(more, -1, 60).adjustMinutes).toBe(60);
  });

  it('caps a day at 24h', () => {
    const form = stepForm({ ...initialForm(undefined, 480), kind: 'actual' }, 200, 480);
    expect(form.actualMinutes).toBe(1440);
  });

  it('builds the entry to save', () => {
    const less = stepForm(setSign(initialForm(undefined, 480), -1, 480), 8, 480);
    expect(toEntry({ ...less, note: '  ' }, date)).toEqual({
      date,
      kind: 'adjustment',
      minutes: -120,
      note: null,
    });
    expect(toEntry({ ...less, kind: 'vacation' }, date)).toEqual({
      date,
      kind: 'vacation',
      minutes: null,
      note: null,
    });
    expect(toEntry({ ...less, kind: 'actual', actualMinutes: 570 }, date)).toMatchObject({
      kind: 'actual',
      minutes: 570,
    });
  });

  it('has nothing to save for a ±0 adjustment', () => {
    expect(toEntry(initialForm(undefined, 480), date)).toBeNull();
  });
});
