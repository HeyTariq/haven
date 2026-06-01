"use server";

import { headers } from "next/headers";
import { hashPassword } from "@better-auth/utils/password";
import { db } from "@/lib/db";
import { user, account } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import {
  setAuthMode,
  setHouseholdType,
  type HouseholdType,
} from "@/lib/settings";

const PRESETS: Record<HouseholdType, { passwordless: boolean }> = {
  solo: { passwordless: true },
  family: { passwordless: true },
  roommates: { passwordless: false },
};

// Result tells the client whether a session was established (passwordless) so it
// can route straight into the app, or whether the user must sign in (roommates).
export async function createAdminAction(
  form: FormData,
): Promise<{ error?: string; signedIn?: boolean }> {
  const name = form.get("name") as string;
  const email = form.get("email") as string;
  const password = (form.get("password") as string) || "";
  const presetRaw = form.get("preset") as string;
  const preset: HouseholdType =
    presetRaw === "solo" || presetRaw === "family" ? presetRaw : "roommates";
  const passwordless = PRESETS[preset].passwordless;

  if (!name || !email) {
    return { error: "Name and email are required." };
  }
  if (!passwordless && !password) {
    return { error: "Password is required for this setup." };
  }

  const existing = await db.select({ id: user.id }).from(user).limit(1);
  if (existing.length > 0) {
    return { error: "Setup already completed." };
  }

  try {
    await setHouseholdType(preset);
    await setAuthMode(passwordless ? "passwordless" : "password");

    const id = crypto.randomUUID();
    const now = new Date();
    await db
      .insert(user)
      .values({ id, name, email, emailVerified: false, role: "admin" });

    // Credential account is optional in passwordless mode; create it whenever a
    // password was supplied so enabling auth later needs no migration.
    if (password) {
      const hash = await hashPassword(password);
      await db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: id,
        providerId: "credential",
        userId: id,
        password: hash,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (passwordless) {
      await auth.api.signInPasswordless({
        body: { userId: id },
        headers: await headers(),
      });
      return { signedIn: true };
    }

    return { signedIn: false };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}
