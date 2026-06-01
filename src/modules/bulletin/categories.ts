export type Category =
  | "announcement"
  | "event"
  | "reminder"
  | "general"
  | "forsale";

export type Priority = "normal" | "important" | "urgent";

// Shared by the form select, post card badge, and dashboard widget dot.
export const CATEGORY_META: Record<
  Category,
  { label: string; badgeClassName: string; dotClassName: string }
> = {
  announcement: {
    label: "Announcement",
    badgeClassName: "border-blue-400 text-blue-600 dark:text-blue-400",
    dotClassName: "bg-blue-500",
  },
  event: {
    label: "Event",
    badgeClassName: "border-violet-400 text-violet-600 dark:text-violet-400",
    dotClassName: "bg-violet-500",
  },
  reminder: {
    label: "Reminder",
    badgeClassName: "border-amber-400 text-amber-600 dark:text-amber-400",
    dotClassName: "bg-amber-500",
  },
  general: {
    label: "General",
    badgeClassName: "border-border text-muted-foreground",
    dotClassName: "bg-muted-foreground",
  },
  forsale: {
    label: "For Sale",
    badgeClassName: "border-green-400 text-green-600 dark:text-green-400",
    dotClassName: "bg-green-500",
  },
};

export const CATEGORY_ORDER: Category[] = [
  "announcement",
  "event",
  "reminder",
  "general",
  "forsale",
];

export const PRIORITY_META: Record<
  Priority,
  { label: string; cardClassName: string }
> = {
  normal: { label: "Normal", cardClassName: "" },
  important: {
    label: "Important",
    cardClassName: "ring-amber-400/60 border-l-4 border-l-amber-400",
  },
  urgent: {
    label: "Urgent",
    cardClassName: "ring-red-400/60 border-l-4 border-l-red-500",
  },
};

export const PRIORITY_ORDER: Priority[] = ["normal", "important", "urgent"];
