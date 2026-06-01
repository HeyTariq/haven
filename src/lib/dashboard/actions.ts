"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { dashboardPreference } from "@/lib/db/schema/dashboard";
import type { DashboardLayoutData } from "./types";

const placementSchema = z.object({
  i: z.string(),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1),
  h: z.number().int().min(1),
  minW: z.number().int().min(1).optional(),
  minH: z.number().int().min(1).optional(),
});

const layoutSchema = z.object({
  layouts: z.record(z.string(), z.array(placementSchema)),
  hidden: z.array(z.string()),
});

export async function saveDashboardLayout(data: DashboardLayoutData) {
  const user = await requireUser();
  const layout = layoutSchema.parse(data);

  await db
    .insert(dashboardPreference)
    .values({ userId: user.id, layout })
    .onConflictDoUpdate({
      target: dashboardPreference.userId,
      set: { layout },
    });

  revalidatePath("/dashboard");
}
