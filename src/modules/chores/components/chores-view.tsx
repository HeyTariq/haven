"use client";

import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, RefreshCw, Trophy } from "lucide-react";
import { format, isToday, isPast, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { completeChore, uncompleteChore, deleteChore } from "@/modules/chores/actions";
import { ChoreFormDialog } from "./chore-form-dialog";
import type { ChoreRow, ScoreboardEntry } from "@/modules/chores/queries";
import type { Member } from "@/lib/auth/members";
import type { ChoreSettings } from "@/lib/settings";

interface ChoresViewProps {
  chores: ChoreRow[];
  members: Member[];
  scoreboard: ScoreboardEntry[];
  currentUserId: string;
  isAdmin: boolean;
  settings: ChoreSettings;
}

type OptimisticAction =
  | { type: "complete"; id: string }
  | { type: "uncomplete"; id: string }
  | { type: "delete"; id: string };

function applyOptimistic(state: ChoreRow[], action: OptimisticAction): ChoreRow[] {
  if (action.type === "complete") {
    return state.map((c) =>
      c.id === action.id
        ? { ...c, completed: c.recurrence === "none" ? true : c.completed, completionCount: c.completionCount + 1 }
        : c
    );
  }
  if (action.type === "uncomplete") {
    return state.map((c) =>
      c.id === action.id
        ? { ...c, completed: false, completionCount: Math.max(0, c.completionCount - 1) }
        : c
    );
  }
  if (action.type === "delete") {
    return state.filter((c) => c.id !== action.id);
  }
  return state;
}

function DueBadge({ dueDate }: { dueDate: Date | null }) {
  if (!dueDate) return null;
  if (isPast(startOfDay(dueDate)) && !isToday(dueDate)) {
    return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
  }
  if (isToday(dueDate)) {
    return <Badge variant="outline" className="text-xs border-orange-400 text-orange-500">Today</Badge>;
  }
  return <Badge variant="outline" className="text-xs">{format(dueDate, "MMM d")}</Badge>;
}

function RecurrenceBadge({ recurrence }: { recurrence: ChoreRow["recurrence"] }) {
  if (recurrence === "none") return null;
  return (
    <Badge variant="secondary" className="text-xs gap-1">
      <RefreshCw className="h-2.5 w-2.5" />
      {recurrence}
    </Badge>
  );
}

function canEdit(
  chore: ChoreRow,
  currentUserId: string,
  isAdmin: boolean,
  editPolicy: ChoreSettings["editPolicy"]
): boolean {
  if (editPolicy === "any") return true;
  return chore.createdBy === currentUserId || isAdmin;
}

export function ChoresView({
  chores: initialChores,
  members,
  scoreboard,
  currentUserId,
  isAdmin,
  settings,
}: ChoresViewProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticChores, dispatch] = useOptimistic(initialChores, applyOptimistic);
  const [createOpen, setCreateOpen] = useState(false);
  const [editChore, setEditChore] = useState<ChoreRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ChoreRow | null>(null);

  function handleComplete(choreId: string) {
    startTransition(async () => {
      dispatch({ type: "complete", id: choreId });
      await completeChore(choreId);
    });
  }

  function handleUncomplete(choreId: string) {
    startTransition(async () => {
      dispatch({ type: "uncomplete", id: choreId });
      await uncompleteChore(choreId);
    });
  }

  function handleDelete(choreId: string) {
    setDeleteTarget(null);
    startTransition(async () => {
      dispatch({ type: "delete", id: choreId });
      await deleteChore(choreId);
      toast.success("Chore deleted.");
    });
  }

  const active = optimisticChores.filter((c) => !c.completed);
  const done = optimisticChores.filter((c) => c.completed);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New chore
        </Button>
      </div>
      {settings.showPoints && scoreboard.length > 0 && (
        <Card>
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Points</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {scoreboard.map((entry) => (
                <div key={entry.userId} className="flex items-center gap-1.5">
                  <span className="text-sm">{entry.name}</span>
                  <Badge variant="secondary" className="text-xs">{entry.points}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {active.length === 0 && done.length === 0 && (
        <p className="text-muted-foreground text-sm">No chores yet. Create one above.</p>
      )}

      <div className="space-y-2">
        {active.map((c) => {
          const editable = canEdit(c, currentUserId, isAdmin, settings.editPolicy);
          return (
            <Card key={c.id}>
              <CardContent className="flex items-start gap-3 py-3 px-4">
                <div className="pt-0.5">
                  <Checkbox
                    checked={false}
                    onCheckedChange={() => handleComplete(c.id)}
                    disabled={isPending}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm leading-snug">{c.title}</p>
                  {c.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {c.assignedToName && (
                      <span className="text-xs text-muted-foreground">{c.assignedToName}</span>
                    )}
                    <RecurrenceBadge recurrence={c.recurrence} />
                    <DueBadge dueDate={c.dueDate} />
                    {c.points > 0 && (
                      <Badge variant="outline" className="text-xs">{c.points} pts</Badge>
                    )}
                  </div>
                </div>
                {editable && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => setEditChore(c)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(c)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {done.length > 0 && (
        <>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">
              Done ({done.length})
            </p>
            <div className="space-y-2 opacity-60">
              {done.map((c) => (
                <Card key={c.id}>
                  <CardContent className="flex items-start gap-3 py-3 px-4">
                    <div className="pt-0.5">
                      <Checkbox
                        checked={true}
                        onCheckedChange={() => handleUncomplete(c.id)}
                        disabled={isPending}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-through leading-snug">{c.title}</p>
                      {c.assignedToName && (
                        <span className="text-xs text-muted-foreground">{c.assignedToName}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      <ChoreFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        members={members}
      />

      <ChoreFormDialog
        key={editChore?.id}
        open={editChore !== null}
        onOpenChange={(o) => { if (!o) setEditChore(null); }}
        members={members}
        chore={editChore ?? undefined}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete chore?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleteTarget?.title}&rdquo; will be permanently deleted.
            </DialogDescription>
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
