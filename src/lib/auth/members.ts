import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema/auth";

export type Member = { id: string; name: string };

export async function getMembers(): Promise<Member[]> {
  return db.select({ id: user.id, name: user.name }).from(user).orderBy(asc(user.name));
}
