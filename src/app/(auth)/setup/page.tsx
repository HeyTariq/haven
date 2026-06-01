import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import SetupForm from "./setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const existing = await db.select({ id: user.id }).from(user).limit(1);
  if (existing.length > 0) redirect("/login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Welcome to Haven</h1>
          <p className="text-muted-foreground mt-2">
            Create your admin account to get started.
          </p>
        </div>
        <SetupForm />
      </div>
    </div>
  );
}
