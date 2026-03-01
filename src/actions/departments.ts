"use server";

import { db } from "@/db";
import { departments, auditLogs, handoverDepartments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { CreateDepartmentFormData } from "@/types";

export async function createDepartment(data: CreateDepartmentFormData) {
  const session = await auth();

  if (
    !session?.user ||
    (session.user.role !== "super_admin" && session.user.role !== "hq_commander")
  ) {
    return { error: "אין הרשאה" };
  }

  const [newDepartment] = await db
    .insert(departments)
    .values({
      name: data.name,
      description: data.description || null,
      baseId: data.baseId,
      operatingHoursStart: data.operatingHoursStart || null,
      operatingHoursEnd: data.operatingHoursEnd || null,
      allowImmediate: data.allowImmediate,
      allowScheduled: data.allowScheduled,
    })
    .returning();

  // Log action
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "create_department",
    entityType: "department",
    entityId: newDepartment.id,
    newValues: data,
  });

  revalidatePath("/dashboard/departments");
  revalidatePath("/super-admin/departments");

  return { success: true, department: newDepartment };
}

export async function updateDepartment(
  departmentId: string,
  data: Partial<CreateDepartmentFormData>
) {
  const session = await auth();

  if (!session?.user) return { error: "אין הרשאה" };

  const canManage =
    session.user.role === "super_admin" ||
    session.user.role === "hq_commander" ||
    (session.user.role === "dept_commander" && session.user.departmentId === departmentId);
  if (!canManage) return { error: "אין הרשאה" };

  const existingDepartment = await db.query.departments.findFirst({
    where: eq(departments.id, departmentId),
  });

  if (!existingDepartment) {
    return { error: "מחלקה לא נמצאה" };
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.name) updateData.name = data.name;
  if (data.description !== undefined)
    updateData.description = data.description || null;
  if (data.operatingHoursStart !== undefined)
    updateData.operatingHoursStart = data.operatingHoursStart || null;
  if (data.operatingHoursEnd !== undefined)
    updateData.operatingHoursEnd = data.operatingHoursEnd || null;
  if (data.allowImmediate !== undefined)
    updateData.allowImmediate = data.allowImmediate;
  if (data.allowScheduled !== undefined)
    updateData.allowScheduled = data.allowScheduled;
  if (data.autoApproveRequests !== undefined)
    updateData.autoApproveRequests = data.autoApproveRequests;
  if (data.visibleInHqDashboard !== undefined && session.user.role === "super_admin")
    updateData.visibleInHqDashboard = data.visibleInHqDashboard;

  await db
    .update(departments)
    .set(updateData)
    .where(eq(departments.id, departmentId));

  // Log action
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "update_department",
    entityType: "department",
    entityId: departmentId,
    oldValues: {
      name: existingDepartment.name,
      description: existingDepartment.description,
    },
    newValues: data,
  });

  revalidatePath("/dashboard/departments");
  revalidatePath("/super-admin/departments");

  return { success: true };
}

export async function toggleDepartmentStatus(departmentId: string) {
  const session = await auth();

  if (!session?.user || session.user.role !== "super_admin") {
    return { error: "אין הרשאה" };
  }

  const department = await db.query.departments.findFirst({
    where: eq(departments.id, departmentId),
  });

  if (!department) {
    return { error: "מחלקה לא נמצאה" };
  }

  await db
    .update(departments)
    .set({
      isActive: !department.isActive,
      updatedAt: new Date(),
    })
    .where(eq(departments.id, departmentId));

  // Log action
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: department.isActive
      ? "deactivate_department"
      : "activate_department",
    entityType: "department",
    entityId: departmentId,
  });

  revalidatePath("/dashboard/departments");
  revalidatePath("/super-admin/departments");

  return { success: true, isActive: !department.isActive };
}

export async function updateHandoverSettings(
  departmentId: string,
  data: { autoApproveRequests?: boolean; storeDepartmentIds?: string[] }
) {
  const session = await auth();

  if (!session?.user) return { error: "אין הרשאה" };

  const canManage =
    session.user.role === "super_admin" ||
    session.user.role === "hq_commander" ||
    (session.user.role === "dept_commander" && session.user.departmentId === departmentId);
  if (!canManage) return { error: "אין הרשאה" };

  if (data.autoApproveRequests !== undefined) {
    await db
      .update(departments)
      .set({
        autoApproveRequests: data.autoApproveRequests,
        updatedAt: new Date(),
      })
      .where(eq(departments.id, departmentId));
  }

  if (data.storeDepartmentIds && Array.isArray(data.storeDepartmentIds)) {
    await db.delete(handoverDepartments).where(eq(handoverDepartments.userId, session.user.id));
    for (const deptId of data.storeDepartmentIds) {
      if (deptId) {
        await db.insert(handoverDepartments).values({
          userId: session.user.id,
          departmentId: deptId,
        });
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/departments");

  return { success: true };
}

