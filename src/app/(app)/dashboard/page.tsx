import { requireUser } from "@/lib/auth/session";
import { PageContainer } from "@/components/page-container";
import { getWidgetModules } from "@/lib/modules/registry";
import { getDashboardLayout } from "@/lib/dashboard/queries";
import {
  DashboardGrid,
  type DashboardWidget,
} from "@/components/dashboard/dashboard-grid";
import { DateTimeDisplay } from "@/components/dashboard/date-time-display";

export default async function DashboardPage() {
  const user = await requireUser();
  const initialLayout = await getDashboardLayout(user.id);

  // Render each widget Server Component here, then slot the nodes into the
  // client grid (server-component-as-children pattern).
  const widgets: DashboardWidget[] = getWidgetModules().map((m) => {
    const Widget = m.widget!.component;
    return {
      id: m.id,
      title: m.widget!.title,
      defaultLayout: m.widget!.defaultLayout,
      node: <Widget user={user} />,
    };
  });

  return (
    <PageContainer wide>
      <h1 className="text-2xl font-semibold mb-1">Welcome back, {user.name}</h1>
      <DateTimeDisplay />
      <DashboardGrid initialLayout={initialLayout} widgets={widgets} />
    </PageContainer>
  );
}
