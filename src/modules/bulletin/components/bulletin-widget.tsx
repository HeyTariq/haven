import Link from "next/link";
import { formatDistanceToNow } from "@/lib/date";
import { Megaphone, Pin } from "lucide-react";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { cn } from "@/lib/utils";
import { getRecentForDashboard } from "@/modules/bulletin/queries";
import { CATEGORY_META } from "@/modules/bulletin/categories";
import type { User } from "@/lib/auth";

export async function BulletinWidget({ user }: { user: User }) {
  const posts = await getRecentForDashboard(user);

  return (
    <WidgetCard title="Bulletin Board" route="/bulletin" icon={Megaphone}>
      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No announcements yet.</p>
      ) : (
        <ul className="divide-y">
          {posts.map((post) => (
            <li key={post.id} className="py-1 first:pt-0 last:pb-0">
              <Link
                href={`/bulletin#post-${post.id}`}
                className="flex items-start gap-2.5 py-2 -mx-2 px-2 rounded-md transition-colors hover:bg-muted/50"
              >
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    CATEGORY_META[post.category].dotClassName
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug truncate">
                    {post.pinned && (
                      <Pin className="inline h-3 w-3 mr-1 text-muted-foreground fill-current" />
                    )}
                    <span className="font-medium">{post.title ?? post.body}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {post.authorName ?? "Unknown"} ·{" "}
                    {formatDistanceToNow(post.createdAt)}
                    {post.ackCount > 0 && ` · ${post.ackCount} acknowledged`}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
