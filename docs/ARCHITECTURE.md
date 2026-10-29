# Architecture & Implementation Plan

## 1. Domain model

```ts
type ISODate = string; // 'YYYY-MM-DD'
type Minutes = number; // integer, multiple of 15
type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7; // ISO, Mon = 1

interface ScheduleVersion {
  id: string;
  effectiveFrom: ISODate; // active until the next version's effectiveFrom
  minutesByWeekday: Record<Weekday, Minutes>; // the usual hours (the plan)
}

interface LegalRules {
  dailyMinutes: Minutes; // munkarend setting: required minutes per working day (480 | 360 | 240)
  holidays: Set<ISODate>; // empty while holiday sync is off
  swaps: Map<ISODate, 'work' | 'rest'>; // empty while holiday sync is off
}

interface WorkdaySwap {
  date: ISODate; // primary key
  kind: 'work' | 'rest'; // áthelyezett munkanap (working Saturday) | áthelyezett pihenőnap
}

type EntryKind = 'adjustment' | 'actual' | 'vacation' | 'sick' | 'holiday';

interface DayEntry {
  date: ISODate; // primary key: one entry per day
  kind: EntryKind;
  minutes: Minutes | null; // delta (adjustment, may be negative) | worked (actual) | null (absences)
  note: string | null;
}

interface PublicHoliday {
  date: ISODate; // primary key
  name: string; // localName from the API (Hungarian)
  countryCode: 'HU';
}

type Period =
  | { type: 'month'; year: number; month: number } // 1–12
  | { type: 'quarter'; year: number; quarter: 1 | 2 | 3 | 4 };

interface PeriodReport {
  period: Period;
  scheduledMinutes: Minutes; // sum of the plan over the period
  requiredMinutes: Minutes; // sum of the legally required time
  workedMinutes: Minutes; // sum of worked(d)
  balanceMinutes: Minutes; // workedMinutes − requiredMinutes
  absenceDays: Record<'vacation' | 'sick' | 'holiday', number>;
  entries: DayEntry[];
}
```

### Calculation rules (`src/domain/balance.ts`)

For each date `d` in the period:

- Active version: the schedule version with the greatest `effectiveFrom ≤ d` (none → plan and required are 0)
- `scheduled(d)` (the plan): the monthly plan's minutes if `d` has one; else on a swapped rest day 0, on a swapped working day `dailyMinutes`; else the version's minutes for that weekday
- `required(d)` (törvényes munkaidő): before the first schedule version → 0; swapped rest day → 0; swapped working day → `dailyMinutes`; public holiday → 0; Mon–Fri → `dailyMinutes`; weekend → 0. Holidays and swaps apply only while holiday sync is on.
- Effective entry for `d`: the user entry if there is one; otherwise, if holiday sync is on and `d` is a public holiday, a virtual `holiday` entry; otherwise none
- `delta(d)` (vs the plan; shown in change lists and the entry editor):
  - no entry → 0
  - `adjustment` → `minutes`
  - `actual` → `minutes − scheduled(d)`
  - absence → 0
- `worked(d)`: absence → `required(d)`; otherwise `scheduled(d) + delta(d)`
- Absence days (`absenceDays`) are counted only on scheduled working days. Synced holidays appear in report entry lists (marked as synced) except when they fall on a day off.
- A period's balance is `Σ worked(d) − Σ required(d)` over its dates (untouched future days count as planned, so it is a forecast for the period). A quarter equals the sum of its three months.

## 2. Folder structure

```
src/app/                          # Expo Router routes only (re-export feature screens; no tests here)
  _layout.tsx                     # providers: DB, i18n, fonts; runs migrations
  onboarding/index.tsx            # first launch, step 1: welcome + language
  onboarding/schedule.tsx         # first launch, step 2: usual week
  (tabs)/
    _layout.tsx                   # floating tab bar; redirects to onboarding when no schedule exists
    index.tsx                     # Home: current-month balance + upcoming/recent entries
    calendar.tsx                  # month calendar, tap a day to edit
    reports.tsx                   # month/quarter switcher, report + export
    settings.tsx
  entry/[date].tsx                # modal/bottom sheet: create/edit/delete a day entry
  schedule.tsx                    # edit the usual week from a chosen date (adds/updates a version)
src/
  domain/
    types.ts
    dates.ts                      # period ranges, iterate days, weekday helpers
    schedule.ts                   # resolve the active version for a date
    holidays.ts                   # merge user entries + public holidays → effective entries
    balance.ts                    # delta per day, buildPeriodReport()
    duration.ts                   # minutes ↔ {h, m}, rounding to 15
    *.test.ts
  data/
    database.ts                   # `Database` type: any sync Drizzle SQLite db (expo-sqlite in app, sql.js in tests)
    db.ts                         # open expo-sqlite, drizzle instance, useDatabaseMigrations()
    testDb.ts                     # in-memory sql.js db with migrations applied (tests only)
    schema.ts                     # drizzle tables: schedule_versions, day_entries, public_holidays, planned_days, settings
    migrations/                   # drizzle-kit generated
    queries.ts                    # combined reads: readDays, readPeriodReport, readUpcoming, readDayForEditing
    live.ts                       # useLiveData(): sync read + re-read on table change; useScheduleVersions(), useSettings()
    repositories/
      scheduleRepository.ts
      entryRepository.ts
      settingsRepository.ts
      holidayRepository.ts
    holidays/
      nagerClient.ts              # GET date.nager.at/api/v3/PublicHolidays/{year}/HU, zod-validated
      syncHolidays.ts             # fetch current + next year → replace cached rows; store lastSyncedAt
    backup/
      backup.ts                   # buildBackup() / restoreBackup(): versioned JSON, zod-validated, all-or-nothing
  features/
    home/          (HomeScreen, BalanceHero, EntryList, hooks/useMonthReport)
    calendar/      (CalendarScreen, MonthGrid, DayCell)
    entries/       (EntryEditor, KindSelector, DurationStepper, hooks/useDayEntry)
    schedule/      (ScheduleListScreen, ScheduleEditor, WeekdayRow)
    reports/       (ReportsScreen; pdf/reportHtml.ts → HTML, pdf/exportReportPdf.ts → print + share)
    settings/      (SettingsScreen, HolidaySyncTile, BackupTile)
    onboarding/
  ui/
    theme/        (tokens.ts: colors, tints, radius, spacing, typography; fonts.ts; light only)
    components/   (Screen, Text, Icon, Tile, Button, IconButton, SegmentedControl, Stepper, ListRow, FloatingTabBar)
  i18n/
    index.ts      (i18next + expo-localization)
    locales/en.json, hu.json
  lib/            (formatDuration, formatDate: locale-aware, thin wrappers)
```

**Dependency rule:** `app → features → data/ui → domain`. `domain` is pure and framework-free. Features never import each other's internals; shared code moves to `ui`, `lib` or `domain`.

## 3. Key technical decisions

| Concern         | Choice                                                                                                                                   | Why                                                                                                                                                                                                                                                              |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | Expo (managed) + dev builds                                                                                                              | Easiest Android build path, same codebase for iOS later                                                                                                                                                                                                          |
| Navigation      | Expo Router (file-based)                                                                                                                 | Current standard, typed routes                                                                                                                                                                                                                                   |
| Persistence     | expo-sqlite + Drizzle ORM 0.45 (sync API)                                                                                                | Relational data, typed queries, generated migrations, `useLiveQuery` for reactive UI                                                                                                                                                                             |
| State           | DB is the source of truth; live queries + small hooks                                                                                    | No global store needed; settings via a React context                                                                                                                                                                                                             |
| Dates           | date-fns (+ `hu` / `enUS` locales)                                                                                                       | Tree-shakeable, string dates without time zone issues                                                                                                                                                                                                            |
| i18n            | i18next + react-i18next + expo-localization                                                                                              | De facto standard                                                                                                                                                                                                                                                |
| PDF             | expo-print (HTML → PDF) + expo-sharing                                                                                                   | No native PDF lib needed                                                                                                                                                                                                                                         |
| Public holidays | Nager.Date API (free, no key), cached in SQLite; swapped days from `data/hu-workday-swaps.json` in this repo (raw.githubusercontent.com) | Works offline after one sync. Synced on toggle-on, via "Sync now", and automatically on app start when next year is missing or the last sync is over 30 days old (failures are silent; cached data is kept). Update the JSON when the yearly decree is published |
| Backup          | JSON via expo-file-system + expo-sharing / expo-document-picker, validated with zod                                                      | Safe restore, versioned format                                                                                                                                                                                                                                   |
| Styling         | Custom design system on StyleSheet + theme tokens; Reanimated for motion                                                                 | Full control over the Bento look (§4)                                                                                                                                                                                                                            |
| Quality         | TS strict, ESLint (expo config), Prettier, Jest + React Native Testing Library                                                           |                                                                                                                                                                                                                                                                  |
| Build           | EAS Build → APK (internal) / AAB                                                                                                         |                                                                                                                                                                                                                                                                  |

## 4. UX outline

Chosen style: **Bento** (see CLAUDE.md for tokens). Mockups: https://claude.ai/artifact/148p56wFEu6QjUiPmasrqx (private; row "C · Bento").

- Light mode only for now (all colours live in theme tokens, so dark mode can be added later).
- Tile colour encodes entry kind everywhere (calendar cells, list items, report tiles).
- Navigation: floating bottom bar (Home, Calendar, central "+" Add change, Reports, Settings).
- **Home**: balance tile for the current month, "next change" and "next holiday" tiles, this-week strip.
- **Add change**: day picker, kind tiles (Adjust / Actual / Vacation / Sick / Holiday), Less/More toggle, ± stepper in 15-min steps, "scheduled → you'll work" preview, note.
- **Calendar**: month grid coloured by kind (a cell shows the hours worked, or the planned hours if unchanged), legend, selected-day tile with Edit.
- **Reports**: Month/Quarter toggle, period navigation, balance tile, per-month tiles, days-off tiles, "Export PDF".
- **Settings**: work schedule tile (opens editor), Hungarian holidays toggle + "Sync now", language, export/restore backup.
- **Onboarding**: Welcome (language) → Usual week (also used as the schedule editor).

## 5. Implementation milestones

| #   | Milestone                                                           | Verification                                                                                                              |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 1   | Expo scaffold, TS strict, lint/format/test tooling, folder skeleton | `lint`, `typecheck` and `test` pass; app boots on an emulator                                                             |
| 2   | `domain/` (dates, schedule resolution, balance, duration)           | Unit tests cover all entry kinds, schedule version switch mid-period, quarter = sum of months, leap year                  |
| 3   | `data/`: schema, migrations, repositories                           | Repository tests against an in-memory DB; migrations run on cold start                                                    |
| 4   | i18n + theme tokens + `ui/` primitives                              | EN/HU switch works; primitives match the Bento mockups                                                                    |
| 5   | Onboarding + schedule screens                                       | A new install forces schedule setup; a new version doesn't change past reports                                            |
| 6   | Entry editor + Home + Calendar                                      | Add/edit/delete entries updates the balance live                                                                          |
| 7   | Reports (month/quarter)                                             | Numbers match the domain tests for seeded data                                                                            |
| 7b  | Public holiday sync                                                 | Toggle on → HU holidays appear in the calendar; a user entry on a holiday overrides it; works in airplane mode after sync |
| 8   | PDF export + JSON backup/restore                                    | PDF opens in the share sheet; export → wipe → import round-trips identically                                              |
| 9   | EAS build (APK)                                                     | Installs and runs on the Samsung device                                                                                   |

## 6. Assumptions (confirm or correct)

- Hungarian public holidays and swapped days come from the optional sync; holidays for other countries are out of scope (they can be entered by hand).
- Munkarend is 8h, 6h or 4h on Mon–Fri (general work schedule), one setting without history; backups from before the setting restore as 8h.
- Public holidays are not part of the JSON backup; they are re-synced after a restore.
- Absences are whole-day only.
- Before the first schedule version's `effectiveFrom`, the schedule is 0 h/day.
