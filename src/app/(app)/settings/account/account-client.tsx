"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setOwnPin, clearOwnPin } from "../actions";

// Self-service PIN management. Every action here targets the signed-in user only;
// no one — not even an admin — can change someone else's PIN.
export function AccountClient({
  hasPin,
  isAdmin,
}: {
  hasPin: boolean;
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const res = await setOwnPin(form.get("pin") as string);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("PIN updated.");
      setEditing(false);
    }
    setSaving(false);
  }

  async function handleClear() {
    setClearing(true);
    const res = await clearOwnPin();
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("PIN removed.");
    }
    setClearing(false);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label>Your PIN</Label>
        <p className="text-sm text-muted-foreground">
          {hasPin
            ? "Your profile is protected by a PIN at sign-in."
            : "Your profile has no PIN — anyone can pick it to sign in. Add one to protect it."}
          {isAdmin && " As an admin, you must keep a PIN."}
        </p>
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="space-y-3 max-w-xs">
          <Input
            name="pin"
            type="password"
            inputMode="numeric"
            pattern="\d*"
            required
            minLength={4}
            maxLength={8}
            placeholder="4–8 digits"
            autoFocus
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving..." : "Save PIN"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setEditing(true)}>
            {hasPin ? "Change PIN" : "Set PIN"}
          </Button>
          {hasPin && !isAdmin && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClear}
              disabled={clearing}
            >
              {clearing ? "Removing..." : "Remove PIN"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
