import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getListWithItems } from "@/modules/shopping/queries";
import { ListDetailView } from "@/modules/shopping/components/list-detail-view";

interface Props {
  params: Promise<{ listId: string }>;
}

export default async function ShoppingListPage({ params }: Props) {
  const user = await requireUser();
  const { listId } = await params;
  const list = await getListWithItems(listId, user);

  if (!list) notFound();

  const isOwner = list.ownerId === user.id;

  return <ListDetailView list={list} isOwner={isOwner} />;
}
