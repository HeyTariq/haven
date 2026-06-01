"use client";

import { useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createChore, updateChore } from "@/modules/chores/actions";
import type { Member } from "@/lib/auth/members";
import type { ChoreRow } from "@/modules/chores/queries";

interface ChoreFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  chore?: ChoreRow;
}

export function ChoreFormDialog({
  open,
  onOpenChange,
  members,
  chore,
}: ChoreFormDialogProps) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const isEdit = !!chore;

  // reset form when dialog opens fresh for create
  useEffect(() => {
    if (open && !isEdit) formRef.current?.reset();
  }, [open, isEdit]);

  function formatDateValue(d: Date | null) {
    if (!d) return "";
    // yyyy-mm-dd for input[type=date]
    return d.toISOString().slice(0, 10);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      if (isEdit) {
        await updateChore(chore.id, formData);
        toast.success("Chore updated.");
      } else {
        await createChore(formData);
        toast.success("Chore created.");
      }
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit chore" : "New chore"}</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="Clean kitchen"
              defaultValue={chore?.title}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Optional details"
              defaultValue={chore?.description ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedToUserId">Assign to</Label>
            <select
              id="assignedToUserId"
              name="assignedToUserId"
              defaultValue={chore?.assignedToUserId ?? ""}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="recurrence">Recurrence</Label>
              <select
                id="recurrence"
                name="recurrence"
                defaultValue={chore?.recurrence ?? "none"}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="none">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                name="points"
                type="number"
                min="0"
                max="9999"
                defaultValue={chore?.points ?? 0}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due date</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              defaultValue={formatDateValue(chore?.dueDate ?? null)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isEdit ? "Save changes" : "Create chore"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
