import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { appSetting } from "@/lib/db/schema/settings";

export async function getSetting(key: string, fallback: string): Promise<string> {
  const [row] = await db
    .select()
    .from(appSetting)
    .where(eq(appSetting.key, key))
    .limit(1);
  return row?.value ?? fallback;
}

export async function getSettings(
  keys: string[]
): Promise<Record<string, string>> {
  const rows = await db
    .select()
    .from(appSetting)
    .where(inArray(appSetting.key, keys));
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(appSetting)
    .values({ key, value })
    .onConflictDoUpdate({ target: appSetting.key, set: { value } });
}

export type AuthMode = "password" | "passwordless";
export type HouseholdType = "solo" | "family" | "roommates";

// Passwordless drops the login challenge but keeps identity; only this value
// changes app behavior. Defaults to "password" so an unconfigured install stays gated.
export async function getAuthMode(): Promise<AuthMode> {
  const value = await getSetting("app.authMode", "password");
  return value === "passwordless" ? "passwordless" : "password";
}

export async function setAuthMode(mode: AuthMode): Promise<void> {
  await setSetting("app.authMode", mode);
}

// Cosmetic today; informs setup defaults and future per-type settings.
export async function getHouseholdType(): Promise<HouseholdType> {
  const value = await getSetting("app.householdType", "roommates");
  if (value === "solo" || value === "family") return value;
  return "roommates";
}

export async function setHouseholdType(type: HouseholdType): Promise<void> {
  await setSetting("app.householdType", type);
}

export type ChoreSettings = {
  editPolicy: "any" | "ownerOrAdmin";
  showPoints: boolean;
};

export async function getChoreSettings(): Promise<ChoreSettings> {
  const map = await getSettings(["chores.editPolicy", "chores.showPoints"]);
  return {
    editPolicy:
      map["chores.editPolicy"] === "ownerOrAdmin" ? "ownerOrAdmin" : "any",
    showPoints: map["chores.showPoints"] !== "false",
  };
}
