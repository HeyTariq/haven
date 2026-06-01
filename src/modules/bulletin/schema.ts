import {
  sqliteTable,
  text,
  integer,
  index,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";
import { user } from "@/lib/db/schema/auth";

export const bulletinPost = sqliteTable(
  "bulletin_post",
  {
    id: text("id").primaryKey(),
    title: text("title"),
    body: text("body").notNull(),
    category: text("category", {
      enum: ["announcement", "event", "reminder", "general", "forsale"],
    })
      .notNull()
      .default("general"),
    priority: text("priority", { enum: ["normal", "important", "urgent"] })
      .notNull()
      .default("normal"),
    pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    // ownerId is the author; posts are always shared but reuse the visibility
    // primitive so assertCanMutate grants author/admin edit and delete.
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    visibility: text("visibility", { enum: ["shared", "private"] })
      .notNull()
      .default("shared"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (t) => [
    index("bulletin_post_pinned_idx").on(t.pinned),
    index("bulletin_post_created_idx").on(t.createdAt),
    index("bulletin_post_expires_idx").on(t.expiresAt),
  ]
);

export const bulletinAck = sqliteTable(
  "bulletin_ack",
  {
    postId: text("post_id")
      .notNull()
      .references(() => bulletinPost.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`),
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.userId] }),
    index("bulletin_ack_post_idx").on(t.postId),
  ]
);

export const bulletinPostRelations = relations(bulletinPost, ({ many }) => ({
  acks: many(bulletinAck),
}));

export const bulletinAckRelations = relations(bulletinAck, ({ one }) => ({
  post: one(bulletinPost, {
    fields: [bulletinAck.postId],
    references: [bulletinPost.id],
  }),
}));
