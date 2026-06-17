import { ListChecks } from "lucide-react";
import { WidgetCard } from "@/components/dashboard/widget-card";
import { getChores } from "@/modules/chores/queries";
import { ChoresWidgetList } from "./chores-widget-list";

// Chore data is household-wide, so this widget ignores the per-user prop.
export async function ChoresWidget() {
  const chores = await getChores();

  return (
    <WidgetCard title="Chores" route="/chores" icon={ListChecks}>
      <ChoresWidgetList chores={chores} />
    </WidgetCard>
  );
}
