import { eq, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";
import { shoppingList, shoppingItem } from "./schema";
import { visibleFilter } from "@/lib/auth/visibility";
import type { User } from "@/lib/auth";

export async function getLists(user: User) {
  return db
    .select({
      id: shoppingList.id,
      name: shoppingList.name,
      createdBy: shoppingList.createdBy,
      ownerId: shoppingList.ownerId,
      visibility: shoppingList.visibility,
      createdAt: shoppingList.createdAt,
      createdByName: userTable.name,
    })
    .from(shoppingList)
    .leftJoin(userTable, eq(shoppingList.createdBy, userTable.id))
    .where(visibleFilter(shoppingList.ownerId, shoppingList.visibility, user.id))
    .orderBy(desc(shoppingList.createdAt))
    .limit(500);
}

export async function getListsWithCounts(user: User) {
  return db
    .select({
      id: shoppingList.id,
      name: shoppingList.name,
      createdByName: userTable.name,
      createdAt: shoppingList.createdAt,
      totalItems: sql<number>`count(${shoppingItem.id})`,
      uncheckedItems: sql<number>`coalesce(sum(case when ${shoppingItem.checked} = 0 then 1 else 0 end), 0)`,
    })
    .from(shoppingList)
    .leftJoin(shoppingItem, eq(shoppingItem.listId, shoppingList.id))
    .leftJoin(userTable, eq(shoppingList.createdBy, userTable.id))
    .where(visibleFilter(shoppingList.ownerId, shoppingList.visibility, user.id))
    .groupBy(shoppingList.id, userTable.name)
    .orderBy(desc(shoppingList.createdAt))
    .limit(500);
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

  const [creator] = await db
    .select({ name: userTable.name })
    .from(userTable)
    .where(eq(userTable.id, list.createdBy))
    .limit(1);

  const items = await db
    .select({
      id: shoppingItem.id,
      listId: shoppingItem.listId,
      name: shoppingItem.name,
      quantity: shoppingItem.quantity,
      checked: shoppingItem.checked,
      addedBy: shoppingItem.addedBy,
      createdAt: shoppingItem.createdAt,
      addedByName: userTable.name,
    })
    .from(shoppingItem)
    .leftJoin(userTable, eq(shoppingItem.addedBy, userTable.id))
    .where(eq(shoppingItem.listId, listId))
    .orderBy(shoppingItem.createdAt);

  return { ...list, createdByName: creator?.name ?? null, items };
}
