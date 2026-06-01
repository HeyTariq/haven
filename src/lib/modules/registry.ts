import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import type { User } from "@/lib/auth";

export interface WidgetManifest {
  title: string;
  // async Server Component; rendered server-side and slotted into the dashboard grid
  component: ComponentType<{ user: User }>;
  defaultLayout: { w: number; h: number; minW?: number; minH?: number };
}

export interface ModuleManifest {
  id: string;
  label: string;
  icon: LucideIcon;
  route: string;
  nav: boolean;
  requiredRole?: "admin" | "member" | "child" | "guest";
  widget?: WidgetManifest;
}

const registry: ModuleManifest[] = [];

export function registerModule(manifest: ModuleManifest) {
  if (!registry.find((m) => m.id === manifest.id)) {
    registry.push(manifest);
  }
}

export function getModules(): ModuleManifest[] {
  return registry;
}

export function getNavModules(): ModuleManifest[] {
  return registry.filter((m) => m.nav);
}

export function getWidgetModules(): ModuleManifest[] {
  return registry.filter((m) => m.widget);
}
