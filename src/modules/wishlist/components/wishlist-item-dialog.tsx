"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addWishlistItem, updateWishlistItem } from "@/modules/wishlist/actions";
import type { InferSelectModel } from "drizzle-orm";
import type { wishlistItem } from "@/modules/wishlist/schema";

type WishlistItem = InferSelectModel<typeof wishlistItem>;

interface WishlistItemDialogProps {
  mode: "add" | "edit";
  item?: WishlistItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WishlistItemDialog({ mode, item, open, onOpenChange }: WishlistItemDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      if (mode === "add") {
        await addWishlistItem(formData);
        toast.success("Item added.");
      } else if (mode === "edit" && item) {
        await updateWishlistItem(item.id, formData);
        toast.success("Item updated.");
      }
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "add" ? "Add wishlist item" : "Edit item"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={item?.name ?? ""}
              placeholder="e.g. Wireless headphones"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={item?.description ?? ""}
              placeholder="Colour, size, model, notes..."
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                defaultValue={item?.price ?? ""}
                placeholder="e.g. ~$50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                name="priority"
                defaultValue={item?.priority ?? "medium"}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">Link</Label>
            <Input
              id="url"
              name="url"
              type="url"
              defaultValue={item?.url ?? ""}
              placeholder="https://..."
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {mode === "add" ? "Add item" : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
