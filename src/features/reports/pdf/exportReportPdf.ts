import { File, Paths } from 'expo-file-system';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import type { TFunction } from 'i18next';

import { db } from '@/data/db';
import { readReportExport } from '@/data/queries';
import { periodRange, toISODate } from '@/domain/dates';
import type { Period } from '@/domain/types';
import type { Language } from '@/i18n/language';
import { capitalize, formatDate, formatDuration, formatPeriod } from '@/lib/format';

import { buildReportHtml, type ReportDocument } from './reportHtml';

function buildDocument(period: Period, t: TFunction, language: Language): ReportDocument {
  const { report, months, changes } = readReportExport(db, period);
  const duration = (minutes: number, signed = false) => formatDuration(minutes, t, { signed });

  return {
    language,
    appName: 'Hetes',
    title: `${t('export.reportTitle')} · ${formatPeriod(period, t, language)}`,
    generatedOn: t('export.generated', { date: formatDate(toISODate(new Date()), language) }),
    summary: [
      { label: t('export.scheduled'), value: duration(report.scheduledMinutes) },
      { label: t('export.worked'), value: duration(report.workedMinutes) },
      { label: t('export.balance'), value: duration(report.balanceMinutes, true) },
    ],
    months: months.map((m) => ({
      label: capitalize(formatDate(periodRange(m.period).start, language, 'month')),
      value: duration(m.balanceMinutes, true),
    })),
    daysOffTitle: t('reports.daysOff'),
    daysOff: (['vacation', 'sick', 'holiday'] as const).map((kind) => ({
      label: t(`entryKind.${kind}`),
      value: String(report.absenceDays[kind]),
    })),
    changesTitle: t('reports.changes'),
    columns: {
      date: t('export.date'),
      type: t('export.type'),
      note: t('export.note'),
      change: t('export.change'),
    },
    changes: changes.map(({ date, entry, deltaMinutes }) => ({
      date: formatDate(date, language, 'dayShort'),
      type: t(`entryKind.${entry!.kind}`),
      note: entry!.note ?? '',
      change: entry!.minutes === null ? '' : duration(deltaMinutes, true),
    })),
    noChanges: t('reports.noChanges'),
  };
}

/** Renders the period's report to a PDF and opens the share sheet. */
export async function exportReportPdf(
  period: Period,
  t: TFunction,
  language: Language,
): Promise<void> {
  const html = buildReportHtml(buildDocument(period, t, language));
  // The printed file itself is not accessible to expo-file-system, so take its bytes.
  const { base64 } = await printToFileAsync({ html, base64: true });

  // Give the file a readable name for e-mail attachments.
  const { start } = periodRange(period);
  const suffix = period.type === 'month' ? start.slice(0, 7) : `${period.year}-Q${period.quarter}`;
  const target = new File(Paths.cache, `hetes-${suffix}.pdf`);
  target.create({ overwrite: true });
  await target.write(base64!, { encoding: 'base64' });

  await shareAsync(target.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
}
