import { buildReportHtml, type ReportDocument } from './reportHtml';

const doc: ReportDocument = {
  language: 'en',
  appName: 'Hetes',
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
  calendarTitle: 'Calendar',
  weekdays: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  calendars: [
    {
      title: 'October',
      weeks: [
        [
          null,
          null,
          null,
          { day: '1', value: '8h', background: '#F0EEF6', valueColor: '#1B1A2E' },
          { day: '2', value: 'Vacation', background: '#FFE7A8', valueColor: '#1B1A2E' },
          { day: '3', value: '–', background: '#FFFFFF', valueColor: '#8A879C' },
          { day: '4', value: '9:30', background: '#FFCFC9', valueColor: '#C5221F' },
        ],
      ],
    },
  ],
  legend: [{ label: 'Extra', color: '#FFCFC9' }],
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

  it('draws the calendar with one cell per day and padding outside the month', () => {
    const html = buildReportHtml(doc);
    expect(html).toContain('<h3>October</h3>');
    expect(html.match(/<td class="empty"><\/td>/g)).toHaveLength(3);
    expect(html).toContain('<div class="v" style="color:#C5221F">9:30</div>');
    expect(html).toContain('<span style="background:#FFCFC9">Extra</span>');
  });

  it('escapes user-entered notes', () => {
    expect(buildReportHtml(doc)).toContain('Boss &lt;said&gt; &quot;go&quot;');
  });

  it('shows a message when there are no changes', () => {
    expect(buildReportHtml({ ...doc, changes: [] })).toContain('<p class="muted">No changes</p>');
  });
});
