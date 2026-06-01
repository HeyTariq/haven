import { text } from "drizzle-orm/sqlite-core";
import { or, eq, type SQLWrapper, type SQL } from "drizzle-orm";
import type { User } from "./index";

// Spread into any table that supports shared/private records
export function visibilityColumns(userIdCol: string = "owner_id") {
  return {
    ownerId: text(userIdCol).notNull(),
    visibility: text("visibility", { enum: ["shared", "private"] })
      .notNull()
      .default("shared"),
  };
}

// Use in .where() to filter records the user is allowed to read
export function visibleFilter(
  ownerIdCol: SQLWrapper,
  visibilityCol: SQLWrapper,
  userId: string
): SQL {
  return or(eq(visibilityCol, "shared"), eq(ownerIdCol, userId))!;
}

// Throws if the user cannot mutate the record (must own it or be admin)
export function assertCanMutate(
  record: { ownerId: string; visibility: string },
  user: User
): void {
  // admins can mutate shared records but NOT private records belonging to others
  const isOwner = record.ownerId === user.id;
  if (!isOwner && record.visibility === "private") {
    throw new Error("Forbidden");
  }
  if (!isOwner && user.role !== "admin") {
    throw new Error("Forbidden");
  }
}
