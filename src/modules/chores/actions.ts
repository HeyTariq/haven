"use server";

import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { addDays, addWeeks, addMonths, max, startOfDay } from "date-fns";
import { db } from "@/lib/db";
import { requireUser, requireAdmin } from "@/lib/auth/session";
import { getChoreSettings, setSetting } from "@/lib/settings";
import { chore, choreCompletion } from "./schema";
import type { User } from "@/lib/auth";

function generateId() {
  return crypto.randomUUID();
}

async function assertCanEditChore(
  record: { createdBy: string },
  user: User
): Promise<void> {
  const { editPolicy } = await getChoreSettings();
  if (editPolicy === "any") return;
  if (record.createdBy === user.id || user.role === "admin") return;
  throw new Error("Forbidden");
}

function nextDueDate(
  recurrence: "daily" | "weekly" | "monthly",
  current: Date | null
): Date {
  const base = current ? max([current, startOfDay(new Date())]) : new Date();
  if (recurrence === "daily") return addDays(base, 1);
  if (recurrence === "weekly") return addWeeks(base, 1);
  return addMonths(base, 1);
}

const choreSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  assignedToUserId: z.string().optional(),
  recurrence: z.enum(["none", "daily", "weekly", "monthly"]).default("none"),
  dueDate: z.string().optional(),
  points: z.coerce.number().int().min(0).max(9999).default(0),
});

export async function createChore(formData: FormData) {
  const user = await requireUser();
  const input = choreSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    assignedToUserId: formData.get("assignedToUserId") || undefined,
    recurrence: formData.get("recurrence") ?? "none",
    dueDate: formData.get("dueDate") || undefined,
    points: formData.get("points") ?? 0,
  });

  const dueDate = input.dueDate ? new Date(input.dueDate) : null;

  await db.insert(chore).values({
    id: generateId(),
    title: input.title,
    description: input.description ?? null,
    assignedToUserId: input.assignedToUserId ?? null,
    recurrence: input.recurrence,
    dueDate,
    points: input.points,
    createdBy: user.id,
  });

  revalidatePath("/chores");
}

export async function updateChore(choreId: string, formData: FormData) {
  const user = await requireUser();
  const [existing] = await db
    .select()
    .from(chore)
    .where(eq(chore.id, choreId))
    .limit(1);

  if (!existing) return;
  await assertCanEditChore(existing, user);

  const input = choreSchema.parse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    assignedToUserId: formData.get("assignedToUserId") || undefined,
    recurrence: formData.get("recurrence") ?? "none",
    dueDate: formData.get("dueDate") || undefined,
    points: formData.get("points") ?? 0,
  });

  const dueDate = input.dueDate ? new Date(input.dueDate) : null;

  await db
    .update(chore)
    .set({
      title: input.title,
      description: input.description ?? null,
      assignedToUserId: input.assignedToUserId ?? null,
      recurrence: input.recurrence,
      dueDate,
      points: input.points,
    })
    .where(eq(chore.id, choreId));

  revalidatePath("/chores");
}

export async function deleteChore(choreId: string) {
  const user = await requireUser();
  const [existing] = await db
    .select()
    .from(chore)
    .where(eq(chore.id, choreId))
    .limit(1);

  if (!existing) return;
  await assertCanEditChore(existing, user);

  await db.delete(chore).where(eq(chore.id, choreId));
  revalidatePath("/chores");
}

export async function completeChore(choreId: string) {
  const user = await requireUser();
  const [existing] = await db
    .select()
    .from(chore)
    .where(eq(chore.id, choreId))
    .limit(1);

  if (!existing) return;

  await db.insert(choreCompletion).values({
    id: generateId(),
    choreId,
    userId: user.id,
  });

  // roll due date forward for recurring chores
  if (existing.recurrence !== "none") {
    const next = nextDueDate(existing.recurrence, existing.dueDate);
    await db.update(chore).set({ dueDate: next }).where(eq(chore.id, choreId));
  }

  revalidatePath("/chores");
}

export async function uncompleteChore(choreId: string) {
  const user = await requireUser();
  const [existing] = await db
    .select()
    .from(chore)
    .where(eq(chore.id, choreId))
    .limit(1);

  if (!existing || existing.recurrence !== "none") return;
  await assertCanEditChore(existing, user);

  // delete the most recent completion for this chore
  const [latest] = await db
    .select()
    .from(choreCompletion)
    .where(eq(choreCompletion.choreId, choreId))
    .orderBy(desc(choreCompletion.completedAt))
    .limit(1);

  if (!latest) return;

  await db
    .delete(choreCompletion)
    .where(eq(choreCompletion.id, latest.id));

  revalidatePath("/chores");
}

export async function setChoreEditPolicy(value: "any" | "ownerOrAdmin") {
  await requireAdmin();
  z.enum(["any", "ownerOrAdmin"]).parse(value);
  await setSetting("chores.editPolicy", value);
  revalidatePath("/chores");
}

export async function setChoreShowPoints(value: boolean) {
  await requireAdmin();
  await setSetting("chores.showPoints", value ? "true" : "false");
  revalidatePath("/chores");
}
