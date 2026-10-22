CREATE TABLE `day_entries` (
	`date` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`minutes` integer,
	`note` text,
	CONSTRAINT "day_entries_minutes_by_kind" CHECK(("day_entries"."kind" IN ('adjustment', 'actual')) = ("day_entries"."minutes" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE `public_holidays` (
	`date` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `schedule_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`effective_from` text NOT NULL,
	`mon_minutes` integer NOT NULL,
	`tue_minutes` integer NOT NULL,
	`wed_minutes` integer NOT NULL,
	`thu_minutes` integer NOT NULL,
	`fri_minutes` integer NOT NULL,
	`sat_minutes` integer NOT NULL,
	`sun_minutes` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schedule_versions_effective_from_unique` ON `schedule_versions` (`effective_from`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
