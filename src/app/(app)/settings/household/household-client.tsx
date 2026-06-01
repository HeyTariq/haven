"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { setAuthModeAction } from "../actions";
import type { AuthMode } from "@/lib/settings";

export function HouseholdClient({ authMode }: { authMode: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(authMode);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function apply(next: AuthMode) {
    const previous = mode;
    setMode(next);
    startTransition(async () => {
      try {
        await setAuthModeAction(next);
        toast.success("Authentication updated.");
      } catch {
        setMode(previous);
        toast.error("Could not update authentication.");
      }
    });
  }

  function onToggle(requirePassword: boolean) {
    const next: AuthMode = requirePassword ? "password" : "passwordless";
    if (next === mode) return;
    // Turning passwords off downgrades privacy; confirm before applying.
    if (next === "passwordless") {
      setConfirmOpen(true);
      return;
    }
    apply(next);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor="require-password">Require password</Label>
          <p className="text-sm text-muted-foreground">
            {mode === "password"
              ? "Each member signs in with a password. Profiles without one are prompted to set it on next sign-in."
              : "Anyone on your network or at the device can pick any profile. Private items are hidden between profiles but not protected. Use only on a trusted home network."}
          </p>
        </div>
        <Switch
          id="require-password"
          checked={mode === "password"}
          disabled={pending}
          onCheckedChange={onToggle}
        />
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Turn off passwords?</DialogTitle>
            <DialogDescription>
              This removes password protection. Anyone using this device can
              open any profile, including private items like finances. Private
              data will no longer be protected from other members.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmOpen(false);
                apply("passwordless");
              }}
              disabled={pending}
            >
              Turn off passwords
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
