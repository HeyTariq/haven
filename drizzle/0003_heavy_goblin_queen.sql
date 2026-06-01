CREATE TABLE `bulletin_ack` (
	`post_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`post_id`, `user_id`),
	FOREIGN KEY (`post_id`) REFERENCES `bulletin_post`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `bulletin_ack_post_idx` ON `bulletin_ack` (`post_id`);--> statement-breakpoint
CREATE TABLE `bulletin_post` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`body` text NOT NULL,
	`category` text DEFAULT 'general' NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`expires_at` integer,
	`owner_id` text NOT NULL,
	`visibility` text DEFAULT 'shared' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `bulletin_post_pinned_idx` ON `bulletin_post` (`pinned`);--> statement-breakpoint
CREATE INDEX `bulletin_post_created_idx` ON `bulletin_post` (`created_at`);--> statement-breakpoint
CREATE INDEX `bulletin_post_expires_idx` ON `bulletin_post` (`expires_at`);