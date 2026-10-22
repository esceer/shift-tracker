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
  footer { margin-top: 10mm; color: #8A879C; font-size: 9pt; }
</style>
</head>
<body>
  <div class="app">${escape(doc.appName)}</div>
  <h1>${escape(doc.title)}</h1>
  ${tiles(doc.summary, 'highlight')}
  ${doc.months.length ? tiles(doc.months) : ''}
  <h2>${escape(doc.daysOffTitle)}</h2>
  ${tiles(doc.daysOff)}
  <h2>${escape(doc.changesTitle)}</h2>
  ${
    rows
      ? `<table><thead><tr><th>${escape(doc.columns.date)}</th><th>${escape(doc.columns.type)}</th><th>${escape(doc.columns.note)}</th><th class="num">${escape(doc.columns.change)}</th></tr></thead><tbody>${rows}</tbody></table>`
      : `<p class="muted">${escape(doc.noChanges)}</p>`
  }
  <footer>${escape(doc.generatedOn)}</footer>
</body>
</html>`;
}
