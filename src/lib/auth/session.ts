import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, type User } from "./index";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireUser(): Promise<User> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.user as User;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}
