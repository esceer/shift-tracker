import { sql } from 'drizzle-orm';
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const scheduleVersions = sqliteTable('schedule_versions', {
  id: text('id').primaryKey(),
  effectiveFrom: text('effective_from').notNull().unique(),
  monMinutes: integer('mon_minutes').notNull(),
  tueMinutes: integer('tue_minutes').notNull(),
  wedMinutes: integer('wed_minutes').notNull(),
  thuMinutes: integer('thu_minutes').notNull(),
  friMinutes: integer('fri_minutes').notNull(),
  satMinutes: integer('sat_minutes').notNull(),
  sunMinutes: integer('sun_minutes').notNull(),
  /** Munkarend: legally required minutes per working day. */
  dailyMinutes: integer('daily_minutes').notNull().default(480),
});

export const dayEntries = sqliteTable(
  'day_entries',
  {
    date: text('date').primaryKey(),
    kind: text('kind', {
      enum: ['adjustment', 'actual', 'vacation', 'sick', 'holiday'],
    }).notNull(),
    minutes: integer('minutes'),
    note: text('note'),
  },
  (table) => [
    // Adjustment/actual entries carry minutes; absences never do.
    check(
      'day_entries_minutes_by_kind',
      sql`(${table.kind} IN ('adjustment', 'actual')) = (${table.minutes} IS NOT NULL)`,
    ),
  ],
);

export const publicHolidays = sqliteTable('public_holidays', {
  date: text('date').primaryKey(),
  name: text('name').notNull(),
});

/** Swapped days (áthelyezett munkanapok), synced together with the public holidays. */
export const workdaySwaps = sqliteTable('workday_swaps', {
  date: text('date').primaryKey(),
  kind: text('kind', { enum: ['work', 'rest'] }).notNull(),
});

/** Key/value app settings; values are JSON-encoded. */
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

/** Day-by-day plan for months that don't follow the weekly schedule (every day of the month). */
export const plannedDays = sqliteTable(
  'planned_days',
  {
    date: text('date').primaryKey(),
    minutes: integer('minutes').notNull(),
  },
  (table) => [check('planned_days_minutes_range', sql`${table.minutes} BETWEEN 0 AND 1440`)],
);
