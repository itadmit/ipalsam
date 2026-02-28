"use server";

import { db } from "@/db";
import {
  requests,
  itemTypes,
  itemUnits,
  movements,
  signatures,
  auditLogs,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { auth, canManageDepartment } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { CreateRequestFormData, SessionUser } from "@/types";

export async function createRequest(data: CreateRequestFormData) {
  const session = await auth();

  if (!session?.user) {
    return { error: "לא מחובר" };
  }

  // Validate item availability
  const itemType = await db.query.itemTypes.findFirst({
    where: eq(itemTypes.id, data.itemTypeId),
  });

  if (!itemType) {
    return { error: "פריט לא נמצא" };
  }

  // Check availability
  if (itemType.type === "quantity") {
    if ((itemType.quantityAvailable || 0) < data.quantity) {
      return { error: `אין מספיק במלאי. זמין: ${itemType.quantityAvailable}` };
    }
  }

  const [newRequest] = await db
    .insert(requests)
    .values({
      requesterId: session.user.id,
      departmentId: data.departmentId,
      itemTypeId: data.itemTypeId,
      itemUnitId: data.itemUnitId || null,
      quantity: data.quantity,
      urgency: data.urgency,
      scheduledPickupAt: data.scheduledPickupAt || null,
      scheduledReturnAt: data.scheduledReturnAt || null,
      purpose: data.purpose || null,
      notes: data.notes || null,
      recipientName: data.recipientName || null,
      recipientPhone: data.recipientPhone || null,
      recipientSignature: data.recipientSignature || null,
      status: "submitted",
    })
    .returning();

  // Log action
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "create_request",
    entityType: "request",
    entityId: newRequest.id,
    newValues: data,
  });

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard");

  return { success: true, request: newRequest };
}

export async function approveRequest(requestId: string, notes?: string) {
  const session = await auth();

  if (!session?.user) {
    return { error: "לא מחובר" };
  }

  const request = await db.query.requests.findFirst({
    where: eq(requests.id, requestId),
    with: { itemType: true },
  });

  if (!request) {
    return { error: "בקשה לא נמצאה" };
  }

  const userRole = session.user.role as SessionUser["role"];
  const userDeptId = session.user.departmentId;

  if (!canManageDepartment(userRole, userDeptId, request.departmentId)) {
    return { error: "אין הרשאה" };
  }

  if (request.status !== "submitted") {
    return { error: "לא ניתן לאשר בקשה זו" };
  }

  // Check availability again
  if (request.itemType?.type === "quantity") {
    if ((request.itemType.quantityAvailable || 0) < request.quantity) {
      return { error: "אין מספיק במלאי" };
    }
  }

  await db
    .update(requests)
    .set({
      status: "approved",
      approvedById: session.user.id,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(requests.id, requestId));

  // Log action
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "approve_request",
    entityType: "request",
    entityId: requestId,
    newValues: { notes },
  });

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function rejectRequest(requestId: string, reason: string) {
  const session = await auth();

  if (!session?.user) {
    return { error: "לא מחובר" };
  }

  const request = await db.query.requests.findFirst({
    where: eq(requests.id, requestId),
  });

  if (!request) {
    return { error: "בקשה לא נמצאה" };
  }

  const userRole = session.user.role as SessionUser["role"];
  const userDeptId = session.user.departmentId;

  if (!canManageDepartment(userRole, userDeptId, request.departmentId)) {
    return { error: "אין הרשאה" };
  }

  if (request.status !== "submitted") {
    return { error: "לא ניתן לדחות בקשה זו" };
  }

  await db
    .update(requests)
    .set({
      status: "rejected",
      rejectionReason: reason,
      approvedById: session.user.id,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(requests.id, requestId));

  // Log action
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "reject_request",
    entityType: "request",
    entityId: requestId,
    newValues: { reason },
  });

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function handoverItem(
  requestId: string,
  signature: { confirmed: boolean; pin?: string }
) {
  const session = await auth();

  if (!session?.user) {
    return { error: "לא מחובר" };
  }

  const request = await db.query.requests.findFirst({
    where: eq(requests.id, requestId),
    with: { itemType: true },
  });

  if (!request) {
    return { error: "בקשה לא נמצאה" };
  }

  const userRole = session.user.role as SessionUser["role"];
  const userDeptId = session.user.departmentId;

  if (!canManageDepartment(userRole, userDeptId, request.departmentId)) {
    return { error: "אין הרשאה" };
  }

  if (request.status !== "approved" && request.status !== "ready_for_pickup") {
    return { error: "לא ניתן למסור בקשה זו" };
  }

  // Update inventory
  if (request.itemType?.type === "quantity") {
    await db
      .update(itemTypes)
      .set({
        quantityAvailable: sql`${itemTypes.quantityAvailable} - ${request.quantity}`,
        quantityInUse: sql`${itemTypes.quantityInUse} + ${request.quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(itemTypes.id, request.itemTypeId));
  } else if (request.itemUnitId) {
    await db
      .update(itemUnits)
      .set({
        status: "in_use",
        currentHolderId: request.requesterId,
        updatedAt: new Date(),
      })
      .where(eq(itemUnits.id, request.itemUnitId));
  }

  // Create movement
  const [movement] = await db
    .insert(movements)
    .values({
      itemTypeId: request.itemTypeId,
      itemUnitId: request.itemUnitId,
      requestId,
      type: "allocation",
      quantity: request.quantity,
      fromDepartmentId: request.departmentId,
      toUserId: request.requesterId,
      executedById: session.user.id,
    })
    .returning();

  // Create signature
  await db.insert(signatures).values({
    movementId: movement.id,
    requestId,
    userId: request.requesterId,
    signatureType: "handover",
    confirmed: signature.confirmed,
    pin: signature.pin || null,
  });

  // Update request
  await db
    .update(requests)
    .set({
      status: "handed_over",
      handedOverById: session.user.id,
      handedOverAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(requests.id, requestId));

  // Log action
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "handover_item",
    entityType: "request",
    entityId: requestId,
  });

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function returnItem(
  requestId: string,
  signature: { confirmed: boolean; pin?: string },
  notes?: string
) {
  const session = await auth();

  if (!session?.user) {
    return { error: "לא מחובר" };
  }

  const request = await db.query.requests.findFirst({
    where: eq(requests.id, requestId),
    with: { itemType: true },
  });

  if (!request) {
    return { error: "בקשה לא נמצאה" };
  }

  const userRole = session.user.role as SessionUser["role"];
  const userDeptId = session.user.departmentId;

  if (!canManageDepartment(userRole, userDeptId, request.departmentId)) {
    return { error: "אין הרשאה" };
  }

  if (request.status !== "handed_over") {
    return { error: "לא ניתן להחזיר בקשה זו" };
  }

  // Update inventory
  if (request.itemType?.type === "quantity") {
    await db
      .update(itemTypes)
      .set({
        quantityAvailable: sql`${itemTypes.quantityAvailable} + ${request.quantity}`,
        quantityInUse: sql`${itemTypes.quantityInUse} - ${request.quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(itemTypes.id, request.itemTypeId));
  } else if (request.itemUnitId) {
    await db
      .update(itemUnits)
      .set({
        status: "available",
        currentHolderId: null,
        updatedAt: new Date(),
      })
      .where(eq(itemUnits.id, request.itemUnitId));
  }

  // Create movement
  const [movement] = await db
    .insert(movements)
    .values({
      itemTypeId: request.itemTypeId,
      itemUnitId: request.itemUnitId,
      requestId,
      type: "return",
      quantity: request.quantity,
      toDepartmentId: request.departmentId,
      fromUserId: request.requesterId,
      executedById: session.user.id,
      notes,
    })
    .returning();

  // Create signature
  await db.insert(signatures).values({
    movementId: movement.id,
    requestId,
    userId: request.requesterId,
    signatureType: "return",
    confirmed: signature.confirmed,
    pin: signature.pin || null,
  });

  // Update request
  await db
    .update(requests)
    .set({
      status: "returned",
      returnedAt: new Date(),
      receivedById: session.user.id,
      updatedAt: new Date(),
    })
    .where(eq(requests.id, requestId));

  // Log action
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "return_item",
    entityType: "request",
    entityId: requestId,
    newValues: { notes },
  });

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard");

  return { success: true };
}

