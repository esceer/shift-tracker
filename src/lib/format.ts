import { format } from 'date-fns';
import { enGB, hu } from 'date-fns/locale';
import type { TFunction } from 'i18next';

import { fromISODate, monthsInPeriod, periodRange } from '@/domain/dates';
import { splitDuration } from '@/domain/duration';
import type { ISODate, Minutes, Period } from '@/domain/types';
import type { Language } from '@/i18n/language';

const dateLocales = { en: enGB, hu };

const signPrefix = (sign: number, signed: boolean) =>
  !signed || sign === 0 ? '' : sign > 0 ? '+' : '−';

/**
 * "6h", "2h 45m", "45m" / "6 óra", "2 óra 45 perc" (localized). With `signed`, non-zero values
 * get "+" or "−"; `short` uses abbreviated units where they differ ("2 ó 45 p").
 */
export function formatDuration(
  minutes: Minutes,
  t: TFunction,
  { signed = false, short = false } = {},
): string {
  const { sign, hours: h, minutes: m } = splitDuration(minutes);
  const keys = short ? 'durationShort' : 'duration';
  const body =
    h && m
      ? t(`${keys}.hoursMinutes`, { h, m })
      : m
        ? t(`${keys}.minutes`, { m })
        : t(`${keys}.hours`, { h });
  return signPrefix(sign, signed) + body;
}

/** Short form for small cells: "8h", "+1:30", "−0:45". */
export function formatDurationCompact(
  minutes: Minutes,
  t: TFunction,
  { signed = false } = {},
): string {
  const { sign, hours: h, minutes: m } = splitDuration(minutes);
  const body = m ? `${h}:${String(m).padStart(2, '0')}` : t('durationShort.hours', { h });
  return signPrefix(sign, signed) + body;
}

const datePatterns = {
  /** "1 Oct 2026" / "2026. okt. 1." */
  medium: { en: 'PP', hu: 'PP' },
  /** "Wednesday, 28 Oct" / "október 28., szerda" */
  dayTitle: { en: 'EEEE, d MMM', hu: 'MMMM d., EEEE' },
  /** "Wed 28" / "okt. 28." */
  dayShort: { en: 'EEE d', hu: 'MMM d.' },
  /** "October" / "október" */
  month: { en: 'LLLL', hu: 'LLLL' },
  /** "Oct" / "okt." */
  monthShort: { en: 'LLL', hu: 'LLL' },
  /** "October 2026" / "2026. október" */
  monthYear: { en: 'LLLL yyyy', hu: 'yyyy. LLLL' },
} as const;

export type DateStyle = keyof typeof datePatterns;

export function formatDate(date: ISODate, language: Language, style: DateStyle = 'medium'): string {
  return format(fromISODate(date), datePatterns[style][language], {
    locale: dateLocales[language],
  });
}

/** Uppercases the first letter (Hungarian month and day names are lowercase). */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "October 2026" / "2026. október", or "Q3 · Jul – Sep 2026" / "2026. 3. negyedév · júl. – szept.". */
export function formatPeriod(period: Period, t: TFunction, language: Language): string {
  const start = (p: Period) => periodRange(p).start;
  if (period.type === 'month') return capitalize(formatDate(start(period), language, 'monthYear'));
  const months = monthsInPeriod(period);
  return t('reports.quarterTitle', {
    quarter: period.quarter,
    year: period.year,
    from: formatDate(start(months[0]!), language, 'monthShort'),
    to: formatDate(start(months[2]!), language, 'monthShort'),
  });
}
