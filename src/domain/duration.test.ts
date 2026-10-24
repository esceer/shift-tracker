import { parseDuration, snapToStep, splitDuration, toClock } from './duration';

describe('snapToStep', () => {
  it.each([
    [0, 0],
    [7, 0],
    [8, 15],
    [44, 45],
    [-22, -15],
    [-23, -30],
  ])('%i → %i', (input, expected) => {
    expect(snapToStep(input)).toBe(expected);
  });
});

describe('splitDuration', () => {
  it('splits positive, negative and zero durations', () => {
    expect(splitDuration(165)).toEqual({ sign: 1, hours: 2, minutes: 45 });
    expect(splitDuration(-120)).toEqual({ sign: -1, hours: 2, minutes: 0 });
    expect(splitDuration(-15)).toEqual({ sign: -1, hours: 0, minutes: 15 });
    expect(splitDuration(0)).toEqual({ sign: 0, hours: 0, minutes: 0 });
  });
});

describe('parseDuration', () => {
  it.each([
    ['7:30', 450],
    ['7', 420],
    ['07:05', 420],
    ['7,5', 450],
    ['7.25', 435],
    [',5', 30],
    [' 8:00 ', 480],
    ['0', 0],
    ['24', 1440],
    ['7:40', 465],
  ])('%s → %i', (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });

  it.each(['', 'abc', '7:60', '-2', '7h', '1:2:3', '123'])('rejects %j', (input) => {
    expect(parseDuration(input)).toBeNull();
  });
});

describe('toClock', () => {
  it('formats as H:MM', () => {
    expect(toClock(450)).toBe('7:30');
    expect(toClock(0)).toBe('0:00');
    expect(toClock(1440)).toBe('24:00');
  });
});
