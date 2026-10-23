CREATE TABLE `planned_days` (
	`date` text PRIMARY KEY NOT NULL,
	`minutes` integer NOT NULL,
	CONSTRAINT "planned_days_minutes_range" CHECK("planned_days"."minutes" BETWEEN 0 AND 1440)
);
