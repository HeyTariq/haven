import { eq, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { shoppingList, shoppingItem } from "./schema";
import { visibleFilter } from "@/lib/auth/visibility";
import type { User } from "@/lib/auth";

export async function getLists(user: User) {
  return db
    .select()
    .from(shoppingList)
    .where(visibleFilter(shoppingList.ownerId, shoppingList.visibility, user.id))
    .orderBy(desc(shoppingList.createdAt));
}

export async function getListsWithCounts(user: User) {
  return db
    .select({
      id: shoppingList.id,
      name: shoppingList.name,
      createdAt: shoppingList.createdAt,
      totalItems: sql<number>`count(${shoppingItem.id})`,
      uncheckedItems: sql<number>`coalesce(sum(case when ${shoppingItem.checked} = 0 then 1 else 0 end), 0)`,
    })
    .from(shoppingList)
    .leftJoin(shoppingItem, eq(shoppingItem.listId, shoppingList.id))
    .where(visibleFilter(shoppingList.ownerId, shoppingList.visibility, user.id))
    .groupBy(shoppingList.id)
    .orderBy(desc(shoppingList.createdAt));
}

export async function getListWithItems(listId: string, user: User) {
  const [list] = await db
    .select()
    .from(shoppingList)
    .where(eq(shoppingList.id, listId))
    .limit(1);

  if (!list) return null;

  // enforce visibility
  if (
    list.visibility === "private" &&
    list.ownerId !== user.id
  ) {
    return null;
  }

  const items = await db
    .select()
    .from(shoppingItem)
    .where(eq(shoppingItem.listId, listId))
    .orderBy(shoppingItem.createdAt);

  return { ...list, items };
}
