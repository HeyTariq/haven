import { eq, desc, asc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { chore, choreCompletion } from "./schema";
import { user } from "@/lib/db/schema/auth";

export type ChoreRow = {
  id: string;
  title: string;
  description: string | null;
  assignedToUserId: string | null;
  assignedToName: string | null;
  recurrence: "none" | "daily" | "weekly" | "monthly";
  dueDate: Date | null;
  points: number;
  createdBy: string;
  createdAt: Date;
  completionCount: number;
  lastCompletedAt: Date | null;
  completed: boolean;
};

export type ScoreboardEntry = {
  userId: string;
  name: string;
  points: number;
};

export async function getChores(): Promise<ChoreRow[]> {
  const chores = await db
    .select({
      id: chore.id,
      title: chore.title,
      description: chore.description,
      assignedToUserId: chore.assignedToUserId,
      assignedToName: user.name,
      recurrence: chore.recurrence,
      dueDate: chore.dueDate,
      points: chore.points,
      createdBy: chore.createdBy,
      createdAt: chore.createdAt,
    })
    .from(chore)
    .leftJoin(user, eq(chore.assignedToUserId, user.id))
    .orderBy(
      // nulls last for dueDate: sort non-null ascending, nulls after
      sql`CASE WHEN ${chore.dueDate} IS NULL THEN 1 ELSE 0 END`,
      asc(chore.dueDate),
      desc(chore.createdAt)
    );

  if (chores.length === 0) return [];

  // fetch completion counts in one query
  const completions = await db
    .select({
      choreId: choreCompletion.choreId,
      count: sql<number>`count(*)`.as("count"),
      lastAt: sql<number | null>`max(${choreCompletion.completedAt})`.as("lastAt"),
    })
    .from(choreCompletion)
    .groupBy(choreCompletion.choreId);

  const completionMap = new Map(
    completions.map((c) => [c.choreId, c])
  );

  return chores.map((c) => {
    const comp = completionMap.get(c.id);
    const completionCount = comp?.count ?? 0;
    const lastCompletedAt = comp?.lastAt ? new Date(comp.lastAt) : null;
    // non-recurring chores are "done" once completed at least once
    const completed = c.recurrence === "none" && completionCount > 0;
    return {
      ...c,
      completionCount,
      lastCompletedAt,
      completed,
    };
  });
}

export async function getScoreboard(): Promise<ScoreboardEntry[]> {
  const rows = await db
    .select({
      userId: user.id,
      name: user.name,
      points: sql<number>`coalesce(sum(${chore.points}), 0)`.as("points"),
    })
    .from(user)
    .leftJoin(choreCompletion, eq(choreCompletion.userId, user.id))
    .leftJoin(chore, eq(choreCompletion.choreId, chore.id))
    .groupBy(user.id, user.name)
    .orderBy(desc(sql`points`));

  return rows.map((r) => ({ ...r, points: Number(r.points) }));
}
