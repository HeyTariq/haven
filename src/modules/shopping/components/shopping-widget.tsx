import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { getListsWithCounts } from "@/modules/shopping/queries";
import type { User } from "@/lib/auth";

export async function ShoppingWidget({ user }: { user: User }) {
  const lists = (await getListsWithCounts(user)).slice(0, 6);

  return (
    <WidgetCard title="Shopping" route="/shopping" icon={ShoppingCart}>
      {lists.length === 0 ? (
        <p className="text-sm text-muted-foreground">No shopping lists yet.</p>
      ) : (
        <ul className="divide-y">
          {lists.map((list) => (
            <li key={list.id} className="py-1 first:pt-0 last:pb-0">
              <Link
                href={`/shopping/${list.id}`}
                className="flex items-center justify-between gap-2 py-2 -mx-2 px-2 rounded-md transition-colors hover:bg-muted/50"
              >
                <span className="truncate text-sm font-medium">{list.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {list.uncheckedItems > 0
                    ? `${list.uncheckedItems} to buy`
                    : list.totalItems > 0
                      ? "Done"
                      : "Empty"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
