import "server-only";
import { cookies } from "next/headers";

export const DEVICE_PROFILE_COOKIE = "haven_device_profile";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Remembers which household member a device belongs to, separate from the
// session cookie so it survives session expiry and logout. Marked Secure only
// when served over HTTPS; on a plain-http home LAN a Secure cookie would be
// dropped, so it is keyed off the configured BETTER_AUTH_URL scheme.
const useSecureCookies = (process.env.BETTER_AUTH_URL ?? "").startsWith("https://");

export async function getRememberedProfileId(): Promise<string | null> {
  const store = await cookies();
  return store.get(DEVICE_PROFILE_COOKIE)?.value ?? null;
}

export async function setRememberedProfile(userId: string): Promise<void> {
  const store = await cookies();
  store.set(DEVICE_PROFILE_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookies,
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
  });
}

export async function clearRememberedProfile(): Promise<void> {
  const store = await cookies();
  store.delete(DEVICE_PROFILE_COOKIE);
}
