import { resolveLanguage } from './language';
import en from './locales/en.json';
import hu from './locales/hu.json';

describe('resolveLanguage', () => {
  it('prefers the user choice', () => {
    expect(resolveLanguage('en', 'hu')).toBe('en');
    expect(resolveLanguage('hu', 'en')).toBe('hu');
  });

  it('follows the device when there is no choice', () => {
    expect(resolveLanguage(null, 'hu')).toBe('hu');
    expect(resolveLanguage(null, 'de')).toBe('en');
    expect(resolveLanguage(null, undefined)).toBe('en');
  });
});

describe('locales', () => {
  const keysOf = (obj: object, prefix = ''): string[] =>
    Object.entries(obj).flatMap(([key, value]) =>
      typeof value === 'object' ? keysOf(value, `${prefix}${key}.`) : [`${prefix}${key}`],
    );

  it('has the same keys in Hungarian as in English', () => {
    expect(keysOf(hu).sort()).toEqual(keysOf(en).sort());
  });
});
