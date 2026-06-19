import { requireUser } from "@/lib/auth/session";
import { getMembers } from "@/lib/auth/members";
import { getChoreSettings } from "@/lib/settings";
import { getChores, getScoreboard } from "@/modules/chores/queries";
import { ChoresView } from "@/modules/chores/components/chores-view";
import { PageContainer } from "@/components/page-container";

export default async function ChoresPage() {
  const user = await requireUser();
  const isAdmin = user.role === "admin";

  const [chores, members, settings, scoreboard] = await Promise.all([
    getChores(),
    getMembers(),
    getChoreSettings(),
    getScoreboard(),
  ]);

  return (
    <PageContainer>
      <ChoresView
        chores={chores}
        members={members}
        scoreboard={scoreboard}
        currentUserId={user.id}
        isAdmin={isAdmin}
        settings={settings}
      />
    </PageContainer>
  );
}
