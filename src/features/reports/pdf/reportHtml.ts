/** One day in the printed calendar, already formatted and coloured. */
export interface CalendarCell {
  day: string;
  /** Hours worked ("8 ó"), the absence ("Szabadság") or "–" for days off. */
  value: string;
  background: string;
  valueColor: string;
}

/** One month as Monday-first weeks; `null` pads days outside the month. */
export interface CalendarMonth {
  title: string;
  weeks: (CalendarCell | null)[][];
}

/** Fully formatted, translated content of a printable report. */
export interface ReportDocument {
  language: string;
  appName: string;
  title: string;
  generatedOn: string;
  summary: { label: string; value: string }[];
  /** Per-month balances (quarter reports only). */
  months: { label: string; value: string }[];
  daysOffTitle: string;
  daysOff: { label: string; value: string }[];
  calendarTitle: string;
  weekdays: string[];
  calendars: CalendarMonth[];
  legend: { label: string; color: string }[];
  changesTitle: string;
  columns: { date: string; type: string; note: string; change: string };
  changes: { date: string; type: string; note: string; change: string }[];
  noChanges: string;
}

const escape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

const tiles = (items: { label: string; value: string }[], cls = '') =>
  `<div class="tiles">${items
    .map(
      (i) =>
        `<div class="tile ${cls}"><div class="label">${escape(i.label)}</div><div class="value">${escape(i.value)}</div></div>`,
    )
    .join('')}</div>`;

const calendar = (month: CalendarMonth, weekdays: string[]) => `
  <section class="month">
    <h3>${escape(month.title)}</h3>
    <table class="cal">
      <thead><tr>${weekdays.map((d) => `<th>${escape(d)}</th>`).join('')}</tr></thead>
      <tbody>${month.weeks
        .map(
          (week) =>
            `<tr>${week
              .map((cell) =>
                cell
                  ? `<td style="background:${cell.background}"><div class="d">${escape(cell.day)}</div><div class="v" style="color:${cell.valueColor}">${escape(cell.value)}</div></td>`
                  : '<td class="empty"></td>',
              )
              .join('')}</tr>`,
        )
        .join('')}</tbody>
    </table>
  </section>`;

/** A4 HTML in the app's Bento style, for expo-print. */
export function buildReportHtml(doc: ReportDocument): string {
  const rows = doc.changes
    .map(
      (c) =>
        `<tr><td>${escape(c.date)}</td><td>${escape(c.type)}</td><td>${escape(c.note)}</td><td class="num">${escape(c.change)}</td></tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="${escape(doc.language)}">
<head>
<meta charset="utf-8">
<title>${escape(doc.title)}</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: -apple-system, Roboto, "Segoe UI", sans-serif; color: #1B1A2E; font-size: 11pt; }
  .app { color: #4A4860; font-size: 10pt; }
  h1 { font-size: 22pt; margin: 2mm 0 6mm; }
  h2 { font-size: 13pt; margin: 8mm 0 3mm; }
  .tiles { display: flex; gap: 3mm; }
  .tile { flex: 1; background: #F0EEF6; border-radius: 4mm; padding: 3mm 4mm; }
  .tile.highlight:last-child { background: #E4DDFF; }
  .label { color: #4A4860; font-size: 9pt; }
  .value { font-size: 15pt; font-weight: 700; margin-top: 1mm; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; color: #4A4860; font-size: 9pt; font-weight: 600; border-bottom: 1px solid #D9D6E3; padding: 2mm; }
  td { border-bottom: 1px solid #F0EEF6; padding: 2mm; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; }
  .muted { color: #4A4860; }
  .month { page-break-inside: avoid; margin-bottom: 4mm; }
  h3 { font-size: 11pt; margin: 3mm 0 2mm; }
  table.cal { table-layout: fixed; border-collapse: separate; border-spacing: 1.2mm; margin: 0 -1.2mm; }
  table.cal th { border: none; text-align: center; padding: 0 0 1mm; }
  table.cal td { border: none; border-radius: 2mm; height: 12mm; padding: 1.2mm 1.6mm; }
  table.cal td.empty { background: transparent; }
  .d { font-weight: 700; font-size: 10pt; }
  .v { font-size: 8.5pt; margin-top: 0.5mm; white-space: nowrap; overflow: hidden; }
  .legend { display: flex; flex-wrap: wrap; gap: 2mm; margin-top: 1mm; font-size: 9pt; }
  .legend span { border-radius: 9mm; padding: 0.8mm 3mm; }
</style>
</head>
<body>
  <div class="app">${escape(doc.appName)} · ${escape(doc.generatedOn)}</div>
  <h1>${escape(doc.title)}</h1>
  ${tiles(doc.summary, 'highlight')}
  ${doc.months.length ? tiles(doc.months) : ''}
  <h2>${escape(doc.daysOffTitle)}</h2>
  ${tiles(doc.daysOff)}
  <h2>${escape(doc.calendarTitle)}</h2>
  ${doc.calendars.map((month) => calendar(month, doc.weekdays)).join('')}
  <div class="legend">${doc.legend
    .map((l) => `<span style="background:${l.color}">${escape(l.label)}</span>`)
    .join('')}</div>
  <h2>${escape(doc.changesTitle)}</h2>
  ${
    rows
      ? `<table><thead><tr><th>${escape(doc.columns.date)}</th><th>${escape(doc.columns.type)}</th><th>${escape(doc.columns.note)}</th><th class="num">${escape(doc.columns.change)}</th></tr></thead><tbody>${rows}</tbody></table>`
      : `<p class="muted">${escape(doc.noChanges)}</p>`
  }
</body>
</html>`;
}
