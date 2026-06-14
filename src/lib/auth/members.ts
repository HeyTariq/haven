import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema/auth";

export type Member = { id: string; name: string };

export async function getMembers(): Promise<Member[]> {
  return db.select({ id: user.id, name: user.name }).from(user).orderBy(asc(user.name));
}

export type Profile = {
  id: string;
  name: string;
  image: string | null;
  role: string | null;
  hasPin: boolean;
};

// Shape sent to the unauthenticated client picker. Omits role (so an anonymous
// visitor cannot enumerate admins) but includes hasPin, which only tells the
// picker whether to prompt for a PIN — it leaks no secret.
export type PublicProfile = {
  id: string;
  name: string;
  image: string | null;
  hasPin: boolean;
};

// Full identity list (server-side). Includes role; callers must strip role
// before sending profiles to the client. The PIN hash is never selected — only
// its presence (hasPin) is derived.
export async function getProfiles(): Promise<Profile[]> {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      role: user.role,
      pinHash: user.pinHash,
    })
    .from(user)
    .orderBy(asc(user.name));
  return rows.map(({ pinHash, ...p }) => ({ ...p, hasPin: pinHash != null }));
}
