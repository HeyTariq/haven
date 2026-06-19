import { requireUser } from "@/lib/auth/session";
import { getMyItems, getAllItemsGroupedByUser } from "@/modules/wishlist/queries";
import { WishlistTabs } from "@/modules/wishlist/components/wishlist-tabs";
import { PageContainer } from "@/components/page-container";

export default async function WishlistPage() {
  const user = await requireUser();
  const [myItems, allRows] = await Promise.all([
    getMyItems(user),
    getAllItemsGroupedByUser(),
  ]);

  const othersMap = new Map<string, { userName: string; count: number }>();
  for (const row of allRows) {
    if (row.userId === user.id) continue;
    if (!othersMap.has(row.userId)) {
      othersMap.set(row.userId, { userName: row.userName ?? "Unknown", count: 0 });
    }
    othersMap.get(row.userId)!.count++;
  }
  const others = Array.from(othersMap.entries()).map(([userId, data]) => ({ userId, ...data }));

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Wishlists</h1>
        <p className="text-muted-foreground text-sm">Manage your wishlist and browse others&apos;</p>
      </div>
      <WishlistTabs myItems={myItems} others={others} />
    </PageContainer>
  );
}
