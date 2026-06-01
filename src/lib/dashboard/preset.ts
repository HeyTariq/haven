// Curated default dashboard arrangement, shared by the server reconcile and the
// client "Reset". Server-free (data + pure function only) so the client grid can
// import it, same as types.ts.

import { PRIMARY_COLS, type WidgetPlacement } from "./types";

type WidgetSize = { w: number; h: number; minW?: number; minH?: number };

// Placement by module id at the primary breakpoint. Widgets not listed here are
// flow-placed below the preset by buildPresetLayout.
export const DASHBOARD_PRESET: Record<
  string,
  { x: number; y: number; w: number; h: number }
> = {
  bulletin: { x: 0, y: 0, w: 12, h: 4 },
  shopping: { x: 0, y: 4, w: 12, h: 4 },
  chores: { x: 0, y: 8, w: 12, h: 4 },
};

// Build the curated primary-breakpoint layout. Presets get their fixed position;
// anything unknown is flow-placed below everything already placed, mirroring the
// incremental append used for newly added modules.
export function buildPresetLayout(
  widgets: { id: string; defaultLayout: WidgetSize }[]
): WidgetPlacement[] {
  const placed: WidgetPlacement[] = [];
  for (const w of widgets) {
    const preset = DASHBOARD_PRESET[w.id];
    if (preset) {
      placed.push({
        i: w.id,
        x: preset.x,
        y: preset.y,
        w: Math.min(preset.w, PRIMARY_COLS),
        h: preset.h,
        minW: w.defaultLayout.minW,
        minH: w.defaultLayout.minH,
      });
    } else {
      const bottom = placed.reduce((max, p) => Math.max(max, p.y + p.h), 0);
      placed.push({
        i: w.id,
        x: 0,
        y: bottom,
        w: Math.min(w.defaultLayout.w, PRIMARY_COLS),
        h: w.defaultLayout.h,
        minW: w.defaultLayout.minW,
        minH: w.defaultLayout.minH,
      });
    }
  }
  return placed;
}
