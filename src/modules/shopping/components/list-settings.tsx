"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Settings, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { setListVisibility } from "@/modules/shopping/actions";

interface Props {
  listId: string;
  visibility: "shared" | "private";
}

export function ListSettingsButton({ listId, visibility: initial }: Props) {
  const [open, setOpen] = useState(false);
  const [visibility, setVisibility] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function handleChange(value: "shared" | "private") {
    setVisibility(value);
    startTransition(async () => {
      await setListVisibility(listId, value);
      toast.success(`List is now ${value}.`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
        <Settings className="h-4 w-4" />
        <span className="sr-only">List settings</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>List settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Visibility</Label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="shared"
                  checked={visibility === "shared"}
                  onChange={() => handleChange("shared")}
                  disabled={isPending}
                  className="accent-primary"
                />
                <Globe className="h-4 w-4" />
                <span className="text-sm">
                  Shared <span className="text-muted-foreground">— visible to everyone</span>
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={visibility === "private"}
                  onChange={() => handleChange("private")}
                  disabled={isPending}
                  className="accent-primary"
                />
                <Lock className="h-4 w-4" />
                <span className="text-sm">
                  Private <span className="text-muted-foreground">— only you</span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
