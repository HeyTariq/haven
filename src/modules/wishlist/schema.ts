import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";
import { user } from "@/lib/db/schema/auth";

export const wishlistItem = sqliteTable(
  "wishlist_item",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    url: text("url"),
    price: text("price"),
    priority: text("priority", { enum: ["high", "medium", "low"] })
      .notNull()
      .default("medium"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (t) => [index("wishlist_item_user_idx").on(t.userId)]
);

export const wishlistItemRelations = relations(wishlistItem, ({ one }) => ({
  user: one(user, {
    fields: [wishlistItem.userId],
    references: [user.id],
  }),
}));
