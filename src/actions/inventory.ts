"use server";

import { db } from "@/db";
import { itemTypes, itemUnits, movements, auditLogs } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth, canManageDepartment } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { CreateItemTypeFormData, SessionUser } from "@/types";

export async function createItemType(data: CreateItemTypeFormData) {
  const session = await auth();

  if (!session?.user) {
    return { error: "לא מחובר" };
  }

  const userRole = session.user.role as SessionUser["role"];
  const userDeptId = session.user.departmentId;

  if (!canManageDepartment(userRole, userDeptId, data.departmentId)) {
    return { error: "אין הרשאה" };
  }

  const [newItemType] = await db
    .insert(itemTypes)
    .values({
      name: data.name,
      catalogNumber: data.catalogNumber || null,
      description: data.description || null,
      notes: data.notes || null,
      departmentId: data.departmentId,
      categoryId: data.categoryId || null,
      type: data.type,
      quantityTotal: data.type === "quantity" ? (data.quantityTotal || 0) : null,
      quantityAvailable:
        data.type === "quantity" ? (data.quantityTotal || 0) : null,
      quantityInUse: 0,
      minimumAlert: data.minimumAlert || 0,
      requiresDoubleApproval: data.requiresDoubleApproval,
      maxLoanDays: data.maxLoanDays || null,
    })
    .returning();

  // Log action
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "create_item_type",
    entityType: "item_type",
    entityId: newItemType.id,
    newValues: data,
  });

  revalidatePath("/dashboard/inventory");

  return { success: true, itemType: newItemType };
}

export async function addSerialUnit(
  itemTypeId: string,
  serialNumber: string,
  assetTag?: string,
  notes?: string
) {
  const session = await auth();

  if (!session?.user) {
    return { error: "לא מחובר" };
  }

  // Get item type to check department
  const itemType = await db.query.itemTypes.findFirst({
    where: eq(itemTypes.id, itemTypeId),
  });

  if (!itemType) {
    return { error: "סוג ציוד לא נמצא" };
  }

  const userRole = session.user.role as SessionUser["role"];
  const userDeptId = session.user.departmentId;

  if (!canManageDepartment(userRole, userDeptId, itemType.departmentId)) {
    return { error: "אין הרשאה" };
  }

  // Check if serial already exists
  const existingUnit = await db.query.itemUnits.findFirst({
    where: and(
      eq(itemUnits.itemTypeId, itemTypeId),
      eq(itemUnits.serialNumber, serialNumber)
    ),
  });

  if (existingUnit) {
    return { error: "מספר סידורי כבר קיים" };
  }

  const [newUnit] = await db
    .insert(itemUnits)
    .values({
      itemTypeId,
      serialNumber,
      assetTag: assetTag || null,
      notes: notes || null,
      status: "available",
    })
    .returning();

  // Create intake movement
  await db.insert(movements).values({
    itemTypeId,
    itemUnitId: newUnit.id,
    type: "intake",
    quantity: 1,
    toDepartmentId: itemType.departmentId,
    executedById: session.user.id,
    notes: `קליטת יחידה סריאלית: ${serialNumber}`,
  });

  // Log action
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "add_serial_unit",
    entityType: "item_unit",
    entityId: newUnit.id,
    newValues: { serialNumber, assetTag },
  });

  revalidatePath("/dashboard/inventory");
  revalidatePath(`/dashboard/inventory/${itemTypeId}`);

  return { success: true, unit: newUnit };
}

export async function intakeQuantity(
  itemTypeId: string,
  quantity: number,
  notes?: string
) {
  const session = await auth();

  if (!session?.user) {
    return { error: "לא מחובר" };
  }

  const itemType = await db.query.itemTypes.findFirst({
    where: eq(itemTypes.id, itemTypeId),
  });

  if (!itemType) {
    return { error: "סוג ציוד לא נמצא" };
  }

  if (itemType.type !== "quantity") {
    return { error: "פריט זה אינו כמותי" };
  }

  const userRole = session.user.role as SessionUser["role"];
  const userDeptId = session.user.departmentId;

  if (!canManageDepartment(userRole, userDeptId, itemType.departmentId)) {
    return { error: "אין הרשאה" };
  }

  // Update quantities
  await db
    .update(itemTypes)
    .set({
      quantityTotal: sql`${itemTypes.quantityTotal} + ${quantity}`,
      quantityAvailable: sql`${itemTypes.quantityAvailable} + ${quantity}`,
      updatedAt: new Date(),
    })
    .where(eq(itemTypes.id, itemTypeId));

  // Create intake movement
  await db.insert(movements).values({
    itemTypeId,
    type: "intake",
    quantity,
    toDepartmentId: itemType.departmentId,
    executedById: session.user.id,
    notes: notes || `קליטת ${quantity} יחידות`,
  });

  // Log action
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "intake_quantity",
    entityType: "item_type",
    entityId: itemTypeId,
    newValues: { quantity, notes },
  });

  revalidatePath("/dashboard/inventory");
  revalidatePath(`/dashboard/inventory/${itemTypeId}`);

  return { success: true };
}

export async function updateItemType(
  itemTypeId: string,
  data: Partial<CreateItemTypeFormData>
) {
  const session = await auth();

  if (!session?.user) {
    return { error: "לא מחובר" };
  }

  const itemType = await db.query.itemTypes.findFirst({
    where: eq(itemTypes.id, itemTypeId),
  });

  if (!itemType) {
    return { error: "סוג ציוד לא נמצא" };
  }

  const userRole = session.user.role as SessionUser["role"];
  const userDeptId = session.user.departmentId;

  if (!canManageDepartment(userRole, userDeptId, itemType.departmentId)) {
    return { error: "אין הרשאה" };
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.name) updateData.name = data.name;
  if (data.catalogNumber !== undefined)
    updateData.catalogNumber = data.catalogNumber || null;
  if (data.description !== undefined)
    updateData.description = data.description || null;
  if (data.notes !== undefined) updateData.notes = data.notes || null;
  if (data.categoryId !== undefined)
    updateData.categoryId = data.categoryId || null;
  if (data.minimumAlert !== undefined) updateData.minimumAlert = data.minimumAlert;
  if (data.requiresDoubleApproval !== undefined)
    updateData.requiresDoubleApproval = data.requiresDoubleApproval;
  if (data.maxLoanDays !== undefined)
    updateData.maxLoanDays = data.maxLoanDays || null;

  await db.update(itemTypes).set(updateData).where(eq(itemTypes.id, itemTypeId));

  // Log action
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "update_item_type",
    entityType: "item_type",
    entityId: itemTypeId,
    oldValues: { name: itemType.name },
    newValues: data,
  });

  revalidatePath("/dashboard/inventory");
  revalidatePath(`/dashboard/inventory/${itemTypeId}`);

  return { success: true };
}

