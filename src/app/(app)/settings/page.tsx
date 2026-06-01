import { requireUser } from "@/lib/auth/session";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireUser();
  const { tab } = await searchParams;
  const isAdmin = user.role === "admin";
  const activeTab =
    tab === "members" && !isAdmin ? "appearance" : (tab ?? "appearance");
  return <SettingsClient isAdmin={isAdmin} activeTab={activeTab} />;
}
