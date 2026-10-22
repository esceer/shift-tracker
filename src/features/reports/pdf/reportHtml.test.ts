import { buildReportHtml, type ReportDocument } from './reportHtml';

const doc: ReportDocument = {
  language: 'en',
  appName: 'Shift Tracker',
  title: 'October 2026',
  generatedOn: 'Generated on 22 Oct 2026',
  summary: [
    { label: 'Scheduled', value: '126h' },
    { label: 'Worked', value: '124h' },
    { label: 'Balance', value: '−2h' },
  ],
  months: [],
  daysOffTitle: 'Days off',
  daysOff: [{ label: 'Vacation', value: '1' }],
  changesTitle: 'Changes',
  columns: { date: 'Date', type: 'Type', note: 'Note', change: 'Change' },
  changes: [{ date: 'Wed 28', type: 'Adjust', note: 'Boss <said> "go"', change: '−2h' }],
  noChanges: 'No changes',
};

describe('buildReportHtml', () => {
  it('contains the title, totals and changes', () => {
    const html = buildReportHtml(doc);
    expect(html).toContain('<h1>October 2026</h1>');
    expect(html).toContain('126h');
    expect(html).toContain('<td>Wed 28</td>');
    expect(html).not.toContain('No changes');
  });

  it('escapes user-entered notes', () => {
    expect(buildReportHtml(doc)).toContain('Boss &lt;said&gt; &quot;go&quot;');
  });

  it('shows a message when there are no changes', () => {
    expect(buildReportHtml({ ...doc, changes: [] })).toContain('<p class="muted">No changes</p>');
  });
});
