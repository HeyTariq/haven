import { requireUser } from "@/lib/auth/session";
import { getLists } from "@/modules/shopping/queries";
import { ListsView } from "@/modules/shopping/components/lists-view";
import { PageContainer } from "@/components/page-container";

export default async function ShoppingPage() {
  const user = await requireUser();
  const lists = await getLists(user);

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Shopping</h1>
        <p className="text-muted-foreground text-sm">Shared and personal lists</p>
      </div>
      <ListsView lists={lists} />
    </PageContainer>
  );
}
