// Curated default dashboard arrangement, shared by the server reconcile and the
// client "Reset". Server-free (data + pure function only) so the client grid can
// import it, same as types.ts.

import { GRID_COLS, PRIMARY_BREAKPOINT, PRIMARY_COLS, type WidgetPlacement } from "./types";

type WidgetSize = { w: number; h: number; minW?: number; minH?: number };
type BreakpointPreset = Record<string, { x: number; y: number; w: number; h: number }>;

// Per-breakpoint placement presets. Only breakpoints listed here are explicitly
// seeded; others are derived by react-grid-layout from the nearest larger one.
export const DASHBOARD_PRESETS: Record<string, BreakpointPreset> = {
  lg: {
    bulletin: { x: 0, y: 0, w: 5, h: 8 },
    shopping: { x: 5, y: 0, w: 5, h: 4 },
    chores:   { x: 5, y: 4, w: 5, h: 4 },
  },
  md: {
    bulletin: { x: 0, y: 0, w: 5, h: 8 },
    shopping: { x: 5, y: 0, w: 5, h: 4 },
    chores:   { x: 5, y: 4, w: 5, h: 4 },
  },
};

// Build a curated layout for the given breakpoint. Presets get their fixed
// position; anything unknown is flow-placed below everything already placed.
export function buildPresetLayout(
  widgets: { id: string; defaultLayout: WidgetSize }[],
  breakpoint: string = PRIMARY_BREAKPOINT
): WidgetPlacement[] {
  const cols = GRID_COLS[breakpoint as keyof typeof GRID_COLS] ?? PRIMARY_COLS;
  const preset = DASHBOARD_PRESETS[breakpoint] ?? DASHBOARD_PRESETS[PRIMARY_BREAKPOINT];
  const placed: WidgetPlacement[] = [];
  for (const w of widgets) {
    const p = preset[w.id];
    if (p) {
      placed.push({
        i: w.id,
        x: p.x,
        y: p.y,
        w: Math.min(p.w, cols),
        h: p.h,
        minW: w.defaultLayout.minW,
        minH: w.defaultLayout.minH,
      });
    } else {
      const bottom = placed.reduce((max, p) => Math.max(max, p.y + p.h), 0);
      placed.push({
        i: w.id,
        x: 0,
        y: bottom,
        w: Math.min(w.defaultLayout.w, cols),
        h: w.defaultLayout.h,
        minW: w.defaultLayout.minW,
        minH: w.defaultLayout.minH,
      });
    }
  }
  return placed;
}
