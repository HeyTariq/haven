import { eq, and, or, desc, isNull, gt, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { bulletinPost, bulletinAck } from "./schema";
import { user } from "@/lib/db/schema/auth";
import { visibleFilter } from "@/lib/auth/visibility";
import type { User } from "@/lib/auth";
import type { Category, Priority } from "./categories";

export type PostRow = {
  id: string;
  title: string | null;
  body: string;
  category: Category;
  priority: Priority;
  pinned: boolean;
  expiresAt: Date | null;
  authorId: string;
  authorName: string | null;
  authorImage: string | null;
  createdAt: Date;
  updatedAt: Date;
  ackCount: number;
  ackedByMe: boolean;
  ackerNames: string[];
};

// expiresAt unset or still in the future
function activeFilter() {
  return or(isNull(bulletinPost.expiresAt), gt(bulletinPost.expiresAt, new Date()));
}

async function loadPosts(currentUser: User, limit?: number): Promise<PostRow[]> {
  const base = db
    .select({
      id: bulletinPost.id,
      title: bulletinPost.title,
      body: bulletinPost.body,
      category: bulletinPost.category,
      priority: bulletinPost.priority,
      pinned: bulletinPost.pinned,
      expiresAt: bulletinPost.expiresAt,
      authorId: bulletinPost.ownerId,
      authorName: user.name,
      authorImage: user.image,
      createdAt: bulletinPost.createdAt,
      updatedAt: bulletinPost.updatedAt,
    })
    .from(bulletinPost)
    .leftJoin(user, eq(bulletinPost.ownerId, user.id))
    .where(
      and(
        visibleFilter(
          bulletinPost.ownerId,
          bulletinPost.visibility,
          currentUser.id
        ),
        activeFilter()
      )
    )
    .orderBy(desc(bulletinPost.pinned), desc(bulletinPost.createdAt));

  const posts = limit ? await base.limit(limit) : await base;
  if (posts.length === 0) return [];

  const postIds = posts.map((p) => p.id);
  const acks = await db
    .select({
      postId: bulletinAck.postId,
      userId: bulletinAck.userId,
      name: user.name,
    })
    .from(bulletinAck)
    .leftJoin(user, eq(bulletinAck.userId, user.id))
    .where(inArray(bulletinAck.postId, postIds));

  const ackMap = new Map<string, { names: string[]; mine: boolean }>();
  for (const a of acks) {
    const entry = ackMap.get(a.postId) ?? { names: [], mine: false };
    if (a.name) entry.names.push(a.name);
    if (a.userId === currentUser.id) entry.mine = true;
    ackMap.set(a.postId, entry);
  }

  return posts.map((p) => {
    const acked = ackMap.get(p.id);
    return {
      ...p,
      ackCount: acked?.names.length ?? 0,
      ackedByMe: acked?.mine ?? false,
      ackerNames: acked?.names ?? [],
    };
  });
}

export async function getPosts(currentUser: User): Promise<PostRow[]> {
  return loadPosts(currentUser);
}

export async function getRecentForDashboard(
  currentUser: User,
  limit = 5
): Promise<PostRow[]> {
  return loadPosts(currentUser, limit);
}
