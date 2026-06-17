import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { dashboardPreference } from "@/lib/db/schema/dashboard";
import { getWidgetModules } from "@/lib/modules/registry";
import { buildPresetLayout } from "./preset";
import {
  PRIMARY_BREAKPOINT,
  PRIMARY_COLS,
  type DashboardLayoutData,
  type WidgetPlacement,
} from "./types";

// Flow-place a widget into the primary-breakpoint layout, stacking left to
// right and wrapping at the column count. Used to position widgets that have
// no saved placement (new modules).
function appendPlacement(
  placements: WidgetPlacement[],
  id: string,
  size: { w: number; h: number; minW?: number; minH?: number }
): WidgetPlacement {
  const w = Math.min(size.w, PRIMARY_COLS);
  // start below everything already placed to avoid overlap
  const bottom = placements.reduce((max, p) => Math.max(max, p.y + p.h), 0);
  return { i: id, x: 0, y: bottom, w, h: size.h, minW: size.minW, minH: size.minH };
}

// Reads the user's saved layout and reconciles it against currently registered
// widgets: drops placements for removed widgets, appends defaults for new ones.
// Robust when modules are added or removed between sessions.
export async function getDashboardLayout(
  userId: string
): Promise<DashboardLayoutData> {
  const [row] = await db
    .select()
    .from(dashboardPreference)
    .where(eq(dashboardPreference.userId, userId))
    .limit(1);

  const saved: DashboardLayoutData = row?.layout ?? { layouts: {}, hidden: [] };
  const widgets = getWidgetModules();
  const registeredIds = new Set(widgets.map((m) => m.id));

  const hidden = saved.hidden.filter((id) => registeredIds.has(id));
  const hiddenSet = new Set(hidden);

  // Reconcile every saved breakpoint: keep placements for registered widgets only.
  const layouts: Record<string, WidgetPlacement[]> = {};
  for (const [bp, placements] of Object.entries(saved.layouts)) {
    layouts[bp] = placements.filter((p) => registeredIds.has(p.i));
  }

  const primary = (layouts[PRIMARY_BREAKPOINT] ??= []);
  const placedIds = new Set(primary.map((p) => p.i));
  const unplaced = widgets.filter(
    (m) => !hiddenSet.has(m.id) && !placedIds.has(m.id)
  );

  if (primary.length === 0) {
    // Fresh dashboard: apply the curated preset for all seeded breakpoints.
    const widgetSpecs = unplaced.map((m) => ({ id: m.id, defaultLayout: m.widget!.defaultLayout }));
    primary.push(...buildPresetLayout(widgetSpecs, PRIMARY_BREAKPOINT));
    layouts["md"] = buildPresetLayout(widgetSpecs, "md");
  } else {
    // Existing layout: flow-append newly added widgets without disturbing it.
    for (const m of unplaced) {
      primary.push(appendPlacement(primary, m.id, m.widget!.defaultLayout));
    }
  }

  return { layouts, hidden };
}
