"use client";

import { useMemo, useState, useTransition } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import RGL from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Plus, Settings2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { saveDashboardLayout } from "@/lib/dashboard/actions";
import { buildPresetLayout } from "@/lib/dashboard/preset";
import {
  GRID_BREAKPOINTS,
  GRID_COLS,
  GRID_ROW_HEIGHT,
  PRIMARY_BREAKPOINT,
  PRIMARY_COLS,
  type DashboardLayoutData,
} from "@/lib/dashboard/types";

type Layout = RGL.Layout;
type Layouts = RGL.Layouts;

type WidgetSize = { w: number; h: number; minW?: number; minH?: number };

export type DashboardWidget = {
  id: string;
  title: string;
  node: React.ReactNode;
  defaultLayout: WidgetSize;
};

const ResponsiveGridLayout = RGL.WidthProvider(RGL.Responsive);

export function DashboardGrid({
  initialLayout,
  widgets,
}: {
  initialLayout: DashboardLayoutData;
  widgets: DashboardWidget[];
}) {
  const isMobile = useIsMobile();
  const [editing, setEditing] = useState(false);
  const [layouts, setLayouts] = useState<Layouts>(initialLayout.layouts);
  const [hidden, setHidden] = useState<string[]>(initialLayout.hidden);
  const [isPending, startTransition] = useTransition();

  const widgetById = useMemo(
    () => new Map(widgets.map((w) => [w.id, w])),
    [widgets]
  );
  const visibleWidgets = widgets.filter((w) => !hidden.includes(w.id));
  const hiddenWidgets = widgets.filter((w) => hidden.includes(w.id));

  const renderableWidgets = useMemo(() => {
    if (!isMobile) return visibleWidgets;
    const lgLayout = layouts[PRIMARY_BREAKPOINT] ?? [];
    return [...visibleWidgets].sort((a, b) => {
      const ay = lgLayout.find((p) => p.i === a.id)?.y ?? 999;
      const by = lgLayout.find((p) => p.i === b.id)?.y ?? 999;
      return ay - by;
    });
  }, [isMobile, visibleWidgets, layouts]);

  function hideWidget(id: string) {
    setHidden((prev) => [...prev, id]);
    setLayouts((prev) => {
      const next: Layouts = {};
      for (const [bp, items] of Object.entries(prev)) {
        next[bp] = items.filter((it) => it.i !== id);
      }
      return next;
    });
  }

  function showWidget(id: string) {
    const widget = widgetById.get(id);
    if (!widget) return;
    setHidden((prev) => prev.filter((h) => h !== id));
    setLayouts((prev) => {
      const current = prev[PRIMARY_BREAKPOINT] ?? [];
      const bottom = current.reduce((max, p) => Math.max(max, p.y + p.h), 0);
      const placement: Layout = {
        i: id,
        x: 0,
        y: bottom,
        w: Math.min(widget.defaultLayout.w, PRIMARY_COLS),
        h: widget.defaultLayout.h,
        minW: widget.defaultLayout.minW,
        minH: widget.defaultLayout.minH,
      };
      return { ...prev, [PRIMARY_BREAKPOINT]: [...current, placement] };
    });
  }

  function handleSave() {
    const data: DashboardLayoutData = { layouts, hidden };
    startTransition(async () => {
      try {
        await saveDashboardLayout(data);
        setEditing(false);
        toast.success("Dashboard saved");
      } catch {
        toast.error("Could not save dashboard");
      }
    });
  }

  function handleCancel() {
    setLayouts(initialLayout.layouts);
    setHidden(initialLayout.hidden);
    setEditing(false);
  }

  function handleReset() {
    setHidden([]);
    const widgetSpecs = widgets.map((w) => ({ id: w.id, defaultLayout: w.defaultLayout }));
    setLayouts({
      [PRIMARY_BREAKPOINT]: buildPresetLayout(widgetSpecs),
      md: buildPresetLayout(widgetSpecs, "md"),
    });
  }

  return (
    <div>
      <div className="flex items-center justify-end gap-2 mb-4">
        {editing ? (
          <>
            {hiddenWidgets.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="outline" size="sm" />}
                >
                  <Plus className="h-4 w-4" />
                  Add widget
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {hiddenWidgets.map((w) => (
                    <DropdownMenuItem key={w.id} onClick={() => showWidget(w.id)}>
                      {w.title}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Settings2 className="h-4 w-4" />
            Customize
          </Button>
        )}
      </div>

      {isMobile ? (
        <div className="flex flex-col gap-4">
          {renderableWidgets.map((w) => (
            <div key={w.id} className="h-44">
              {w.node}
            </div>
          ))}
        </div>
      ) : (
        <ResponsiveGridLayout
          className={editing ? "-mx-2 [&_.widget-drag-handle]:cursor-move" : "-mx-2"}
          layouts={layouts}
          breakpoints={GRID_BREAKPOINTS}
          cols={GRID_COLS}
          rowHeight={GRID_ROW_HEIGHT}
          margin={[16, 16]}
          containerPadding={[8, 0]}
          isDraggable={editing}
          isResizable={editing}
          draggableHandle=".widget-drag-handle"
          onLayoutChange={(_current, all) => {
            if (editing) setLayouts(all);
          }}
        >
          {renderableWidgets.map((w) => (
            <div key={w.id} className="relative">
              {editing && (
                <button
                  type="button"
                  onClick={() => hideWidget(w.id)}
                  aria-label={`Hide ${w.title}`}
                  className="absolute -top-2 -right-2 z-10 grid size-6 place-items-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {w.node}
            </div>
          ))}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}
