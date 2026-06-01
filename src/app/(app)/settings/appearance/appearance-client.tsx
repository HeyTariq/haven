"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export function AppearanceClient() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={theme === "light" ? "default" : "outline"}
          onClick={() => setTheme("light")}
        >
          <Sun className="h-4 w-4 mr-2" />
          Light
        </Button>
        <Button
          variant={theme === "dark" ? "default" : "outline"}
          onClick={() => setTheme("dark")}
        >
          <Moon className="h-4 w-4 mr-2" />
          Dark
        </Button>
      </div>
    </div>
  );
}
