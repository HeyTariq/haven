import { Gift } from "lucide-react";
import { registerModule } from "@/lib/modules/registry";
import { WishlistWidget } from "./components/wishlist-widget";

registerModule({
  id: "wishlist",
  label: "Wishlist",
  icon: Gift,
  route: "/wishlist",
  nav: true,
  widget: {
    title: "Wishlists",
    component: WishlistWidget,
    defaultLayout: { w: 5, h: 5, minW: 3, minH: 3 },
  },
});
