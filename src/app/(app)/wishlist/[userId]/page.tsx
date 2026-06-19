import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/session";
import { getUserItems } from "@/modules/wishlist/queries";
import { WishlistItemCard } from "@/modules/wishlist/components/wishlist-item-card";
import { PageContainer } from "@/components/page-container";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function MemberWishlistPage({ params }: Props) {
  const currentUser = await requireUser();
  const { userId } = await params;

  if (userId === currentUser.id) {
    redirect("/wishlist");
  }

  const [member] = await db
    .select({ id: userTable.id, name: userTable.name })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  if (!member) notFound();

  const items = await getUserItems(userId);

  return (
    <PageContainer>
      <div className="mb-6">
        <Link
          href="/wishlist"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to wishlists
        </Link>
        <h1 className="text-2xl font-semibold">{member.name}&apos;s Wishlist</h1>
        <p className="text-muted-foreground text-sm">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {member.name} hasn&apos;t added anything yet.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id}>
              <WishlistItemCard item={item} />
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
