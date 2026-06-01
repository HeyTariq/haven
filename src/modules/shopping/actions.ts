"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { assertCanMutate } from "@/lib/auth/visibility";
import { shoppingList, shoppingItem } from "./schema";

function generateId() {
  return crypto.randomUUID();
}

const createListSchema = z.object({
  name: z.string().min(1).max(100),
  visibility: z.enum(["shared", "private"]).default("shared"),
});

export async function createList(formData: FormData) {
  const user = await requireUser();
  const input = createListSchema.parse({
    name: formData.get("name"),
    visibility: formData.get("visibility") ?? "shared",
  });

  await db.insert(shoppingList).values({
    id: generateId(),
    name: input.name,
    createdBy: user.id,
    ownerId: user.id,
    visibility: input.visibility,
  });

  revalidatePath("/shopping");
}

export async function deleteList(listId: string) {
  const user = await requireUser();
  const [list] = await db
    .select()
    .from(shoppingList)
    .where(eq(shoppingList.id, listId))
    .limit(1);

  if (!list) return;
  assertCanMutate(list, user);

  await db.delete(shoppingList).where(eq(shoppingList.id, listId));
  revalidatePath("/shopping");
}

export async function renameList(listId: string, name: string) {
  const user = await requireUser();
  const [list] = await db
    .select()
    .from(shoppingList)
    .where(eq(shoppingList.id, listId))
    .limit(1);

  if (!list) return;
  assertCanMutate(list, user);

  await db
    .update(shoppingList)
    .set({ name: name.trim() })
    .where(eq(shoppingList.id, listId));

  revalidatePath(`/shopping/${listId}`);
}

export async function setListVisibility(
  listId: string,
  visibility: "shared" | "private"
) {
  const user = await requireUser();
  const [list] = await db
    .select()
    .from(shoppingList)
    .where(eq(shoppingList.id, listId))
    .limit(1);

  if (!list) return;
  assertCanMutate(list, user);

  await db
    .update(shoppingList)
    .set({ visibility })
    .where(eq(shoppingList.id, listId));

  revalidatePath("/shopping");
  revalidatePath(`/shopping/${listId}`);
}

const addItemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.string().max(50).optional(),
});

export async function addItem(listId: string, formData: FormData) {
  const user = await requireUser();
  const input = addItemSchema.parse({
    name: formData.get("name"),
    quantity: formData.get("quantity") || undefined,
  });

  // verify the user can see this list
  const [list] = await db
    .select()
    .from(shoppingList)
    .where(eq(shoppingList.id, listId))
    .limit(1);

  if (!list) return;
  if (list.visibility === "private" && list.ownerId !== user.id) return;

  await db.insert(shoppingItem).values({
    id: generateId(),
    listId,
    name: input.name,
    quantity: input.quantity ?? null,
    addedBy: user.id,
  });

  revalidatePath(`/shopping/${listId}`);
}

export async function toggleItem(itemId: string) {
  const user = await requireUser();
  const [item] = await db
    .select()
    .from(shoppingItem)
    .where(eq(shoppingItem.id, itemId))
    .limit(1);

  if (!item) return;

  // verify list visibility
  const [list] = await db
    .select()
    .from(shoppingList)
    .where(eq(shoppingList.id, item.listId))
    .limit(1);

  if (!list) return;
  if (list.visibility === "private" && list.ownerId !== user.id) return;

  await db
    .update(shoppingItem)
    .set({ checked: !item.checked })
    .where(eq(shoppingItem.id, itemId));

  revalidatePath(`/shopping/${item.listId}`);
}

export async function deleteItem(itemId: string) {
  const user = await requireUser();
  const [item] = await db
    .select()
    .from(shoppingItem)
    .where(eq(shoppingItem.id, itemId))
    .limit(1);

  if (!item) return;

  const [list] = await db
    .select()
    .from(shoppingList)
    .where(eq(shoppingList.id, item.listId))
    .limit(1);

  if (!list) return;
  assertCanMutate({ ownerId: list.ownerId, visibility: list.visibility }, user);

  await db.delete(shoppingItem).where(eq(shoppingItem.id, itemId));
  revalidatePath(`/shopping/${item.listId}`);
}

export async function clearChecked(listId: string) {
  const user = await requireUser();
  const [list] = await db
    .select()
    .from(shoppingList)
    .where(eq(shoppingList.id, listId))
    .limit(1);

  if (!list) return;
  assertCanMutate(list, user);

  await db
    .delete(shoppingItem)
    .where(and(eq(shoppingItem.listId, listId), eq(shoppingItem.checked, true)));

  revalidatePath(`/shopping/${listId}`);
}
