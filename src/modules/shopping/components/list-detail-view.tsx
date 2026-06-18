"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Lock, Plus, Trash2, Share2 } from "lucide-react";
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
} from "@/modules/shopping/actions";
import { ListSettingsButton } from "@/modules/shopping/components/list-settings";
import { formatListAsText } from "@/modules/shopping/format";
import type { shoppingList, shoppingItem } from "@/modules/shopping/schema";
import type { InferSelectModel } from "drizzle-orm";

type List = InferSelectModel<typeof shoppingList>;
type Item = InferSelectModel<typeof shoppingItem> & { addedByName: string | null };
type ListWithItems = List & { createdByName: string | null; items: Item[] };

interface Props {
  list: ListWithItems;
  isOwner: boolean;
}

// Copy text to the clipboard, with a fallback for insecure contexts (plain
// HTTP on the LAN), where navigator.clipboard is unavailable.
async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the legacy path
    }
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function ListDetailView({ list, isOwner }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // navigator.share only exists in a secure context (HTTPS / localhost). Detect
  // in an effect so the server and first client render agree.
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
  }, []);

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
      addedByName: null,
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

  // Mobile (HTTPS): open the native share sheet so the list can ride along to
  // Messages, Notes, Mail, etc.
  async function handleNativeShare() {
    const text = formatListAsText(list.name, optimisticItems);
    try {
      await navigator.share({ title: list.name, text });
    } catch (err) {
      // User dismissing the share sheet throws AbortError — ignore it.
      if ((err as Error).name !== "AbortError") {
        toast.error("Couldn't share the list.");
      }
    }
  }

  async function handleCopy() {
    const text = formatListAsText(list.name, optimisticItems);
    const ok = await copyText(text);
    if (ok) {
      toast.success("List copied to clipboard.");
    } else {
      toast.error("Couldn't copy the list.");
    }
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
          {list.createdByName && (
            <p className="text-xs text-muted-foreground truncate">
              Created by {list.createdByName}
            </p>
          )}
        </div>
        {list.visibility === "private" && (
          <Badge variant="outline" className="gap-1 shrink-0">
            <Lock className="h-3 w-3" />
            Private
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={canNativeShare ? handleNativeShare : handleCopy}
          className="h-8 w-8 shrink-0"
          aria-label="Share list"
          title="Share list"
        >
          <Share2 className="h-4 w-4" />
        </Button>
        {isOwner && (
          <ListSettingsButton listId={list.id} visibility={list.visibility} />
        )}
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
            <div className="flex-1 min-w-0">
              <span className="text-sm">{item.name}</span>
              {item.addedBy !== list.createdBy && item.addedByName && (
                <span className="block text-xs text-muted-foreground">
                  added by {item.addedByName}
                </span>
              )}
            </div>
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
                <div className="flex-1 min-w-0">
                  <span className="text-sm line-through">{item.name}</span>
                  {item.addedBy !== list.createdBy && item.addedByName && (
                    <span className="block text-xs text-muted-foreground">
                      added by {item.addedByName}
                    </span>
                  )}
                </div>
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
    </PageContainer>
  );
}
