import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { user } from "@/lib/db/schema/auth";
import type { DashboardLayoutData } from "@/lib/dashboard/types";

export const dashboardPreference = sqliteTable("dashboard_preference", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  layout: text("layout", { mode: "json" })
    .$type<DashboardLayoutData>()
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).$onUpdate(
    () => new Date()
  ),
});
