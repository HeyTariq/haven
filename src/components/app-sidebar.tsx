"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Settings, LogOut } from "lucide-react";
import type { User } from "@/lib/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "@/lib/auth/client";
import { forgetDevice } from "@/lib/auth/passwordless";

interface NavModule {
  id: string;
  label: string;
  route: string;
  icon: React.ReactNode;
}

interface AppSidebarProps {
  user: User;
  navModules: NavModule[];
}

export function AppSidebar({ user, navModules }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    // Clear the device's remembered profile so sign-out returns to the picker.
    await forgetDevice();
    router.push("/login");
    router.refresh();
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3">
        <span className="font-semibold text-lg">Haven</span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard" />}
              isActive={pathname === "/dashboard"}
            >
              <Home className="h-5 w-5" />
              Dashboard
            </SidebarMenuButton>
          </SidebarMenuItem>

          {navModules.map((mod) => (
            <SidebarMenuItem key={mod.id}>
              <SidebarMenuButton
                size="lg"
                render={<Link href={mod.route} />}
                isActive={pathname.startsWith(mod.route)}
              >
                {mod.icon}
                {mod.label}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <SidebarSeparator />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/settings" />}
              isActive={pathname.startsWith("/settings")}
            >
              <Settings className="h-5 w-5" />
              Settings
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-3 w-full rounded-md p-2 hover:bg-sidebar-accent text-left" />
            }
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {user.role ?? "member"}
              </p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-48">
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
