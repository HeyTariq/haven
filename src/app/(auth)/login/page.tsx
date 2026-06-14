import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { getSession } from "@/lib/auth/session";
import { getProfiles, type PublicProfile } from "@/lib/auth/members";
import { getRememberedProfileId } from "@/lib/auth/device-profile";
import ProfilePicker from "./profile-picker";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  const existing = await db.select({ id: user.id }).from(user).limit(1);
  if (existing.length === 0) redirect("/setup");

  const allProfiles = await getProfiles();
  const rememberedId = await getRememberedProfileId();

  // Strip role before anything crosses to the client component; hasPin stays.
  const profiles: PublicProfile[] = allProfiles.map(
    ({ id, name, image, hasPin }) => ({ id, name, image, hasPin }),
  );
  // A stale id matching no profile falls through to the cold picker.
  const remembered = profiles.find((p) => p.id === rememberedId) ?? null;
  // Drop straight into the app only when the remembered profile has no PIN.
  // A PIN-protected profile (always the case for admins) gets the prompt instead.
  const autoSignIn = remembered != null && !remembered.hasPin;

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
