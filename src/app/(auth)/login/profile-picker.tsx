"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { signInAsUser, forgetDevice } from "@/lib/auth/passwordless";
import type { Profile } from "@/lib/auth/members";

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfilePicker({
  profiles,
  remembered = null,
  autoSignIn = false,
}: {
  profiles: Profile[];
  remembered?: Profile | null;
  autoSignIn?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);
  // Drops out of "Continue as X" into the full grid once the user taps "Not you?".
  const [showAll, setShowAll] = useState(false);

  async function pick(id: string, rememberDevice: boolean) {
    setError(null);
    setPendingId(id);
    const result = await signInAsUser(id, rememberDevice);
    if (result.error) {
      setError(result.error);
      setPendingId(null);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  // Solo households skip the picker entirely: sign in the only profile on load.
  const autoPicked = useRef(false);
  useEffect(() => {
    if (autoSignIn && profiles.length === 1 && !autoPicked.current) {
      autoPicked.current = true;
      pick(profiles[0].id, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSignIn, profiles]);

  if (autoSignIn) {
    return <p className="text-center text-sm text-muted-foreground">Signing in...</p>;
  }

  // One-tap return for a device that already knows its member.
  if (remembered && !showAll) {
    const pending = pendingId === remembered.id;
    return (
      <div className="space-y-4">
        <button
          type="button"
          disabled={pendingId !== null}
          onClick={() => pick(remembered.id, true)}
          className="w-full text-left disabled:opacity-50"
        >
          <Card className="transition-colors hover:bg-accent">
            <CardContent className="flex flex-col items-center gap-3 py-8">
              <Avatar className="h-16 w-16">
                {remembered.image && (
                  <AvatarImage src={remembered.image} alt={remembered.name} />
                )}
                <AvatarFallback className="text-xl">
                  {initials(remembered.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-base font-medium">
                {pending ? "Signing in..." : `Continue as ${remembered.name}`}
              </span>
            </CardContent>
          </Card>
        </button>
        <button
          type="button"
          disabled={pendingId !== null}
          onClick={async () => {
            await forgetDevice();
            setShowAll(true);
          }}
          className="w-full text-center text-sm text-muted-foreground underline disabled:opacity-50"
        >
          Not you? Choose a different profile
        </button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-center gap-3">
        {profiles.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={pendingId !== null}
            onClick={() => pick(p.id, remember)}
            className="w-28 disabled:opacity-50"
          >
            <Card className="transition-colors hover:bg-accent">
              <CardContent className="flex flex-col items-center gap-2 py-5">
                <Avatar className="h-14 w-14">
                  {p.image && <AvatarImage src={p.image} alt={p.name} />}
                  <AvatarFallback className="text-lg">
                    {initials(p.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {pendingId === p.id ? "Signing in..." : p.name}
                </span>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
      <label className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Checkbox
          checked={remember}
          onCheckedChange={(checked) => setRemember(checked === true)}
          disabled={pendingId !== null}
        />
        Remember me on this device
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
