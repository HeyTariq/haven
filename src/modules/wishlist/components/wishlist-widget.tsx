import Link from "next/link";
import { Gift } from "lucide-react";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { getAllItemsGroupedByUser } from "@/modules/wishlist/queries";
import type { User } from "@/lib/auth";

export async function WishlistWidget({ user }: { user: User }) {
  const rows = await getAllItemsGroupedByUser();

  const grouped = new Map<string, { userId: string; userName: string; items: typeof rows }>();
  for (const row of rows) {
    if (!grouped.has(row.userId)) {
      grouped.set(row.userId, { userId: row.userId, userName: row.userName ?? "Unknown", items: [] });
    }
    grouped.get(row.userId)!.items.push(row);
  }

  const members = Array.from(grouped.values()).slice(0, 5);

  return (
    <WidgetCard title="Wishlists" route="/wishlist" icon={Gift}>
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No wishlists yet. Add items to your own wishlist.</p>
      ) : (
        <ul className="divide-y">
          {members.map(({ userId, userName, items }) => (
            <li key={userId} className="py-1 first:pt-0 last:pb-0">
              <Link
                href={userId === user.id ? "/wishlist" : `/wishlist/${userId}`}
                className="flex items-center justify-between gap-2 py-2 -mx-2 px-2 rounded-md transition-colors hover:bg-muted/50"
              >
                <span className="min-w-0">
                  <span className="truncate text-sm font-medium block">
                    {userId === user.id ? `${userName} (you)` : userName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground block">
                    {items
                      .slice(0, 2)
                      .map((i) => i.name)
                      .join(", ")}
                    {items.length > 2 ? ` +${items.length - 2} more` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {items.length} {items.length === 1 ? "item" : "items"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
