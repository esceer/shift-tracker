import { snapToStep, splitDuration } from './duration';

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
