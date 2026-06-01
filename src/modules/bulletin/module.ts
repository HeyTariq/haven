import { Megaphone } from "lucide-react";
import { registerModule } from "@/lib/modules/registry";
import { BulletinWidget } from "./components/bulletin-widget";

registerModule({
  id: "bulletin",
  label: "Bulletin Board",
  icon: Megaphone,
  route: "/bulletin",
  nav: true,
  widget: {
    title: "Bulletin Board",
    component: BulletinWidget,
    defaultLayout: { w: 6, h: 4, minW: 3, minH: 3 },
  },
});
