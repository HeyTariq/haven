"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AppearanceClient } from "./appearance/appearance-client";
import { MembersClient } from "./members/members-client";
import { HouseholdClient } from "./household/household-client";
import { PageContainer } from "@/components/page-container";
import type { AuthMode } from "@/lib/settings";

interface Props {
  isAdmin: boolean;
  activeTab: string;
  authMode: AuthMode;
}

export function SettingsClient({ isAdmin, activeTab, authMode }: Props) {
  const router = useRouter();

  const tabs = [
    { id: "appearance", label: "Appearance" },
    ...(isAdmin
      ? [
          { id: "household", label: "Household" },
          { id: "members", label: "Members" },
        ]
      : []),
  ];

  return (
    <PageContainer className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="border-b flex">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => router.replace(`/settings?tab=${t.id}`)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "appearance" && <AppearanceClient />}
      {activeTab === "household" && isAdmin && (
        <HouseholdClient authMode={authMode} />
      )}
      {activeTab === "members" && isAdmin && (
        <MembersClient authMode={authMode} />
      )}
    </PageContainer>
  );
}
