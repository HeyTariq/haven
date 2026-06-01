"use client";

import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { createPasswordlessMember } from "../actions";
import type { AuthMode } from "@/lib/settings";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  banned: boolean | null;
};

export function MembersClient({ authMode }: { authMode: AuthMode }) {
  const passwordless = authMode === "passwordless";
  const [members, setMembers] = useState<Member[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadMembers() {
    const res = await authClient.admin.listUsers({ query: { limit: 100 } });
    if (res.data) {
      setMembers(res.data.users as Member[]);
      setLoaded(true);
    }
  }

  if (!loaded) {
    loadMembers();
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;
    const email = form.get("email") as string;
    const role = (form.get("role") as string) || "member";

    if (passwordless) {
      // No credential account; profile signs in by picking itself.
      const res = await createPasswordlessMember(name, email, role);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Profile created.");
        setOpen(false);
        loadMembers();
      }
      setLoading(false);
      return;
    }

    const res = await authClient.admin.createUser({
      name,
      email,
      password: form.get("password") as string,
      // Better Auth's admin plugin only types "user" | "admin"; we store
      // additional role values (child, guest) directly in the text column via assertion
      role: role as "user" | "admin",
    });

    if (res.error) {
      toast.error(res.error.message ?? "Failed to create member.");
    } else {
      toast.success("Member created.");
      setOpen(false);
      loadMembers();
    }
    setLoading(false);
  }

  async function handleRemove(id: string) {
    const res = await authClient.admin.removeUser({ userId: id });
    if (res.error) {
      toast.error("Failed to remove member.");
    } else {
      toast.success("Member removed.");
      setMembers((prev) => prev.filter((m) => m.id !== id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="h-4 w-4 mr-1" />
            {passwordless ? "Add profile" : "Add member"}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {passwordless ? "Add Profile" : "Add Member"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              {!passwordless && (
                <div className="space-y-2">
                  <Label htmlFor="password">Temporary password</Label>
                  <Input id="password" name="password" type="password" required minLength={8} />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select name="role" id="role" className="w-full border rounded-md px-3 py-2 text-sm bg-background">
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="child">Child</option>
                  <option value="guest">Guest</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Creating..."
                  : passwordless
                    ? "Create profile"
                    : "Create member"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {members.map((m) => (
          <Card key={m.id}>
            <CardContent className="flex items-center justify-between py-3 px-4">
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-sm text-muted-foreground">{m.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {m.role ?? "member"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(m.id)}
                  className="text-destructive hover:text-destructive h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {loaded && members.length === 0 && (
          <p className="text-muted-foreground text-sm">No members yet.</p>
        )}
      </div>
    </div>
  );
}

