"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deletePost } from "@/modules/bulletin/actions";
import { PostCard } from "./post-card";
import { PostFormDialog } from "./post-form-dialog";
import type { PostRow } from "@/modules/bulletin/queries";

interface BulletinBoardViewProps {
  posts: PostRow[];
  currentUserId: string;
  isAdmin: boolean;
}

export function BulletinBoardView({
  posts,
  currentUserId,
  isAdmin,
}: BulletinBoardViewProps) {
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editPost, setEditPost] = useState<PostRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PostRow | null>(null);

  function handleDelete(postId: string) {
    setDeleteTarget(null);
    startTransition(async () => {
      await deletePost(postId);
      toast.success("Announcement deleted.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bulletin Board</h1>
          <p className="text-muted-foreground text-sm">Household announcements</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New announcement
        </Button>
      </div>

      {posts.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No announcements yet. Post the first one above.
        </p>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onEdit={setEditPost}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <PostFormDialog open={createOpen} onOpenChange={setCreateOpen} />

      <PostFormDialog
        open={editPost !== null}
        onOpenChange={(o) => {
          if (!o) setEditPost(null);
        }}
        post={editPost ?? undefined}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete announcement?</DialogTitle>
            <DialogDescription>This will be permanently deleted.</DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
