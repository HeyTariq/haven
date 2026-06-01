"use server";

import { hashPassword } from "@better-auth/utils/password";
import { db } from "@/lib/db";
import { user, account } from "@/lib/db/schema";

export async function createAdminAction(form: FormData) {
  const name = form.get("name") as string;
  const email = form.get("email") as string;
  const password = form.get("password") as string;

  if (!name || !email || !password) {
    return { error: "All fields are required." };
  }

  const existing = await db.select({ id: user.id }).from(user).limit(1);
  if (existing.length > 0) {
    return { error: "Setup already completed." };
  }

  try {
    const id = crypto.randomUUID();
    const hash = await hashPassword(password);
    const now = new Date();

    await db.insert(user).values({ id, name, email, emailVerified: false, role: "admin" });

    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: id,
      providerId: "credential",
      userId: id,
      password: hash,
      createdAt: now,
      updatedAt: now,
    });

    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}
