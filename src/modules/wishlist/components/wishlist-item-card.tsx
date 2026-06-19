import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { InferSelectModel } from "drizzle-orm";
import type { wishlistItem } from "@/modules/wishlist/schema";

type WishlistItem = InferSelectModel<typeof wishlistItem>;

interface WishlistItemCardProps {
  item: WishlistItem;
  actions?: React.ReactNode;
}

const priorityVariant: Record<string, "destructive" | "secondary" | "outline"> = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

const priorityLabel: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function WishlistItemCard({ item, actions }: WishlistItemCardProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 px-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{item.name}</span>
          <Badge variant={priorityVariant[item.priority] ?? "outline"}>
            {priorityLabel[item.priority] ?? item.priority}
          </Badge>
          {item.price && (
            <span className="text-xs text-muted-foreground">{item.price}</span>
          )}
        </div>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-1">
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/30 rounded-md px-2.5 py-1.5 hover:bg-primary/10 transition-colors h-8"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            View
          </a>
        )}
        {actions}
      </div>
    </div>
  );
}
