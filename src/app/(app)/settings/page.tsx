import { requireUser } from "@/lib/auth/session";
import { getAuthMode } from "@/lib/settings";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUser();
  const { tab } = await searchParams;
  const isAdmin = user.role === "admin";
  const adminOnly = tab === "members" || tab === "household";
  const activeTab =
    adminOnly && !isAdmin ? "appearance" : (tab ?? "appearance");
  const authMode = await getAuthMode();
  return (
    <SettingsClient isAdmin={isAdmin} activeTab={activeTab} authMode={authMode} />
  );
}
