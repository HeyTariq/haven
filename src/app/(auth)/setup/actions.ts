"use server";

import { headers } from "next/headers";
import { hashPassword } from "@better-auth/utils/password";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { setHouseholdType, type HouseholdType } from "@/lib/settings";
import { setRememberedProfile } from "@/lib/auth/device-profile";

// Creates the first account (always an admin) and signs them straight in. Admins
// must have a PIN — it is the only gate on their always-pickable profile.
export async function createAdminAction(
  form: FormData,
): Promise<{ error?: string; signedIn?: boolean }> {
  const name = form.get("name") as string;
  const email = form.get("email") as string;
  const pin = (form.get("pin") as string) || "";
  const confirmPin = (form.get("confirmPin") as string) || "";
  const presetRaw = form.get("preset") as string;
  const preset: HouseholdType =
    presetRaw === "solo" || presetRaw === "family" ? presetRaw : "roommates";

  // Email is kept for a possible future email feature; it is never used to sign in.
  if (!name || !email) {
    return { error: "Name and email are required." };
  }
  if (!/^\d{4,8}$/.test(pin)) {
    return { error: "PIN must be 4 to 8 digits." };
  }
  if (pin !== confirmPin) {
    return { error: "PINs do not match." };
  }

  const existing = await db.select({ id: user.id }).from(user).limit(1);
  if (existing.length > 0) {
    return { error: "Setup already completed." };
  }

  try {
    await setHouseholdType(preset);

    const id = crypto.randomUUID();
    await db.insert(user).values({
      id,
      name,
      email,
      emailVerified: false,
      role: "admin",
      pinHash: await hashPassword(pin),
    });

    // Mint the session through the passwordless endpoint, verifying the PIN we
    // just set. This is the only sign-in path now that passwords are gone.
    await auth.api.signInPasswordless({
      body: { userId: id, pin },
      headers: await headers(),
    });
    await setRememberedProfile(id);
    return { signedIn: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}
