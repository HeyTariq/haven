import { ShoppingCart } from "lucide-react";
import { registerModule } from "@/lib/modules/registry";
import { ShoppingWidget } from "./components/shopping-widget";

registerModule({
  id: "shopping",
  label: "Shopping",
  icon: ShoppingCart,
  route: "/shopping",
  nav: true,
  widget: {
    title: "Shopping",
    component: ShoppingWidget,
    defaultLayout: { w: 3, h: 4, minW: 3, minH: 3 },
  },
});
