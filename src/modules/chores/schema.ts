import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";
import { user } from "@/lib/db/schema/auth";

export const chore = sqliteTable(
  "chore",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    assignedToUserId: text("assigned_to_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    recurrence: text("recurrence", {
      enum: ["none", "daily", "weekly", "monthly"],
    })
      .notNull()
      .default("none"),
    dueDate: integer("due_date", { mode: "timestamp_ms" }),
    points: integer("points").notNull().default(0),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (t) => [
    index("chore_assigned_idx").on(t.assignedToUserId),
    index("chore_due_date_idx").on(t.dueDate),
  ]
);

export const choreCompletion = sqliteTable(
  "chore_completion",
  {
    id: text("id").primaryKey(),
    choreId: text("chore_id")
      .notNull()
      .references(() => chore.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    completedAt: integer("completed_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (t) => [index("chore_completion_chore_idx").on(t.choreId)]
);

export const choreRelations = relations(chore, ({ many }) => ({
  completions: many(choreCompletion),
}));

export const choreCompletionRelations = relations(
  choreCompletion,
  ({ one }) => ({
    chore: one(chore, {
      fields: [choreCompletion.choreId],
      references: [chore.id],
    }),
  })
);
