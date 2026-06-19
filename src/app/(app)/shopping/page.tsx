import { requireUser } from "@/lib/auth/session";
import { getLists } from "@/modules/shopping/queries";
import { ListsView } from "@/modules/shopping/components/lists-view";
import { PageContainer } from "@/components/page-container";

export default async function ShoppingPage() {
  const user = await requireUser();
  const lists = await getLists(user);

  return (
    <PageContainer>
      <ListsView lists={lists} />
    </PageContainer>
  );
}
