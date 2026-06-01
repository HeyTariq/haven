"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { setChoreEditPolicy, setChoreShowPoints } from "@/modules/chores/actions";
import type { ChoreSettings } from "@/lib/settings";

interface ChoreSettingsProps {
  settings: ChoreSettings;
}

export function ChoreSettingsButton({ settings }: ChoreSettingsProps) {
  const [open, setOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState(settings.editPolicy);
  const [showPoints, setShowPoints] = useState(settings.showPoints);
  const [isPending, startTransition] = useTransition();

  function handleEditPolicyChange(value: "any" | "ownerOrAdmin") {
    setEditPolicy(value);
    startTransition(async () => {
      await setChoreEditPolicy(value);
      toast.success("Edit policy updated.");
    });
  }

  function handleShowPointsChange(value: boolean) {
    setShowPoints(value);
    startTransition(async () => {
      await setChoreShowPoints(value);
      toast.success(value ? "Points scoreboard shown." : "Points scoreboard hidden.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
        <Settings className="h-4 w-4" />
        <span className="sr-only">Chore settings</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chores settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Who can edit chores?</Label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="editPolicy"
                  value="any"
                  checked={editPolicy === "any"}
                  onChange={() => handleEditPolicyChange("any")}
                  disabled={isPending}
                  className="accent-primary"
                />
                <span className="text-sm">Any member</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="editPolicy"
                  value="ownerOrAdmin"
                  checked={editPolicy === "ownerOrAdmin"}
                  onChange={() => handleEditPolicyChange("ownerOrAdmin")}
                  disabled={isPending}
                  className="accent-primary"
                />
                <span className="text-sm">Creator or admin only</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Points scoreboard</Label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPoints}
                onChange={(e) => handleShowPointsChange(e.target.checked)}
                disabled={isPending}
                className="accent-primary"
              />
              <span className="text-sm">Show points scoreboard</span>
            </label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
