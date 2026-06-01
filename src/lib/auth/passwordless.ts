"use server";

import { headers } from "next/headers";
import { auth } from "./index";
import { getAuthMode } from "@/lib/settings";
import {
  setRememberedProfile,
  clearRememberedProfile,
} from "./device-profile";

// Establishes a session for a chosen profile without a password. The endpoint
// enforces passwordless mode; nextCookies() persists the session cookie. When
// remember is set, the device also remembers this profile for next time.
export async function signInAsUser(
  userId: string,
  remember = true,
): Promise<{ error?: string }> {
  if ((await getAuthMode()) !== "passwordless") {
    return { error: "Passwordless sign-in is disabled." };
  }
  try {
    await auth.api.signInPasswordless({
      body: { userId },
      headers: await headers(),
    });
    if (remember) {
      await setRememberedProfile(userId);
    } else {
      await clearRememberedProfile();
    }
    return {};
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not sign in.",
    };
  }
}

// Drops this device's remembered profile so the next visit shows the full
// picker. Used by "Not you?" on the login screen and by sign-out.
export async function forgetDevice(): Promise<void> {
  await clearRememberedProfile();
}
