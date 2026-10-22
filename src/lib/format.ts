import { format } from 'date-fns';
import { enGB, hu } from 'date-fns/locale';
import type { TFunction } from 'i18next';

import { fromISODate } from '@/domain/dates';
import { splitDuration } from '@/domain/duration';
import type { ISODate, Minutes } from '@/domain/types';
import type { Language } from '@/i18n/language';

const dateLocales = { en: enGB, hu };

/** "6h", "2h 45m", "45m" (localized). With `signed`, non-zero values get "+" or "−". */
export function formatDuration(minutes: Minutes, t: TFunction, { signed = false } = {}): string {
  const { sign, hours: h, minutes: m } = splitDuration(minutes);
  const body =
    h && m
      ? t('duration.hoursMinutes', { h, m })
      : m
        ? t('duration.minutes', { m })
        : t('duration.hours', { h });
  if (!signed || sign === 0) return body;
  return `${sign > 0 ? '+' : '−'}${body}`;
}

/** Medium localized date, e.g. "1 Oct 2026" / "2026. okt. 1.". */
export function formatDate(date: ISODate, language: Language): string {
  return format(fromISODate(date), 'PP', { locale: dateLocales[language] });
}
