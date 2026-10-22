import { i18n } from '@/i18n';

import { formatDate, formatDuration } from './format';

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
    expect(formatDuration(-165, i18n.getFixedT('hu'), { signed: true })).toBe('−2 ó 45 p');
  });
});

describe('formatDate', () => {
  it('formats per language', () => {
    expect(formatDate('2026-10-01', 'en')).toBe('1 Oct 2026');
    expect(formatDate('2026-10-01', 'hu')).toBe('2026. okt. 1.');
  });
});
