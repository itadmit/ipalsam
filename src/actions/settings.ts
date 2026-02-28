"use server";

import { db } from "@/db";
import { bases, systemSettings, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth, isSuperAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { SessionUser } from "@/types";

async function getSetting(key: string): Promise<string> {
  const row = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, key),
  });
  return row?.value ?? "";
}

async function setSetting(key: string, value: string) {
  const existing = await db.query.systemSettings.findFirst({
    where: eq(systemSettings.key, key),
  });
  if (existing) {
    await db
      .update(systemSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(systemSettings.key, key));
  } else {
    await db.insert(systemSettings).values({ key, value });
  }
}

export async function getGeneralSettings() {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role as SessionUser["role"])) {
    return { error: "אין הרשאה" };
  }

  const base = await db.query.bases.findFirst();
  const systemEmail = await getSetting("system_email");

  return {
    baseName: base?.name ?? "בסיס מרכזי",
    systemEmail: systemEmail || "system@ipalsam.co.il",
  };
}

export async function saveGeneralSettings(baseName: string, systemEmail: string) {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role as SessionUser["role"])) {
    return { error: "אין הרשאה" };
  }

  const base = await db.query.bases.findFirst();
  if (!base) return { error: "בסיס לא נמצא" };

  await db
    .update(bases)
    .set({ name: baseName.trim(), updatedAt: new Date() })
    .where(eq(bases.id, base.id));

  await setSetting("system_email", systemEmail.trim());

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "update_general_settings",
    entityType: "settings",
    newValues: { baseName, systemEmail },
  });

  revalidatePath("/super-admin/settings");
  return { success: true };
}

export async function getNotificationSettings() {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role as SessionUser["role"])) {
    return { error: "אין הרשאה" };
  }

  return {
    overdueNotifications: (await getSetting("overdue_notifications")) !== "false",
    lowStockNotifications: (await getSetting("low_stock_notifications")) !== "false",
    newRequestNotifications: (await getSetting("new_request_notifications")) !== "false",
  };
}

export async function saveNotificationSettings(
  overdueNotifications: boolean,
  lowStockNotifications: boolean,
  newRequestNotifications: boolean
) {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role as SessionUser["role"])) {
    return { error: "אין הרשאה" };
  }

  await setSetting("overdue_notifications", String(overdueNotifications));
  await setSetting("low_stock_notifications", String(lowStockNotifications));
  await setSetting("new_request_notifications", String(newRequestNotifications));

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "update_notification_settings",
    entityType: "settings",
    newValues: { overdueNotifications, lowStockNotifications, newRequestNotifications },
  });

  revalidatePath("/super-admin/settings");
  return { success: true };
}

export async function getSecuritySettings() {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role as SessionUser["role"])) {
    return { error: "אין הרשאה" };
  }

  return {
    sessionTimeout: (await getSetting("session_timeout_hours")) || "24",
    forcePasswordChange: (await getSetting("force_password_change")) !== "false",
  };
}

export async function saveSecuritySettings(sessionTimeout: string, forcePasswordChange: boolean) {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role as SessionUser["role"])) {
    return { error: "אין הרשאה" };
  }

  await setSetting("session_timeout_hours", sessionTimeout);
  await setSetting("force_password_change", String(forcePasswordChange));

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "update_security_settings",
    entityType: "settings",
    newValues: { sessionTimeout, forcePasswordChange },
  });

  revalidatePath("/super-admin/settings");
  return { success: true };
}

export async function getLoanSettings() {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role as SessionUser["role"])) {
    return { error: "אין הרשאה" };
  }

  return {
    defaultLoanDays: (await getSetting("default_loan_days")) || "7",
    overdueDays: (await getSetting("overdue_days")) || "1",
  };
}

export async function saveLoanSettings(defaultLoanDays: string, overdueDays: string) {
  const session = await auth();
  if (!session?.user || !isSuperAdmin(session.user.role as SessionUser["role"])) {
    return { error: "אין הרשאה" };
  }

  await setSetting("default_loan_days", defaultLoanDays);
  await setSetting("overdue_days", overdueDays);

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "update_loan_settings",
    entityType: "settings",
    newValues: { defaultLoanDays, overdueDays },
  });

  revalidatePath("/super-admin/settings");
  return { success: true };
}
