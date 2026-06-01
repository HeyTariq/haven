CREATE TABLE `app_setting` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `chore` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`assigned_to_user_id` text,
	`recurrence` text DEFAULT 'none' NOT NULL,
	`due_date` integer,
	`points` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`assigned_to_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `chore_assigned_idx` ON `chore` (`assigned_to_user_id`);--> statement-breakpoint
CREATE INDEX `chore_due_date_idx` ON `chore` (`due_date`);--> statement-breakpoint
CREATE TABLE `chore_completion` (
	`id` text PRIMARY KEY NOT NULL,
	`chore_id` text NOT NULL,
	`user_id` text NOT NULL,
	`completed_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`chore_id`) REFERENCES `chore`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `chore_completion_chore_idx` ON `chore_completion` (`chore_id`);