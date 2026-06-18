import { requireUser } from "@/lib/auth/session";
import { getNavModules } from "@/lib/modules/registry";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

// import all modules so they self-register
import "@/modules/init";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const navModules = getNavModules().map((m) => ({
    id: m.id,
    label: m.label,
    route: m.route,
    icon: <m.icon className="h-5 w-5" />,
  }));

  return (
    <SidebarProvider>
      <AppSidebar user={user} navModules={navModules} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
