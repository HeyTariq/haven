"use server";

import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { hashPassword } from "@better-auth/utils/password";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

export type MemberRow = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean | null;
  hasPin: boolean;
};

export async function listMembers(): Promise<MemberRow[]> {
  await requireAdmin();
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      pinHash: user.pinHash,
    })
    .from(user)
    .orderBy(asc(user.name));
  return rows.map(({ pinHash, ...m }) => ({ ...m, hasPin: pinHash != null }));
}

// Creates a bare profile that signs in by being picked. Email is kept only as a
// hook for a future email feature, so it is auto-generated when omitted — adding
// a member must never require typing an email.
//
// A PIN may only be set here for a NEW admin: admins must have a PIN to sign in
// and the account does not exist yet, so the creating admin seeds it. After that,
// only the account holder can change their own PIN — no admin can. Regular
// members are created with no PIN and set their own later from Settings.
export async function createMember(
  name: string,
  email: string,
  role: string,
  pin?: string,
): Promise<{ error?: string }> {
  await requireAdmin();
  if (!name) {
    return { error: "Name is required." };
  }
  const isAdmin = role === "admin";
  if (isAdmin && !/^\d{4,8}$/.test(pin ?? "")) {
    return { error: "New admins need a 4 to 8 digit PIN." };
  }
  try {
    await db.insert(user).values({
      id: crypto.randomUUID(),
      name,
      // Synthetic, unique address when none is supplied; never used to sign in.
      email: email || `${crypto.randomUUID()}@local.haven`,
      emailVerified: false,
      role,
      // Only seeded for new admins; everyone else manages their own PIN.
      pinHash: isAdmin ? await hashPassword(pin as string) : null,
    });
    revalidatePath("/settings");
    revalidatePath("/login");
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not create profile.",
    };
  }
}

// Admin reset for a forgotten PIN. An admin may CLEAR another member's PIN but
// can never set it to a value — only the account holder picks their own PIN.
// After this, the member signs in by being picked and can set a new PIN from
// their own Settings. Admin targets are refused: admins must always keep a PIN.
export async function clearMemberPin(
  userId: string,
): Promise<{ error?: string }> {
  await requireAdmin();
  const [target] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!target) {
    return { error: "Profile not found." };
  }
  if (target.role === "admin") {
    return { error: "Admins must keep a PIN." };
  }
  try {
    await db.update(user).set({ pinHash: null }).where(eq(user.id, userId));
    revalidatePath("/settings");
    revalidatePath("/login");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not clear PIN." };
  }
}

// Sets or changes the signed-in user's OWN PIN. Always scoped to the session
// user — it cannot target anyone else, so no admin can change another member's
// PIN through it.
export async function setOwnPin(pin: string): Promise<{ error?: string }> {
  const me = await requireUser();
  if (!/^\d{4,8}$/.test(pin)) {
    return { error: "PIN must be 4 to 8 digits." };
  }
  try {
    await db
      .update(user)
      .set({ pinHash: await hashPassword(pin) })
      .where(eq(user.id, me.id));
    revalidatePath("/settings");
    revalidatePath("/login");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not set PIN." };
  }
}

// Removes the signed-in user's own PIN. Admins must always keep one, so an admin
// clearing their own PIN is refused.
export async function clearOwnPin(): Promise<{ error?: string }> {
  const me = await requireUser();
  if (me.role === "admin") {
    return { error: "Admins must keep a PIN." };
  }
  try {
    await db.update(user).set({ pinHash: null }).where(eq(user.id, me.id));
    revalidatePath("/settings");
    revalidatePath("/login");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not clear PIN." };
  }
}
