CREATE TABLE `workday_swaps` (
	`date` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `schedule_versions` ADD `daily_minutes` integer DEFAULT 480 NOT NULL;