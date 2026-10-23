import { i18n } from '@/i18n';

import {
  capitalize,
  formatDate,
  formatDuration,
  formatDurationCompact,
  formatPeriod,
} from './format';

describe('formatDuration', () => {
  const t = i18n.getFixedT('en');

  it('formats hours, minutes and both', () => {
    expect(formatDuration(360, t)).toBe('6h');
    expect(formatDuration(45, t)).toBe('45m');
    expect(formatDuration(165, t)).toBe('2h 45m');
    expect(formatDuration(0, t)).toBe('0h');
  });

  it('adds a sign when asked', () => {
    expect(formatDuration(165, t, { signed: true })).toBe('+2h 45m');
    expect(formatDuration(-120, t, { signed: true })).toBe('−2h');
    expect(formatDuration(0, t, { signed: true })).toBe('0h');
  });

  it('uses the Hungarian units', () => {
    const hu = i18n.getFixedT('hu');
    expect(formatDuration(-165, hu, { signed: true })).toBe('−2 óra 45 perc');
    expect(formatDuration(360, hu)).toBe('6 óra');
    expect(formatDuration(-165, hu, { signed: true, short: true })).toBe('−2 ó 45 p');
  });
});

describe('formatDate', () => {
  it('formats per language', () => {
    expect(formatDate('2026-10-01', 'en')).toBe('1 Oct 2026');
    expect(formatDate('2026-10-01', 'hu')).toBe('2026. okt. 1.');
  });
});

describe('formatDurationCompact', () => {
  const t = i18n.getFixedT('en');

  it('keeps cells short', () => {
    expect(formatDurationCompact(480, t)).toBe('8h');
    expect(formatDurationCompact(90, t, { signed: true })).toBe('+1:30');
    expect(formatDurationCompact(-45, t, { signed: true })).toBe('−0:45');
    expect(formatDurationCompact(-120, t, { signed: true })).toBe('−2h');
  });
});

describe('formatDate styles', () => {
  it('formats day titles, short days and months', () => {
    expect(formatDate('2026-10-28', 'en', 'dayTitle')).toBe('Wednesday, 28 Oct');
    expect(formatDate('2026-10-28', 'hu', 'dayTitle')).toBe('október 28., szerda');
    expect(formatDate('2026-10-28', 'en', 'dayShort')).toBe('Wed 28');
    expect(formatDate('2026-10-28', 'hu', 'dayShort')).toBe('okt. 28.');
    expect(capitalize(formatDate('2026-10-28', 'hu', 'month'))).toBe('Október');
    expect(formatDate('2026-10-28', 'en', 'month')).toBe('October');
    expect(formatDate('2026-10-28', 'en', 'monthYear')).toBe('October 2026');
    expect(formatDate('2026-10-28', 'hu', 'monthYear')).toBe('2026. október');
    expect(formatDate('2026-07-01', 'en', 'monthShort')).toBe('Jul');
  });
});

describe('formatPeriod', () => {
  it('names months and quarters', () => {
    expect(formatPeriod({ type: 'month', year: 2026, month: 10 }, i18n.getFixedT('en'), 'en')).toBe(
      'October 2026',
    );
    expect(
      formatPeriod({ type: 'quarter', year: 2026, quarter: 3 }, i18n.getFixedT('en'), 'en'),
    ).toBe('Q3 · Jul – Sep 2026');
    expect(
      formatPeriod({ type: 'quarter', year: 2026, quarter: 3 }, i18n.getFixedT('hu'), 'hu'),
    ).toBe('2026. 3. negyedév · júl. – szept.');
  });
});
