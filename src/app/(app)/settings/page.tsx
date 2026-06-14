import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const current = await requireUser();
  const { tab } = await searchParams;
  const isAdmin = current.role === "admin";
  const adminOnly = tab === "members";
  const activeTab =
    adminOnly && !isAdmin ? "appearance" : (tab ?? "appearance");

  const [row] = await db
    .select({ pinHash: user.pinHash })
    .from(user)
    .where(eq(user.id, current.id))
    .limit(1);

  return (
    <SettingsClient
      isAdmin={isAdmin}
      activeTab={activeTab}
      hasPin={row?.pinHash != null}
    />
  );
}
