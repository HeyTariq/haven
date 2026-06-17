"use client";

import { useOptimistic, useTransition } from "react";
import { isToday, isPast, startOfDay, format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { completeChore } from "@/modules/chores/actions";
import type { ChoreRow } from "@/modules/chores/queries";

type OptimisticAction = { type: "complete"; id: string };

function applyOptimistic(state: ChoreRow[], action: OptimisticAction): ChoreRow[] {
  return state.map((c) =>
    c.id === action.id
      ? { ...c, completed: c.recurrence === "none" ? true : c.completed, completionCount: c.completionCount + 1 }
      : c
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone?: "danger" }) {
  return (
    <div>
      <p className={tone === "danger" ? "text-2xl font-semibold tabular-nums text-destructive" : "text-2xl font-semibold tabular-nums"}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function ChoresWidgetList({ chores: initialChores }: { chores: ChoreRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticChores, dispatch] = useOptimistic(initialChores, applyOptimistic);

  function handleComplete(choreId: string) {
    startTransition(async () => {
      dispatch({ type: "complete", id: choreId });
      await completeChore(choreId);
    });
  }

  const active = optimisticChores.filter((c) => !c.completed);
  const overdue = active.filter(
    (c) => c.dueDate && isPast(startOfDay(c.dueDate)) && !isToday(c.dueDate)
  );
  const dueToday = active.filter((c) => c.dueDate && isToday(c.dueDate));
  const preview = active.slice(0, 3);

  if (active.length === 0) {
    return <p className="text-sm text-muted-foreground">No active chores.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat value={active.length} label="Active" />
        <Stat value={dueToday.length} label="Due today" />
        <Stat value={overdue.length} label="Overdue" tone={overdue.length > 0 ? "danger" : undefined} />
      </div>
      <ul className="divide-y">
        {preview.map((c) => {
          const isOverdue = c.dueDate && isPast(startOfDay(c.dueDate)) && !isToday(c.dueDate);
          const isDueToday = c.dueDate && isToday(c.dueDate);
          const label = isOverdue
            ? "Overdue"
            : isDueToday
              ? "Today"
              : c.dueDate
                ? format(c.dueDate, "MMM d")
                : c.assignedToName ?? "";
          return (
            <li key={c.id} className="py-1 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2 py-2 -mx-2 px-2 rounded-md transition-colors hover:bg-muted/50">
                <Checkbox
                  checked={false}
                  onCheckedChange={() => handleComplete(c.id)}
                  disabled={isPending}
                  className="shrink-0"
                />
                <span className="truncate text-sm font-medium flex-1">{c.title}</span>
                <span className={`shrink-0 text-xs tabular-nums ${isOverdue ? "text-destructive" : isDueToday ? "text-amber-500" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </div>
            </li>
          );
        })}
        {active.length > 4 && (
          <li className="py-1 text-xs text-muted-foreground">+{active.length - 3} more</li>
        )}
      </ul>
    </div>
  );
}
