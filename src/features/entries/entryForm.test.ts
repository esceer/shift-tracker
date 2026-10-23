import { initialForm, stepForm, toEntry, workedMinutes } from './entryForm';

const date = '2026-10-28';

describe('entryForm', () => {
  it('starts as a change at the planned hours', () => {
    expect(initialForm(undefined, 360)).toEqual({ kind: 'actual', workedMinutes: 360, note: '' });
  });

  it('loads older +/- adjustments as hours worked', () => {
    const form = initialForm({ date, kind: 'adjustment', minutes: -120, note: 'Leave early' }, 480);
    expect(form).toEqual({ kind: 'actual', workedMinutes: 360, note: 'Leave early' });
  });

  it('loads hours worked and absences', () => {
    expect(initialForm({ date, kind: 'actual', minutes: 570, note: null }, 480).workedMinutes).toBe(
      570,
    );
    expect(initialForm({ date, kind: 'vacation', minutes: null, note: null }, 360)).toMatchObject({
      kind: 'vacation',
      workedMinutes: 360,
    });
  });

  it('steps in 15 minutes between 0 and 24 hours', () => {
    let form = initialForm(undefined, 30);
    form = stepForm(form, -1);
    expect(form.workedMinutes).toBe(15);
    form = stepForm(form, -5);
    expect(form.workedMinutes).toBe(0);
    form = stepForm(form, 200);
    expect(form.workedMinutes).toBe(1440);
  });

  it('counts absences as the planned hours', () => {
    expect(workedMinutes({ kind: 'sick', workedMinutes: 0, note: '' }, 480)).toBe(480);
    expect(workedMinutes({ kind: 'actual', workedMinutes: 300, note: '' }, 480)).toBe(300);
  });

  it('saves hours worked, or the absence', () => {
    const form = stepForm(initialForm(undefined, 480), -8);
    expect(toEntry({ ...form, note: '  ' }, date, 480)).toEqual({
      date,
      kind: 'actual',
      minutes: 360,
      note: null,
    });
    expect(toEntry({ ...form, kind: 'vacation' }, date, 480)).toEqual({
      date,
      kind: 'vacation',
      minutes: null,
      note: null,
    });
  });

  it('has nothing to save when the hours equal the plan', () => {
    expect(toEntry(initialForm(undefined, 480), date, 480)).toBeNull();
  });
});
