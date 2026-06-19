"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { wishlistItem } from "./schema";

function generateId() {
  return crypto.randomUUID();
}

const wishlistItemSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(500).optional(),
  url: z.string().url().optional().or(z.literal("")),
  price: z.string().max(50).optional(),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
});

export async function addWishlistItem(formData: FormData) {
  const user = await requireUser();
  const input = wishlistItemSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    url: formData.get("url") || undefined,
    price: formData.get("price") || undefined,
    priority: formData.get("priority") ?? "medium",
  });

  await db.insert(wishlistItem).values({
    id: generateId(),
    userId: user.id,
    name: input.name,
    description: input.description ?? null,
    url: input.url || null,
    price: input.price ?? null,
    priority: input.priority,
  });

  revalidatePath("/wishlist");
}

export async function updateWishlistItem(id: string, formData: FormData) {
  const user = await requireUser();
  const [item] = await db
    .select()
    .from(wishlistItem)
    .where(eq(wishlistItem.id, id))
    .limit(1);

  if (!item) return;
  if (item.userId !== user.id) throw new Error("Forbidden");

  const input = wishlistItemSchema.parse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    url: formData.get("url") || undefined,
    price: formData.get("price") || undefined,
    priority: formData.get("priority") ?? "medium",
  });

  await db
    .update(wishlistItem)
    .set({
      name: input.name,
      description: input.description ?? null,
      url: input.url || null,
      price: input.price ?? null,
      priority: input.priority,
    })
    .where(eq(wishlistItem.id, id));

  revalidatePath("/wishlist");
  revalidatePath(`/wishlist/${user.id}`);
}

export async function deleteWishlistItem(id: string) {
  const user = await requireUser();
  const [item] = await db
    .select()
    .from(wishlistItem)
    .where(eq(wishlistItem.id, id))
    .limit(1);

  if (!item) return;
  if (item.userId !== user.id) throw new Error("Forbidden");

  await db.delete(wishlistItem).where(eq(wishlistItem.id, id));

  revalidatePath("/wishlist");
  revalidatePath(`/wishlist/${user.id}`);
}
