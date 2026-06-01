// Shared dashboard layout shapes. Kept free of server imports so the client
// grid component can import them without pulling in db.

export type WidgetPlacement = {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
};

// Placements keyed per react-grid-layout breakpoint (e.g. "lg", "sm").
export type DashboardLayoutData = {
  layouts: Record<string, WidgetPlacement[]>;
  hidden: string[];
};

// Shared between the reconcile logic (default placement) and the client grid.
export const GRID_BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
export const GRID_COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
export const GRID_ROW_HEIGHT = 64;
// Layout authored at this breakpoint; others are derived by react-grid-layout.
export const PRIMARY_BREAKPOINT = "lg";
export const PRIMARY_COLS = GRID_COLS.lg;
