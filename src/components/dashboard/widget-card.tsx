import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface WidgetCardProps {
  title: string;
  route: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

// Shared chrome for every dashboard widget. The header carries the
// `widget-drag-handle` class so the grid only drags from the header,
// leaving widget content interactive.
export function WidgetCard({ title, route, icon: Icon, children }: WidgetCardProps) {
  return (
    <Card className="h-full">
      <div className="widget-drag-handle flex items-center justify-between px-4">
        <div className="font-heading text-base font-medium flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </div>
        <Link
          href={route}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
        >
          View all
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <CardContent className="min-h-0 flex-1 overflow-auto max-sm:overflow-hidden">{children}</CardContent>
    </Card>
  );
}
