import { isToday, isPast, startOfDay } from "date-fns";
import { ListChecks, Trophy } from "lucide-react";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { getChores, getScoreboard } from "@/modules/chores/queries";

// Chore data is household-wide, so this widget ignores the per-user prop.
export async function ChoresWidget() {
  const [chores, scoreboard] = await Promise.all([getChores(), getScoreboard()]);

  const active = chores.filter((c) => !c.completed);
  const overdue = active.filter(
    (c) => c.dueDate && isPast(startOfDay(c.dueDate)) && !isToday(c.dueDate)
  );
  const dueToday = active.filter((c) => c.dueDate && isToday(c.dueDate));
  const topScorers = scoreboard.filter((s) => s.points > 0).slice(0, 3);

  return (
    <WidgetCard title="Chores" route="/chores" icon={ListChecks}>
      {active.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active chores.</p>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat value={active.length} label="Active" />
            <Stat value={dueToday.length} label="Due today" />
            <Stat value={overdue.length} label="Overdue" tone={overdue.length > 0 ? "danger" : undefined} />
          </div>
          {topScorers.length > 0 && (
            <ul className="space-y-1">
              {topScorers.map((s, i) => (
                <li
                  key={s.userId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {i === 0 && <Trophy className="h-3.5 w-3.5 text-amber-500" />}
                    <span className="truncate">{s.name}</span>
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {s.points} pts
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </WidgetCard>
  );
}

function Stat({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone?: "danger";
}) {
  return (
    <div>
      <p
        className={
          tone === "danger"
            ? "text-2xl font-semibold tabular-nums text-destructive"
            : "text-2xl font-semibold tabular-nums"
        }
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
