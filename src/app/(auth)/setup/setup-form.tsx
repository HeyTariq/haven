"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAdminAction } from "./actions";

type Preset = "solo" | "family" | "roommates";

const PRESETS: { id: Preset; title: string; description: string }[] = [
  {
    id: "solo",
    title: "Solo",
    description: "Just you. No login, opens straight to your home.",
  },
  {
    id: "family",
    title: "Family",
    description: "Shared device, pick-a-profile. No passwords.",
  },
  {
    id: "roommates",
    title: "Roommates",
    description: "Separate accounts, pick-a-profile with optional PINs.",
  },
];

export default function SetupForm() {
  const router = useRouter();
  const [preset, setPreset] = useState<Preset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!preset) return;
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    form.set("preset", preset);
    const result = await createAdminAction(form);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  if (!preset) {
    return (
      <div className="space-y-3">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPreset(p.id)}
            className="w-full text-left"
          >
            <Card className="transition-colors hover:bg-accent">
              <CardContent className="py-4">
                <p className="font-medium">{p.title}</p>
                <p className="text-sm text-muted-foreground">
                  {p.description}
                </p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Admin Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="admin@home.local"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="\d*"
              required
              minLength={4}
              maxLength={8}
              placeholder="4–8 digits"
            />
            <p className="text-xs text-muted-foreground">
              Admins must set a PIN. It is the only thing protecting your profile.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPin">Confirm PIN</Label>
            <Input
              id="confirmPin"
              name="confirmPin"
              type="password"
              inputMode="numeric"
              pattern="\d*"
              required
              minLength={4}
              maxLength={8}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreset(null)}
              disabled={loading}
            >
              Back
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
