import { eq, asc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";
import { wishlistItem } from "./schema";
import type { User } from "@/lib/auth";

const priorityOrder = sql<number>`case when ${wishlistItem.priority} = 'high' then 1 when ${wishlistItem.priority} = 'medium' then 2 else 3 end`;

export async function getMyItems(user: User) {
  return db
    .select()
    .from(wishlistItem)
    .where(eq(wishlistItem.userId, user.id))
    .orderBy(priorityOrder, asc(wishlistItem.createdAt));
}

export async function getAllItemsGroupedByUser() {
  return db
    .select({
      id: wishlistItem.id,
      name: wishlistItem.name,
      description: wishlistItem.description,
      url: wishlistItem.url,
      price: wishlistItem.price,
      priority: wishlistItem.priority,
      createdAt: wishlistItem.createdAt,
      userId: userTable.id,
      userName: userTable.name,
      userImage: userTable.image,
    })
    .from(wishlistItem)
    .innerJoin(userTable, eq(wishlistItem.userId, userTable.id))
    .orderBy(asc(userTable.name), priorityOrder, asc(wishlistItem.createdAt));
}

export async function getUserItems(userId: string) {
  return db
    .select()
    .from(wishlistItem)
    .where(eq(wishlistItem.userId, userId))
    .orderBy(priorityOrder, asc(wishlistItem.createdAt));
}
