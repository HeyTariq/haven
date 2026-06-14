"use server";

import { headers } from "next/headers";
import { auth } from "./index";
import {
  setRememberedProfile,
  clearRememberedProfile,
} from "./device-profile";

// Establishes a session for a chosen profile without a password. The endpoint
// verifies the PIN itself for PIN-protected profiles; nextCookies() persists the
// session cookie. When remember is set, the device also remembers this profile.
export async function signInAsUser(
  userId: string,
  pin?: string,
  remember = true,
): Promise<{ error?: string }> {
  try {
    await auth.api.signInPasswordless({
      body: { userId, pin },
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
