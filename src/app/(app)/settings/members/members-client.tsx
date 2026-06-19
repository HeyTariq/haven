"use client";

import { useState, useEffect } from "react";
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
import { Plus, Trash2, Ban } from "lucide-react";
import {
  listMembers,
  createMember,
  clearMemberPin,
  type MemberRow,
} from "../actions";

export function MembersClient() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("member");

  async function loadMembers() {
    const rows = await listMembers();
    setMembers(rows);
    setLoaded(true);
  }

  useEffect(() => {
    loadMembers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const res = await createMember(
      form.get("name") as string,
      form.get("email") as string,
      role,
      (form.get("pin") as string) || undefined,
    );
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Profile created.");
      setOpen(false);
      setRole("member");
      loadMembers();
    }
    setLoading(false);
  }

  async function handleClearPin(m: MemberRow) {
    const res = await clearMemberPin(m.id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`PIN reset for ${m.name}. They can set a new one.`);
      loadMembers();
    }
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
            Add profile
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Profile</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (optional)</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  name="role"
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="child">Child</option>
                  <option value="guest">Guest</option>
                </select>
              </div>
              {role === "admin" && (
                <div className="space-y-2">
                  <Label htmlFor="pin">Starting PIN</Label>
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
                    Admins must have a PIN. They can change it themselves once
                    signed in — you won&apos;t be able to.
                  </p>
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating..." : "Create profile"}
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
                {m.hasPin && <Badge variant="secondary">PIN</Badge>}
                {m.hasPin && m.role !== "admin" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleClearPin(m)}
                    className="h-8 w-8"
                    title="Reset PIN"
                  >
                    <Ban className="h-4 w-4" />
                  </Button>
                )}
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
