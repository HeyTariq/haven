import type { User } from "./index";

export type Role = "admin" | "member" | "child" | "guest";

export function isAdmin(user: User): boolean {
  return user.role === "admin";
}

export function hasRole(user: User, role: Role): boolean {
  if (user.role === "admin") return true;
  return user.role === role;
}
