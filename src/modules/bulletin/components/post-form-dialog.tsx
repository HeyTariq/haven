"use client";

import { useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createPost, updatePost } from "@/modules/bulletin/actions";
import { CATEGORY_META, CATEGORY_ORDER, PRIORITY_ORDER } from "@/modules/bulletin/categories";
import type { PostRow } from "@/modules/bulletin/queries";

interface PostFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: PostRow;
}

function formatDateValue(d: Date | null) {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

export function PostFormDialog({ open, onOpenChange, post }: PostFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const isEdit = !!post;

  useEffect(() => {
    if (open && !isEdit) formRef.current?.reset();
  }, [open, isEdit]);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      if (isEdit) {
        await updatePost(post.id, formData);
        toast.success("Announcement updated.");
      } else {
        await createPost(formData);
        toast.success("Announcement posted.");
      }
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit announcement" : "New announcement"}</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Optional headline"
              defaultValue={post?.title ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              name="body"
              required
              placeholder="What do you want to announce?"
              defaultValue={post?.body}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                name="category"
                defaultValue={post?.category ?? "general"}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              >
                {CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_META[c].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                name="priority"
                defaultValue={post?.priority ?? "normal"}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              >
                {PRIORITY_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expires (optional)</Label>
            <Input
              id="expiresAt"
              name="expiresAt"
              type="date"
              defaultValue={formatDateValue(post?.expiresAt ?? null)}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="pinned"
              defaultChecked={post?.pinned ?? false}
              className="size-4 rounded border-input"
            />
            Pin to top
          </label>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isEdit ? "Save changes" : "Post announcement"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
