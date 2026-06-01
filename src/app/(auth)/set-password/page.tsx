import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getAuthMode } from "@/lib/settings";
import { getProfilesWithoutPassword } from "@/lib/auth/members";
import SetPasswordForm from "./set-password-form";

export const dynamic = "force-dynamic";

export default async function SetPasswordPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  if ((await getAuthMode()) !== "password") redirect("/login");

  const profiles = await getProfilesWithoutPassword();
  if (profiles.length === 0) redirect("/login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Set your password</h1>
          <p className="text-muted-foreground mt-2">
            Choose your profile and create a password to sign in.
          </p>
        </div>
        <SetPasswordForm
          profiles={profiles.map((p) => ({ id: p.id, name: p.name }))}
        />
      </div>
    </div>
  );
}
