"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { setAuthMode, type AuthMode } from "@/lib/settings";

export async function setAuthModeAction(mode: AuthMode): Promise<void> {
  await requireAdmin();
  await setAuthMode(mode === "passwordless" ? "passwordless" : "password");
  revalidatePath("/settings");
  revalidatePath("/login");
}

// Passwordless profiles are a bare user row with no credential account. They
// gain a password later through the set-password flow if auth is enabled.
export async function createPasswordlessMember(
  name: string,
  email: string,
  role: string,
): Promise<{ error?: string }> {
  await requireAdmin();
  if (!name || !email) {
    return { error: "Name and email are required." };
  }
  try {
    await db.insert(user).values({
      id: crypto.randomUUID(),
      name,
      email,
      emailVerified: false,
      role,
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
