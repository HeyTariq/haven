import "server-only";
import { cookies } from "next/headers";

export const DEVICE_PROFILE_COOKIE = "haven_device_profile";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Remembers which household member a device belongs to, separate from the
// session cookie so it survives session expiry and logout. secure:false because
// the deployment is plain-http on a home LAN; a secure cookie would be dropped.
export async function getRememberedProfileId(): Promise<string | null> {
  const store = await cookies();
  return store.get(DEVICE_PROFILE_COOKIE)?.value ?? null;
}

export async function setRememberedProfile(userId: string): Promise<void> {
  const store = await cookies();
  store.set(DEVICE_PROFILE_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
}

export async function clearRememberedProfile(): Promise<void> {
  const store = await cookies();
  store.delete(DEVICE_PROFILE_COOKIE);
}
