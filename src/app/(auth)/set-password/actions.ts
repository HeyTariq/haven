"use server";

import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "@better-auth/utils/password";
import { db } from "@/lib/db";
import { user, account } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { getAuthMode } from "@/lib/settings";

// Lets a passwordless profile claim a credential after auth is enabled, then
// signs it in. Refuses if the profile already has a credential account.
export async function setProfilePassword(
  userId: string,
  password: string,
): Promise<{ error?: string }> {
  if ((await getAuthMode()) !== "password") {
    return { error: "Passwords are not required right now." };
  }
  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const [row] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!row) {
    return { error: "Profile not found." };
  }

  const [existing] = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
    .limit(1);
  if (existing) {
    return { error: "This profile already has a password." };
  }

  try {
    const now = new Date();
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: await hashPassword(password),
      createdAt: now,
      updatedAt: now,
    });

    await auth.api.signInEmail({
      body: { email: row.email, password },
      headers: await headers(),
    });
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not set password.",
    };
  }
}
