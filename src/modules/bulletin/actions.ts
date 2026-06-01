"use server";

import { revalidatePath } from "next/cache";
import { eq, and, isNull, or, gt } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { assertCanMutate } from "@/lib/auth/visibility";
import { bulletinPost, bulletinAck } from "./schema";

function generateId() {
  return crypto.randomUUID();
}

function revalidate() {
  revalidatePath("/bulletin");
  revalidatePath("/dashboard");
}

const postSchema = z.object({
  title: z.string().max(120).optional(),
  body: z.string().min(1).max(5000),
  category: z
    .enum(["announcement", "event", "reminder", "general", "forsale"])
    .default("general"),
  priority: z.enum(["normal", "important", "urgent"]).default("normal"),
  pinned: z.boolean().default(false),
  expiresAt: z.coerce.date().optional(),
});

// FormData "on"/null checkbox + empty date string into typed fields
function parsePostForm(formData: FormData) {
  const expiresRaw = formData.get("expiresAt");
  const titleRaw = formData.get("title");
  return postSchema.parse({
    title: titleRaw ? String(titleRaw) : undefined,
    body: formData.get("body"),
    category: formData.get("category") ?? "general",
    priority: formData.get("priority") ?? "normal",
    pinned: formData.get("pinned") === "on" || formData.get("pinned") === "true",
    expiresAt: expiresRaw ? String(expiresRaw) : undefined,
  });
}

export async function createPost(formData: FormData) {
  const user = await requireUser();
  const input = parsePostForm(formData);

  await db.insert(bulletinPost).values({
    id: generateId(),
    title: input.title?.trim() || null,
    body: input.body,
    category: input.category,
    priority: input.priority,
    pinned: input.pinned,
    expiresAt: input.expiresAt ?? null,
    ownerId: user.id,
    visibility: "shared",
  });

  revalidate();
}

export async function updatePost(postId: string, formData: FormData) {
  const user = await requireUser();
  const [post] = await db
    .select()
    .from(bulletinPost)
    .where(eq(bulletinPost.id, postId))
    .limit(1);

  if (!post) return;
  assertCanMutate(post, user);

  const input = parsePostForm(formData);
  await db
    .update(bulletinPost)
    .set({
      title: input.title?.trim() || null,
      body: input.body,
      category: input.category,
      priority: input.priority,
      pinned: input.pinned,
      expiresAt: input.expiresAt ?? null,
      updatedAt: new Date(),
    })
    .where(eq(bulletinPost.id, postId));

  revalidate();
}

export async function deletePost(postId: string) {
  const user = await requireUser();
  const [post] = await db
    .select()
    .from(bulletinPost)
    .where(eq(bulletinPost.id, postId))
    .limit(1);

  if (!post) return;
  assertCanMutate(post, user);

  await db.delete(bulletinPost).where(eq(bulletinPost.id, postId));
  revalidate();
}

export async function togglePin(postId: string) {
  const user = await requireUser();
  const [post] = await db
    .select()
    .from(bulletinPost)
    .where(eq(bulletinPost.id, postId))
    .limit(1);

  if (!post) return;
  assertCanMutate(post, user);

  await db
    .update(bulletinPost)
    .set({ pinned: !post.pinned })
    .where(eq(bulletinPost.id, postId));

  revalidate();
}

// Only allow acknowledging posts the user can actually see (shared and active).
async function findVisibleActivePost(postId: string, userId: string) {
  const [post] = await db
    .select()
    .from(bulletinPost)
    .where(
      and(
        eq(bulletinPost.id, postId),
        or(eq(bulletinPost.visibility, "shared"), eq(bulletinPost.ownerId, userId)),
        or(isNull(bulletinPost.expiresAt), gt(bulletinPost.expiresAt, new Date()))
      )
    )
    .limit(1);
  return post;
}

export async function acknowledgePost(postId: string) {
  const user = await requireUser();
  const post = await findVisibleActivePost(postId, user.id);
  if (!post) return;

  await db
    .insert(bulletinAck)
    .values({ postId, userId: user.id })
    .onConflictDoNothing();

  revalidate();
}

export async function unacknowledgePost(postId: string) {
  const user = await requireUser();
  await db
    .delete(bulletinAck)
    .where(and(eq(bulletinAck.postId, postId), eq(bulletinAck.userId, user.id)));

  revalidate();
}
