# Tempo (shift tracker)

Android app (React Native / Expo, iOS-ready) for tracking a worker's over/under-time against a standard weekly schedule.
Primary user: non-technical, Samsung flagship phone → clean, modern, friendly look.

## Product rules

- **Schedule**: weekly pattern (minutes per weekday), versioned by `effectiveFrom` date. Editing never rewrites past periods.
- **Monthly plan** (optional, per month): planned minutes for every day of that month (`planned_days`); replaces the weekly schedule for that month only. Starts from the weekly values; can be removed.
- **Day entry** (max one per date), entered as either:
  - `actual` (UI: "Módosítás"/"Adjust"): hours actually worked, editor starts at the planned hours (0–24h) → delta = actual − scheduled
  - `adjustment`: ± delta vs schedule. Legacy: still read (and in backups), never created; the editor converts it to `actual` on save
  - `vacation` | `sick` | `holiday`: whole-day absence, scheduled hours counted as fulfilled (delta 0)
- Optional note per entry. Time in 15-min steps, stored as integer **minutes**.
- **Balance is per period only** (month, quarter Q1–Q4); no carry-over. Period balance = sum of deltas for all dates in the period, future-dated entries included.
- **Public holidays (HU)**: optional (Settings toggle). Fetched from the Nager.Date API (current + next year) and cached in the DB, so they work offline. On a date with no user entry, a holiday counts as a `holiday` absence; a user entry always overrides it. No bridge/swapped working days.
- Data is local-only (the holiday sync is the only network call). Export: PDF report per month or quarter; full JSON backup/restore.
- UI languages: English + Hungarian (follows device, can be overridden in settings).

## UI style: "Bento" (chosen)

Pastel rounded tiles (radius 22–30) on an off-white background (`#F7F6FB`), dark ink text (`#1B1A2E`), floating bottom bar with a central "+" button.
Fonts: Bricolage Grotesque (headings/numbers) + DM Sans (body). Colour per kind: overtime `#F7A8A8` (numbers stay ink), less `#D6E6FF`, holiday `#CDEFDC`, vacation `#FFE7A8`, sick `#FFCF9E`, balance tile `#E4DDFF`.
Light mode only (dark mode is out of scope for now). Design board: see `docs/ARCHITECTURE.md` §4.

## Stack

Expo (managed, dev builds) · TypeScript strict · Expo Router · expo-sqlite + Drizzle ORM · date-fns · i18next · expo-print / expo-sharing · zod · Jest + RNTL · EAS Build.

## Architecture (details: `docs/ARCHITECTURE.md`)

- `src/app/`: Expo Router routes only, thin; they re-export feature screens. No tests or helpers here (every file becomes a route).
- `src/domain/`: pure TS business logic (no React/RN/DB imports). All balance math lives here, 100% unit-tested.
- `src/data/`: DB schema, migrations, repositories. The only layer that touches SQLite.
- `src/features/<name>/`: screens, components and hooks for one feature.
- `src/ui/`: design system (tokens, theme, primitives). No business logic.
- `src/i18n/`: setup + `locales/{en,hu}.json`. No hard-coded UI strings; add every key to both files (a test checks they match). Keys are type-checked against `en.json`.
- Dependency direction: `app → features → (data, ui) → domain`. Never the reverse.

## Conventions

- Dates are `YYYY-MM-DD` strings (local, no time zone); durations are integer minutes.
- Weekday index: ISO, 1 = Monday … 7 = Sunday.
- Named exports; one component per file; colocated `*.test.ts`.
- Commands: `npm run lint`, `npm run typecheck`, `npm test`. All must pass before committing.
- Schema change: edit `src/data/schema.ts`, then `npm run db:generate` (never edit generated migrations).
- Repositories are synchronous and take a `Database`; test them with `createTestDb()` (sql.js, `@jest-environment node`).
- Install packages with `npx expo install` (SDK-matched versions).
- Files (expo-file-system SDK 58): `write`/`move`/`text` are async, await them. Expo Go blocks access to other modules' cache files: read picked files via `copyToCacheDirectory: false`, take expo-print output as `base64`.
