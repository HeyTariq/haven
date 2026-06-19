"use client";

import { useState, useTransition } from "react";
import { formatDistanceToNow } from "@/lib/date";
import { MoreHorizontal, Pin, Pencil, Trash2, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  acknowledgePost,
  unacknowledgePost,
  togglePin,
} from "@/modules/bulletin/actions";
import { CATEGORY_META, PRIORITY_META } from "@/modules/bulletin/categories";
import type { PostRow } from "@/modules/bulletin/queries";

interface PostCardProps {
  post: PostRow;
  currentUserId: string;
  isAdmin: boolean;
  onEdit: (post: PostRow) => void;
  onDelete: (post: PostRow) => void;
}

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PostCard({
  post,
  currentUserId,
  isAdmin,
  onEdit,
  onDelete,
}: PostCardProps) {
  const [isPending, startTransition] = useTransition();
  const [acked, setAcked] = useState(post.ackedByMe);
  const [ackCount, setAckCount] = useState(post.ackCount);

  const canMutate = post.authorId === currentUserId || isAdmin;
  const category = CATEGORY_META[post.category];
  const priority = PRIORITY_META[post.priority];
  const edited = post.updatedAt.getTime() - post.createdAt.getTime() > 1000;

  function handleAck() {
    const next = !acked;
    setAcked(next);
    setAckCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      if (next) await acknowledgePost(post.id);
      else await unacknowledgePost(post.id);
    });
  }

  function handlePin() {
    startTransition(async () => {
      await togglePin(post.id);
    });
  }

  return (
    <Card
      id={`post-${post.id}`}
      className={cn(
        "scroll-mt-20 target:ring-2 target:ring-ring",
        priority.cardClassName
      )}
    >
      <CardContent className="py-3 px-4">
        <div className="flex items-start gap-3">
          <Avatar size="sm" className="mt-0.5">
            {post.authorImage && <AvatarImage src={post.authorImage} />}
            <AvatarFallback>{initials(post.authorName)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-medium">{post.authorName ?? "Unknown"}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(post.createdAt)}
                {edited && " (edited)"}
              </span>
              {post.pinned && <Pin className="h-3 w-3 text-muted-foreground fill-current" />}
            </div>

            {post.title && (
              <p className="font-medium text-sm mt-1 leading-snug">{post.title}</p>
            )}
            <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap break-words">
              {post.body}
            </p>

            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <Badge variant="outline" className={cn("text-xs", category.badgeClassName)}>
                {category.label}
              </Badge>
              {post.priority !== "normal" && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    post.priority === "urgent"
                      ? "border-red-400 text-red-600 dark:text-red-400"
                      : "border-amber-400 text-amber-600 dark:text-amber-400"
                  )}
                >
                  {priority.label}
                </Badge>
              )}
              {post.expiresAt && (
                <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  Expires {post.expiresAt.toLocaleDateString()}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Button
                variant={acked ? "secondary" : "outline"}
                size="xs"
                onClick={handleAck}
                disabled={isPending}
              >
                <Check className="h-3 w-3" />
                {acked ? "Got it" : "Acknowledge"}
              </Button>
              {ackCount > 0 && (
                <span
                  className="text-xs text-muted-foreground"
                  title={post.ackerNames.join(", ")}
                >
                  {ackCount} acknowledged
                </span>
              )}
            </div>
          </div>

          {canMutate && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground shrink-0"
                  />
                }
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(post)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePin}>
                  <Pin className="h-3.5 w-3.5" />
                  {post.pinned ? "Unpin" : "Pin to top"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(post)}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
