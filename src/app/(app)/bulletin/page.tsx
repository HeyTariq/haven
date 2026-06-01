import { requireUser } from "@/lib/auth/session";
import { getPosts } from "@/modules/bulletin/queries";
import { BulletinBoardView } from "@/modules/bulletin/components/bulletin-board-view";
import { PageContainer } from "@/components/page-container";

export default async function BulletinPage() {
  const user = await requireUser();
  const posts = await getPosts(user);

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Bulletin Board</h1>
        <p className="text-muted-foreground text-sm">Household announcements</p>
      </div>
      <BulletinBoardView
        posts={posts}
        currentUserId={user.id}
        isAdmin={user.role === "admin"}
      />
    </PageContainer>
  );
}
