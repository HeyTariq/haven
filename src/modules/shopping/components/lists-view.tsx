"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Lock, Globe, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createList, deleteList } from "@/modules/shopping/actions";
import type { shoppingList } from "@/modules/shopping/schema";
import type { InferSelectModel } from "drizzle-orm";

type List = InferSelectModel<typeof shoppingList> & { createdByName: string | null };

interface ListsViewProps {
  lists: List[];
}

export function ListsView({ lists: initialLists }: ListsViewProps) {
  const [lists, setLists] = useState(initialLists);
  const [open, setOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // sync local state when server re-renders with fresh data after mutations
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLists(initialLists);
  }, [initialLists]);

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      await createList(formData);
      setOpen(false);
      toast.success("List created.");
    });
  }

  function handleDelete(listId: string) {
    setLists((prev) => prev.filter((l) => l.id !== listId));
    startTransition(async () => {
      await deleteList(listId);
    });
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="h-4 w-4 mr-1" />
            New list
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New shopping list</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required placeholder="House groceries" />
              </div>
              <div className="space-y-2">
                <Label>Visibility</Label>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer has-[:checked]:border-primary flex-1">
                    <input type="radio" name="visibility" value="shared" defaultChecked className="sr-only" />
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">Shared</span>
                  </label>
                  <label className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer has-[:checked]:border-primary flex-1">
                    <input type="radio" name="visibility" value="private" className="sr-only" />
                    <Lock className="h-4 w-4" />
                    <span className="text-sm">Private</span>
                  </label>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                Create
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {lists.length === 0 && (
        <p className="text-muted-foreground text-sm">No lists yet. Create one above.</p>
      )}

      <div className="space-y-2">
        {lists.map((list) => (
          <Card key={list.id} className="relative hover:bg-muted/30 transition-colors">
            <CardContent className="flex items-center justify-between py-3 px-4">
              <Link href={`/shopping/${list.id}`} className="absolute inset-0" />
              <div className="flex items-center gap-3 flex-1 min-w-0 pointer-events-none">
                {list.visibility === "private" ? (
                  <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="font-medium truncate">{list.name}</span>
              </div>
              <div className="flex items-center gap-2 ml-2 relative z-10">
                <Badge variant="outline" className="capitalize text-xs">
                  {list.visibility}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget({ id: list.id, name: list.name })}
                  className="text-destructive hover:text-destructive h-8 w-8 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete list?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleteTarget?.name}&rdquo; and all its items will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                if (deleteTarget) handleDelete(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
