"use server";

import { db } from "@/db";
import {
  users,
  departments,
  bases,
  categories,
  itemTypes,
  itemUnits,
  requests,
  movements,
  signatures,
  auditLogs,
  operationalPeriods,
  inventorySnapshots,
} from "@/db/schema";
import { auth, isSuperAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import type { SessionUser } from "@/types";

export async function resetSystem(confirmCode: string, secondConfirmCode: string) {
  const session = await auth();

  if (!session?.user) {
    return { error: "לא מחובר" };
  }

  if (!isSuperAdmin(session.user.role as SessionUser["role"])) {
    return { error: "אין הרשאה" };
  }

  // Double verification
  if (confirmCode !== "אני מאשר מחיקה" || secondConfirmCode !== "0542284283") {
    return { error: "קוד אימות שגוי" };
  }

  try {
    // Delete all data in correct order (foreign key constraints)
    await db.delete(inventorySnapshots);
    await db.delete(signatures);
    await db.delete(movements);
    await db.delete(requests);
    await db.delete(itemUnits);
    await db.delete(itemTypes);
    await db.delete(categories);
    await db.delete(auditLogs);
    await db.delete(operationalPeriods);
    await db.delete(users);
    await db.delete(departments);
    await db.delete(bases);

    // Create base
    const [base] = await db
      .insert(bases)
      .values({
        name: "בסיס מרכזי",
        status: "active",
        commanderName: "ניסם חדד",
        commanderPhone: "0527320191",
      })
      .returning();

    // Create HQ department
    const [hqDept] = await db
      .insert(departments)
      .values({
        baseId: base.id,
        name: "מפקדה",
        description: "מפקדת הבסיס",
        allowImmediate: true,
        allowScheduled: true,
      })
      .returning();

    // Hash default passwords (phone number)
    const yogevPassword = await bcrypt.hash("0542284283", 10);
    const nisamPassword = await bcrypt.hash("0527320191", 10);

    // Create Super Admin - יוגב אביטן
    await db.insert(users).values({
      phone: "0542284283",
      password: yogevPassword,
      firstName: "יוגב",
      lastName: "אביטן",
      email: "itadmit@gmail.com",
      role: "super_admin",
      baseId: base.id,
      departmentId: null,
      mustChangePassword: false,
      isActive: true,
    });

    // Create HQ Commander - ניסם חדד
    await db.insert(users).values({
      phone: "0527320191",
      password: nisamPassword,
      firstName: "ניסם",
      lastName: "חדד",
      email: null,
      role: "hq_commander",
      baseId: base.id,
      departmentId: hqDept.id,
      mustChangePassword: true,
      isActive: true,
    });

    // Log the reset action
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "system_reset",
      entityType: "system",
      newValues: { message: "System was reset by super admin" },
    });

    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("System reset error:", error);
    return { error: "שגיאה באיפוס המערכת" };
  }
}

