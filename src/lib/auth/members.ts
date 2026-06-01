import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { account, user } from "@/lib/db/schema/auth";

export type Member = { id: string; name: string };

export async function getMembers(): Promise<Member[]> {
  return db.select({ id: user.id, name: user.name }).from(user).orderBy(asc(user.name));
}

export type Profile = {
  id: string;
  name: string;
  image: string | null;
  role: string | null;
};

// Identity list for the passwordless profile picker.
export async function getProfiles(): Promise<Profile[]> {
  return db
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      role: user.role,
    })
    .from(user)
    .orderBy(asc(user.name));
}

// Profiles without a credential account, i.e. created passwordless. Used to
// drive the forced set-password flow when auth mode flips to "password".
export async function getProfilesWithoutPassword(): Promise<Profile[]> {
  return db
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      role: user.role,
    })
    .from(user)
    .leftJoin(
      account,
      and(eq(account.userId, user.id), eq(account.providerId, "credential")),
    )
    .where(isNull(account.id))
    .orderBy(asc(user.name));
}
