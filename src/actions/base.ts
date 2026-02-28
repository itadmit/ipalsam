"use server";

import { db } from "@/db";
import { operationalPeriods, auditLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth, isSuperAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { SessionUser } from "@/types";

export async function createOperationalPeriod(baseId: string, name: string) {
  const session = await auth();

  if (!session?.user) {
    return { error: "לא מחובר" };
  }

  if (!isSuperAdmin(session.user.role as SessionUser["role"])) {
    return { error: "אין הרשאה" };
  }

  if (!name?.trim()) {
    return { error: "שם התקופה חובה" };
  }

  const existingActive = await db.query.operationalPeriods.findFirst({
    where: and(
      eq(operationalPeriods.baseId, baseId),
      eq(operationalPeriods.isActive, true)
    ),
  });

  if (existingActive) {
    return { error: "קיימת כבר תקופה פעילה. יש לסיים אותה לפני פתיחת תקופה חדשה." };
  }

  const [period] = await db
    .insert(operationalPeriods)
    .values({
      baseId,
      name: name.trim(),
      startDate: new Date(),
      isActive: true,
    })
    .returning();

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "create_operational_period",
    entityType: "operational_period",
    entityId: period.id,
    newValues: { name: period.name, baseId },
  });

  revalidatePath("/super-admin/base");

  return { success: true, period };
}
