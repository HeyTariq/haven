"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function AppearanceClient() {
  const { resolvedTheme, setTheme } = useTheme();
  // Theme is unknown until mounted; render a stable state to avoid hydration mismatch.
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- mount gate for theme hydration
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor="dark-mode" className="flex items-center gap-2">
            {isDark ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            Dark mode
          </Label>
          <p className="text-sm text-muted-foreground">
            {isDark ? "Using the dark theme." : "Using the light theme."}
          </p>
        </div>
        <Switch
          id="dark-mode"
          checked={isDark}
          disabled={!mounted}
          onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        />
      </div>
    </div>
  );
}
