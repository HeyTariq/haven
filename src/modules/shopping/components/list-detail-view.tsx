"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Lock, Globe, Plus, Trash2 } from "lucide-react";
import { PageContainer } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  toggleItem,
  addItem,
  deleteItem,
  clearChecked,
  setListVisibility,
} from "@/modules/shopping/actions";
import type { shoppingList, shoppingItem } from "@/modules/shopping/schema";
import type { InferSelectModel } from "drizzle-orm";

type List = InferSelectModel<typeof shoppingList>;
type Item = InferSelectModel<typeof shoppingItem>;
type ListWithItems = List & { items: Item[] };

interface Props {
  list: ListWithItems;
  isOwner: boolean;
}

export function ListDetailView({ list, isOwner }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [optimisticItems, updateOptimisticItems] = useOptimistic(
    list.items,
    (state: Item[], action: { type: "toggle"; id: string } | { type: "add"; item: Item } | { type: "delete"; id: string }) => {
      if (action.type === "toggle") {
        return state.map((i) =>
          i.id === action.id ? { ...i, checked: !i.checked } : i
        );
      }
      if (action.type === "add") {
        return [...state, action.item];
      }
      if (action.type === "delete") {
        return state.filter((i) => i.id !== action.id);
      }
      return state;
    }
  );

  function handleToggle(itemId: string) {
    startTransition(async () => {
      updateOptimisticItems({ type: "toggle", id: itemId });
      await toggleItem(itemId);
    });
  }

  function handleDelete(itemId: string) {
    startTransition(async () => {
      updateOptimisticItems({ type: "delete", id: itemId });
      await deleteItem(itemId);
    });
  }

  function handleAdd(formData: FormData) {
    const name = formData.get("name") as string;
    if (!name.trim()) return;

    const tempItem: Item = {
      id: `temp-${Date.now()}`,
      listId: list.id,
      name: name.trim(),
      quantity: (formData.get("quantity") as string) || null,
      checked: false,
      addedBy: "",
      createdAt: new Date(),
    };

    startTransition(async () => {
      updateOptimisticItems({ type: "add", item: tempItem });
      await addItem(list.id, formData);
    });
  }

  function handleClearChecked() {
    startTransition(async () => {
      await clearChecked(list.id);
      toast.success("Cleared checked items.");
    });
  }

  function handleToggleVisibility() {
    const next = list.visibility === "shared" ? "private" : "shared";
    startTransition(async () => {
      await setListVisibility(list.id, next);
      toast.success(`List is now ${next}.`);
    });
  }

  const unchecked = optimisticItems.filter((i) => !i.checked);
  const checked = optimisticItems.filter((i) => i.checked);

  return (
    <PageContainer>
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold truncate">{list.name}</h1>
        </div>
        <Badge variant="outline" className="gap-1 capitalize shrink-0">
          {list.visibility === "private" ? (
            <Lock className="h-3 w-3" />
          ) : (
            <Globe className="h-3 w-3" />
          )}
          {list.visibility}
        </Badge>
      </div>

      <form
        action={handleAdd}
        className="flex gap-2 mb-6"
      >
        <Input name="name" placeholder="Add item..." required className="flex-1" />
        <Input name="quantity" placeholder="Qty" className="w-20" />
        <Button type="submit" size="icon" disabled={isPending}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      <div className="space-y-1">
        {unchecked.map((item) => (
          <div key={item.id} className="flex items-center gap-3 py-2 group">
            <Checkbox
              checked={item.checked}
              onCheckedChange={() => handleToggle(item.id)}
            />
            <span className="flex-1 min-w-0 text-sm">{item.name}</span>
            {item.quantity && (
              <span className="text-xs text-muted-foreground shrink-0">{item.quantity}</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(item.id)}
              className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {checked.length > 0 && (
        <>
          <Separator className="my-4" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Checked ({checked.length})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChecked}
              className="text-xs h-7"
            >
              Clear
            </Button>
          </div>
          <div className="space-y-1 opacity-60">
            {checked.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2 group">
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={() => handleToggle(item.id)}
                />
                <span className="flex-1 min-w-0 text-sm line-through">{item.name}</span>
                {item.quantity && (
                  <span className="text-xs text-muted-foreground shrink-0">{item.quantity}</span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(item.id)}
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {optimisticItems.length === 0 && (
        <p className="text-muted-foreground text-sm py-4">No items yet.</p>
      )}

      {isOwner && (
        <div className="mt-8 pt-4 border-t">
          <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wider">List settings</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleVisibility}
            disabled={isPending}
          >
            {list.visibility === "shared" ? (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Make private
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                Make shared
              </>
            )}
          </Button>
        </div>
      )}
    </PageContainer>
  );
}
