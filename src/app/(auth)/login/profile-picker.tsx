"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAsUser, forgetDevice } from "@/lib/auth/passwordless";
import type { PublicProfile } from "@/lib/auth/members";

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function PinPrompt({
  profile,
  remember,
  onBack,
}: {
  profile: PublicProfile;
  remember: boolean;
  onBack: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const result = await signInAsUser(
      profile.id,
      form.get("pin") as string,
      remember,
    );

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          {profile.image && <AvatarImage src={profile.image} alt={profile.name} />}
          <AvatarFallback>{initials(profile.name)}</AvatarFallback>
        </Avatar>
        <span className="font-medium">{profile.name}</span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pin">PIN</Label>
          <Input
            id="pin"
            name="pin"
            type="password"
            inputMode="numeric"
            pattern="\d*"
            minLength={4}
            maxLength={8}
            required
            autoFocus
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <button
        type="button"
        onClick={onBack}
        className="w-full text-center text-sm text-muted-foreground underline"
      >
        Back to profiles
      </button>
    </div>
  );
}

export default function ProfilePicker({
  profiles,
  remembered = null,
  autoSignIn = false,
}: {
  profiles: PublicProfile[];
  remembered?: PublicProfile | null;
  autoSignIn?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [remember, setRemember] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [pinTarget, setPinTarget] = useState<PublicProfile | null>(null);
  const [pinRemember, setPinRemember] = useState(true);

  // PIN-protected profiles get a prompt; everyone else signs in on the tap.
  async function pick(profile: PublicProfile, rememberDevice: boolean) {
    if (profile.hasPin) {
      setError(null);
      setPinRemember(rememberDevice);
      setPinTarget(profile);
      return;
    }
    setError(null);
    setPendingId(profile.id);
    const result = await signInAsUser(profile.id, undefined, rememberDevice);
    if (result.error) {
      setError(result.error);
      setPendingId(null);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  const autoPicked = useRef(false);
  useEffect(() => {
    if (autoSignIn && remembered && !autoPicked.current) {
      autoPicked.current = true;
      pick(remembered, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSignIn, remembered]);

  if (autoSignIn && !pinTarget && !error) {
    return <p className="text-center text-sm text-muted-foreground">Signing in...</p>;
  }

  if (pinTarget) {
    return (
      <PinPrompt
        profile={pinTarget}
        remember={pinRemember}
        onBack={() => setPinTarget(null)}
      />
    );
  }

  if (remembered && !showAll) {
    const pending = pendingId === remembered.id;
    return (
      <div className="space-y-4">
        <button
          type="button"
          disabled={pendingId !== null}
          onClick={() => pick(remembered, true)}
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
            onClick={() => pick(p, remember)}
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
