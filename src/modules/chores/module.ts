import { ListChecks } from "lucide-react";
import { registerModule } from "@/lib/modules/registry";
import { ChoresWidget } from "./components/chores-widget";

registerModule({
  id: "chores",
  label: "Chores",
  icon: ListChecks,
  route: "/chores",
  nav: true,
  widget: {
    title: "Chores",
    component: ChoresWidget,
    defaultLayout: { w: 3, h: 4, minW: 3, minH: 3 },
  },
});
