import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { getAuthMode, getHouseholdType } from "@/lib/settings";
import { getProfiles, getProfilesWithoutPassword } from "@/lib/auth/members";
import { getRememberedProfileId } from "@/lib/auth/device-profile";
import LoginForm from "./login-form";
import ProfilePicker from "./profile-picker";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  const existing = await db.select({ id: user.id }).from(user).limit(1);
  if (existing.length === 0) redirect("/setup");

  const authMode = await getAuthMode();

  if (authMode === "passwordless") {
    const profiles = await getProfiles();
    const householdType = await getHouseholdType();
    const rememberedId = await getRememberedProfileId();
    // A stale id matching no profile falls through to the cold picker.
    const remembered =
      profiles.find((p) => p.id === rememberedId) ?? null;
    // Silent sign-in only for a genuine solo home, never just because one
    // profile exists. Other households get the picker or a one-tap "Continue".
    const autoSignIn = householdType === "solo" && profiles.length === 1;
    return (
      <Shell subtitle="Choose your profile">
        <ProfilePicker
          profiles={profiles}
          remembered={remembered}
          autoSignIn={autoSignIn}
        />
      </Shell>
    );
  }

  // Password mode: members created passwordless have no credential yet.
  const needsPassword = await getProfilesWithoutPassword();
  return (
    <Shell subtitle="Sign in to your home">
      <LoginForm />
      {needsPassword.length > 0 && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          First time?{" "}
          <Link href="/set-password" className="underline">
            Set your password
          </Link>
        </p>
      )}
    </Shell>
  );
}

function Shell({
  subtitle,
  children,
}: {
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Haven</h1>
          <p className="text-muted-foreground mt-2">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
