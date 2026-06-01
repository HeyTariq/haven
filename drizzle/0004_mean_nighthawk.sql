CREATE TABLE `dashboard_preference` (
	`user_id` text PRIMARY KEY NOT NULL,
	`layout` text NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
