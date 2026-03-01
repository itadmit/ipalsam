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
import { and, eq, or, sql } from "drizzle-orm";
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

  const { randomUUID } = await import("crypto");
  const requestGroupId = randomUUID();

  const [newRequest] = await db
    .insert(requests)
    .values({
      requestGroupId,
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
      status: "approved",
      approvedById: session.user.id,
      approvedAt: new Date(),
    })
    .returning();

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "create_request",
    entityType: "request",
    entityId: newRequest.id,
    newValues: data,
  });

  // ההשאלה = מסירה: מיד אחרי אישור מבצעים מסירה (עדכון מלאי, תנועה, handed_over)
  const reqWithType = await db.query.requests.findFirst({
    where: eq(requests.id, newRequest.id),
    with: { itemType: true },
  });
  if (reqWithType?.itemType) {
    let unitId = reqWithType.itemUnitId;
    if (reqWithType.itemType.type === "serial" && !unitId) {
      const avail = await db.query.itemUnits.findFirst({
        where: and(
          eq(itemUnits.itemTypeId, reqWithType.itemTypeId),
          eq(itemUnits.status, "available")
        ),
      });
      if (avail) {
        unitId = avail.id;
        await db.update(requests).set({ itemUnitId: unitId, updatedAt: new Date() }).where(eq(requests.id, newRequest.id));
      }
    }
    if (reqWithType.itemType.type === "quantity" || unitId) {
      await executeHandover(newRequest.id, session.user.id);
    }
  }

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard/loans");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard");

  return { success: true, request: newRequest };
}

async function executeHandover(requestId: string, executedByUserId: string) {
  const request = await db.query.requests.findFirst({
    where: eq(requests.id, requestId),
    with: { itemType: true },
  });
  if (!request || !request.itemType || request.status === "handed_over") return;

  if (request.itemType.type === "quantity") {
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
  } else return;

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
      executedById: executedByUserId,
    })
    .returning();

  await db.insert(signatures).values({
    movementId: movement.id,
    requestId,
    userId: request.requesterId,
    signatureType: "handover",
    confirmed: true,
    pin: null,
  });

  await db
    .update(requests)
    .set({
      status: "handed_over",
      handedOverById: executedByUserId,
      handedOverAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(requests.id, requestId));

  await db.insert(auditLogs).values({
    userId: executedByUserId,
    action: "handover_item",
    entityType: "request",
    entityId: requestId,
  });
}

export async function createRequestsBatch(
  items: { departmentId: string; itemTypeId: string; quantity: number }[],
  shared: {
    urgency: "immediate" | "scheduled";
    recipientName: string;
    recipientPhone?: string;
    recipientSignature?: string;
    scheduledPickupAt?: Date;
    scheduledReturnAt?: Date;
    purpose?: string;
    notes?: string;
  }
) {
  const session = await auth();

  if (!session?.user) {
    return { error: "לא מחובר" };
  }

  if (items.length === 0) {
    return { error: "יש להוסיף לפחות פריט אחד" };
  }

  // אגרגציה לפי פריט - בדיקת מלאי
  const itemTotals = new Map<string, { departmentId: string; quantity: number }>();
  for (const row of items) {
    const key = row.itemTypeId;
    const existing = itemTotals.get(key);
    if (existing) {
      existing.quantity += row.quantity;
      // departmentId - לוקחים מהשורה הראשונה
    } else {
      itemTotals.set(key, {
        departmentId: row.departmentId,
        quantity: row.quantity,
      });
    }
  }

  // בדיקת זמינות לכל פריט
  for (const [itemTypeId, { quantity }] of itemTotals) {
    const itemType = await db.query.itemTypes.findFirst({
      where: eq(itemTypes.id, itemTypeId),
    });
    if (!itemType) {
      return { error: "פריט לא נמצא" };
    }
    const available = itemType.type === "quantity"
      ? (itemType.quantityAvailable || 0)
      : (await db.query.itemUnits.findMany({
          where: and(
            eq(itemUnits.itemTypeId, itemTypeId),
            eq(itemUnits.status, "available")
          ),
          columns: { id: true },
        })).length;
    if (available < quantity) {
      return {
        error: `אין מספיק במלאי עבור "${itemType.name}". זמין: ${available}, מבוקש: ${quantity}`,
      };
    }
  }

  const { randomUUID } = await import("crypto");
  const requestGroupId = randomUUID();

  const created: string[] = [];
  const assignedSerialUnits = new Map<string, string[]>();

  for (const row of items) {
    const itemType = await db.query.itemTypes.findFirst({
      where: eq(itemTypes.id, row.itemTypeId),
    });
    let itemUnitId: string | null = null;
    if (itemType?.type === "serial") {
      const assigned = assignedSerialUnits.get(row.itemTypeId) || [];
      const avail = await db.query.itemUnits.findFirst({
        where: and(
          eq(itemUnits.itemTypeId, row.itemTypeId),
          eq(itemUnits.status, "available")
        ),
      });
      if (avail && !assigned.includes(avail.id)) {
        itemUnitId = avail.id;
        assignedSerialUnits.set(row.itemTypeId, [...assigned, avail.id]);
      }
    }

    const [newRequest] = await db
      .insert(requests)
      .values({
        requestGroupId,
        requesterId: session.user.id,
        departmentId: row.departmentId,
        itemTypeId: row.itemTypeId,
        itemUnitId,
        quantity: row.quantity,
        urgency: shared.urgency,
        scheduledPickupAt: shared.scheduledPickupAt || null,
        scheduledReturnAt: shared.scheduledReturnAt || null,
        purpose: shared.purpose || null,
        notes: shared.notes || null,
        recipientName: shared.recipientName || null,
        recipientPhone: shared.recipientPhone || null,
        recipientSignature: shared.recipientSignature || null,
        status: "approved",
        approvedById: session.user.id,
        approvedAt: new Date(),
      })
      .returning();

    created.push(newRequest.id);

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "create_request",
      entityType: "request",
      entityId: newRequest.id,
      newValues: { ...row, ...shared },
    });

    // ההשאלה = מסירה: מיד מבצעים מסירה
    if (itemType?.type === "quantity" || itemUnitId) {
      await executeHandover(newRequest.id, session.user.id);
    }
  }

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard/loans");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard");

  return { success: true, requestIds: created };
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
    return { error: "השאלה לא נמצאה" };
  }

  const userRole = session.user.role as SessionUser["role"];
  const userDeptId = session.user.departmentId;

  if (!canManageDepartment(userRole, userDeptId, request.departmentId)) {
    return { error: "אין הרשאה" };
  }

  if (request.status !== "submitted") {
    return { error: "לא ניתן לאשר השאלה זו" };
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

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "approve_request",
    entityType: "request",
    entityId: requestId,
    newValues: { notes },
  });

  // ההשאלה = מסירה: מיד אחרי אישור מבצעים מסירה
  if (request.itemType?.type === "quantity" || request.itemUnitId) {
    await executeHandover(requestId, session.user.id);
  }

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard/loans");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function approveGroup(requestGroupId: string, notes?: string) {
  const session = await auth();
  if (!session?.user) return { error: "לא מחובר" };

  const groupRequests = await db.query.requests.findMany({
    where: and(
      eq(requests.requestGroupId, requestGroupId),
      eq(requests.status, "submitted")
    ),
    with: { itemType: true },
  });

  if (groupRequests.length === 0) {
    return { error: "לא נמצאו השאלות לאישור" };
  }

  const userRole = session.user.role as SessionUser["role"];
  const userDeptId = session.user.departmentId;

  for (const req of groupRequests) {
    if (!canManageDepartment(userRole, userDeptId, req.departmentId)) {
      return { error: "אין הרשאה לאשר את כל הפריטים בהשאלה" };
    }
    if (req.itemType?.type === "quantity") {
      if ((req.itemType.quantityAvailable || 0) < req.quantity) {
        return { error: `אין מספיק במלאי עבור ${req.itemType.name}` };
      }
    }
  }

  for (const req of groupRequests) {
    let unitId = req.itemUnitId;
    if (req.itemType?.type === "serial" && !unitId) {
      const avail = await db.query.itemUnits.findFirst({
        where: and(
          eq(itemUnits.itemTypeId, req.itemTypeId),
          eq(itemUnits.status, "available")
        ),
      });
      if (avail) {
        unitId = avail.id;
        await db.update(requests).set({ itemUnitId: unitId, updatedAt: new Date() }).where(eq(requests.id, req.id));
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
      .where(eq(requests.id, req.id));
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "approve_request",
      entityType: "request",
      entityId: req.id,
      newValues: { notes },
    });
    // ההשאלה = מסירה: מיד אחרי אישור מבצעים מסירה
    if (req.itemType?.type === "quantity" || unitId) {
      await executeHandover(req.id, session.user.id);
    }
  }

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard/loans");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function rejectGroup(requestGroupId: string, reason: string) {
  const session = await auth();
  if (!session?.user) return { error: "לא מחובר" };

  const groupRequests = await db.query.requests.findMany({
    where: and(
      eq(requests.requestGroupId, requestGroupId),
      eq(requests.status, "submitted")
    ),
  });

  if (groupRequests.length === 0) {
    return { error: "לא נמצאו השאלות לדחייה" };
  }

  const userRole = session.user.role as SessionUser["role"];
  const userDeptId = session.user.departmentId;

  for (const req of groupRequests) {
    if (!canManageDepartment(userRole, userDeptId, req.departmentId)) {
      return { error: "אין הרשאה לדחות את כל הפריטים בהשאלה" };
    }
  }

  for (const req of groupRequests) {
    await db
      .update(requests)
      .set({
        status: "rejected",
        rejectionReason: reason,
        approvedById: session.user.id,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(requests.id, req.id));
    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "reject_request",
      entityType: "request",
      entityId: req.id,
      newValues: { reason },
    });
  }

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
    return { error: "השאלה לא נמצאה" };
  }

  const userRole = session.user.role as SessionUser["role"];
  const userDeptId = session.user.departmentId;

  if (!canManageDepartment(userRole, userDeptId, request.departmentId)) {
    return { error: "אין הרשאה" };
  }

  if (request.status !== "submitted") {
    return { error: "לא ניתן לדחות השאלה זו" };
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
    return { error: "השאלה לא נמצאה" };
  }

  const userRole = session.user.role as SessionUser["role"];
  const userDeptId = session.user.departmentId;

  if (!canManageDepartment(userRole, userDeptId, request.departmentId)) {
    return { error: "אין הרשאה" };
  }

  if (request.status !== "approved" && request.status !== "ready_for_pickup") {
    return { error: "לא ניתן למסור השאלה זו" };
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

export async function returnGroup(groupKey: string) {
  const session = await auth();

  if (!session?.user) {
    return { error: "לא מחובר" };
  }

  let groupRequests = await db.query.requests.findMany({
    where: and(
      eq(requests.requestGroupId, groupKey),
      or(eq(requests.status, "approved"), eq(requests.status, "handed_over"))
    ),
    with: { itemType: true },
  });

  if (groupRequests.length === 0) {
    const single = await db.query.requests.findFirst({
      where: and(
        eq(requests.id, groupKey),
        or(eq(requests.status, "approved"), eq(requests.status, "handed_over"))
      ),
      with: { itemType: true },
    });
    if (single) groupRequests = [single];
  }

  if (groupRequests.length === 0) {
    return { error: "לא נמצאו השאלות להחזרה" };
  }

  // אם בסטטוס approved - הרץ מסירה קודם (ההשאלה=מסירה)
  for (const req of groupRequests) {
    if (req.status === "approved") {
      let unitId = req.itemUnitId;
      if (req.itemType?.type === "serial" && !unitId) {
        const avail = await db.query.itemUnits.findFirst({
          where: and(
            eq(itemUnits.itemTypeId, req.itemTypeId),
            eq(itemUnits.status, "available")
          ),
        });
        if (avail) {
          unitId = avail.id;
          await db.update(requests).set({ itemUnitId: unitId, updatedAt: new Date() }).where(eq(requests.id, req.id));
        }
      }
      if (req.itemType?.type === "quantity" || unitId) {
        await executeHandover(req.id, session.user.id);
      }
    }
  }

  // טען מחדש - עכשיו handed_over
  groupRequests = await db.query.requests.findMany({
    where: and(
      eq(requests.requestGroupId, groupKey),
      eq(requests.status, "handed_over")
    ),
    with: { itemType: true },
  });
  if (groupRequests.length === 0) {
    const single = await db.query.requests.findFirst({
      where: and(eq(requests.id, groupKey), eq(requests.status, "handed_over")),
      with: { itemType: true },
    });
    if (single) groupRequests = [single];
  }
  if (groupRequests.length === 0) {
    return { error: "לא ניתן להחזיר - אין פריטים במסירה" };
  }

  const userRole = session.user.role as SessionUser["role"];
  const userDeptId = session.user.departmentId;

  for (const request of groupRequests) {
    if (!canManageDepartment(userRole, userDeptId, request.departmentId)) {
      return { error: "אין הרשאה" };
    }
  }

  for (const request of groupRequests) {
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

    const [movement] = await db
      .insert(movements)
      .values({
        itemTypeId: request.itemTypeId,
        itemUnitId: request.itemUnitId,
        requestId: request.id,
        type: "return",
        quantity: request.quantity,
        toDepartmentId: request.departmentId,
        fromUserId: request.requesterId,
        executedById: session.user.id,
      })
      .returning();

    await db.insert(signatures).values({
      movementId: movement.id,
      requestId: request.id,
      userId: request.requesterId,
      signatureType: "return",
      confirmed: true,
      pin: null,
    });

    await db
      .update(requests)
      .set({
        status: "returned",
        returnedAt: new Date(),
        receivedById: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(requests.id, request.id));

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: "return_item",
      entityType: "request",
      entityId: request.id,
      newValues: {},
    });
  }

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard/loans");
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
    return { error: "השאלה לא נמצאה" };
  }

  const userRole = session.user.role as SessionUser["role"];
  const userDeptId = session.user.departmentId;

  if (!canManageDepartment(userRole, userDeptId, request.departmentId)) {
    return { error: "אין הרשאה" };
  }

  if (request.status !== "handed_over") {
    return { error: "לא ניתן להחזיר השאלה זו" };
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

export async function updateRequestStatusToClosed(
  requestId: string,
  requestGroupId: string | null,
  newStatus: "closed" | "overdue"
) {
  const session = await auth();
  if (!session?.user) return { error: "לא מחובר" };

  const userRole = session.user.role as SessionUser["role"];
  const userDeptId = session.user.departmentId;

  const groupRows = requestGroupId
    ? await db
        .select({ id: requests.id, departmentId: requests.departmentId })
        .from(requests)
        .where(eq(requests.requestGroupId, requestGroupId))
    : await db
        .select({ id: requests.id, departmentId: requests.departmentId })
        .from(requests)
        .where(eq(requests.id, requestId));
  const idsToUpdate = groupRows.map((r) => ({ id: r.id, departmentId: r.departmentId }));

  for (const { id, departmentId } of idsToUpdate) {
    if (!canManageDepartment(userRole, userDeptId, departmentId)) {
      return { error: "אין הרשאה" };
    }
  }

  for (const { id } of idsToUpdate) {
    await db
      .update(requests)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(requests.id, id));
  }

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard/loans");
  revalidatePath("/dashboard");
  return { success: true };
}

const REQUEST_STATUSES = [
  "draft",
  "submitted",
  "approved",
  "rejected",
  "ready_for_pickup",
  "handed_over",
  "returned",
  "closed",
  "overdue",
] as const;

export async function updateRequestStatus(
  requestId: string,
  requestGroupId: string | null,
  newStatus: string
) {
  const session = await auth();
  if (!session?.user) return { error: "לא מחובר" };
  if (!REQUEST_STATUSES.includes(newStatus as (typeof REQUEST_STATUSES)[number])) {
    return { error: "סטטוס לא תקין" };
  }

  const userRole = session.user.role as SessionUser["role"];
  const userDeptId = session.user.departmentId;

  const groupRows = requestGroupId
    ? await db
        .select({ id: requests.id, departmentId: requests.departmentId })
        .from(requests)
        .where(eq(requests.requestGroupId, requestGroupId))
    : await db
        .select({ id: requests.id, departmentId: requests.departmentId })
        .from(requests)
        .where(eq(requests.id, requestId));

  const groupRequests = await db.query.requests.findMany({
    where: requestGroupId
      ? eq(requests.requestGroupId, requestGroupId)
      : eq(requests.id, requestId),
    with: { itemType: true },
  });

  for (const { departmentId } of groupRows) {
    if (!canManageDepartment(userRole, userDeptId, departmentId)) {
      return { error: "אין הרשאה" };
    }
  }

  if (newStatus === "handed_over") {
    for (const req of groupRequests) {
      if (req.status !== "returned") continue;
      if (req.itemType?.type === "quantity") {
        await db
          .update(itemTypes)
          .set({
            quantityAvailable: sql`${itemTypes.quantityAvailable} - ${req.quantity}`,
            quantityInUse: sql`${itemTypes.quantityInUse} + ${req.quantity}`,
            updatedAt: new Date(),
          })
          .where(eq(itemTypes.id, req.itemTypeId));
      } else if (req.itemUnitId) {
        await db
          .update(itemUnits)
          .set({
            status: "in_use",
            currentHolderId: req.requesterId,
            updatedAt: new Date(),
          })
          .where(eq(itemUnits.id, req.itemUnitId));
      }
    }
  }

  for (const { id } of groupRows) {
    await db
      .update(requests)
      .set({
        status: newStatus as (typeof REQUEST_STATUSES)[number],
        ...(newStatus === "handed_over" && {
          handedOverAt: new Date(),
          handedOverById: session.user.id,
          returnedAt: null,
          receivedById: null,
        }),
        updatedAt: new Date(),
      })
      .where(eq(requests.id, id));
  }

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard/loans");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard");
  return { success: true };
}
