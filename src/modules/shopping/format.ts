import type { InferSelectModel } from "drizzle-orm";
import type { shoppingItem } from "./schema";

type Item = InferSelectModel<typeof shoppingItem>;

/**
 * Render a shopping list as plain text suitable for the share sheet / clipboard,
 * so a member can carry it off the LAN in Notes, Messages, etc. Unchecked items
 * come first (what you still need to buy), then checked ones.
 */
export function formatListAsText(name: string, items: Item[]): string {
  const line = (i: Item) =>
    `- [${i.checked ? "x" : " "}] ${i.name}${i.quantity ? ` (${i.quantity})` : ""}`;

  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);
  const body = [...unchecked, ...checked].map(line).join("\n");

  return body ? `${name}\n\n${body}` : `${name}\n\n(empty)`;
}
