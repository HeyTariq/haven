"use client";

import { useState, useTransition, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WishlistItemCard } from "./wishlist-item-card";
import { WishlistItemDialog } from "./wishlist-item-dialog";
import { deleteWishlistItem } from "@/modules/wishlist/actions";
import type { InferSelectModel } from "drizzle-orm";
import type { wishlistItem } from "@/modules/wishlist/schema";

type WishlistItem = InferSelectModel<typeof wishlistItem>;

interface MyWishlistViewProps {
  initialItems: WishlistItem[];
  addOpen: boolean;
  onAddOpenChange: (open: boolean) => void;
}

export function MyWishlistView({ initialItems, addOpen, onAddOpenChange }: MyWishlistViewProps) {
  const [items, setItems] = useState(initialItems);
  const [editItem, setEditItem] = useState<WishlistItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WishlistItem | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(initialItems);
  }, [initialItems]);

  function handleDelete(item: WishlistItem) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    startTransition(async () => {
      await deleteWishlistItem(item.id);
      toast.success("Item removed.");
    });
  }

  return (
    <div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Your wishlist is empty. Add something!</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id}>
              <WishlistItemCard
                item={item}
                actions={
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditItem(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                }
              />
            </Card>
          ))}
        </div>
      )}

      <WishlistItemDialog mode="add" open={addOpen} onOpenChange={onAddOpenChange} />

      <WishlistItemDialog
        mode="edit"
        item={editItem ?? undefined}
        open={editItem !== null}
        onOpenChange={(open) => {
          if (!open) setEditItem(null);
        }}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Remove item?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleteTarget?.name}&rdquo; will be permanently removed from your wishlist.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                if (deleteTarget) handleDelete(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
