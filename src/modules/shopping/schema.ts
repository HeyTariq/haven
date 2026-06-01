import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";
import { user } from "@/lib/db/schema/auth";

export const shoppingList = sqliteTable(
  "shopping_list",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    visibility: text("visibility", { enum: ["shared", "private"] })
      .notNull()
      .default("shared"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (t) => [index("shopping_list_owner_idx").on(t.ownerId)]
);

export const shoppingItem = sqliteTable(
  "shopping_item",
  {
    id: text("id").primaryKey(),
    listId: text("list_id")
      .notNull()
      .references(() => shoppingList.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    quantity: text("quantity"),
    checked: integer("checked", { mode: "boolean" }).notNull().default(false),
    addedBy: text("added_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (t) => [index("shopping_item_list_idx").on(t.listId)]
);

export const shoppingListRelations = relations(shoppingList, ({ many }) => ({
  items: many(shoppingItem),
}));

export const shoppingItemRelations = relations(shoppingItem, ({ one }) => ({
  list: one(shoppingList, {
    fields: [shoppingItem.listId],
    references: [shoppingList.id],
  }),
}));
