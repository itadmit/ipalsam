"use server";

import { db } from "@/db";
import {
  requests,
  itemTypes,
  itemUnits,
  movements,
  signatures,
  auditLogs,
  users,
  soldierDepartments,
  handoverDepartments,
  departments,
} from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { hash } from "bcryptjs";
import { createRequestToken, verifyRequestToken } from "@/lib/request-token";
import { revalidatePath } from "next/cache";

export async function validateStoreLink(input: string) {
  const phoneDigits = input.replace(/\D/g, "").slice(-10);
  if (phoneDigits.length < 9) return { error: "לינק לא תקין" };

  const allDeptCommanders = await db.query.users.findMany({
    where: eq(users.role, "dept_commander"),
    columns: { phone: true, departmentId: true },
  });
  const handoverUser = allDeptCommanders.find((u) => {
    const p = (u.phone || "").replace(/\D/g, "").slice(-10);
    return p === phoneDigits || p.endsWith(phoneDigits) || phoneDigits.endsWith(p);
  });
  if (!handoverUser?.departmentId) return { error: "חנות לא נמצאה" };
  return { phoneDigits };
}

export async function getPublicStoreData(handoverPhone: string) {
  const phoneDigits = handoverPhone.replace(/\D/g, "").slice(-10);
  if (phoneDigits.length < 9) return { error: "לינק לא תקין" };

  const allDeptCommanders = await db.query.users.findMany({
    where: eq(users.role, "dept_commander"),
    columns: { id: true, phone: true, firstName: true, lastName: true, departmentId: true },
  });
  const handoverUser = allDeptCommanders.find((u) => {
    const p = (u.phone || "").replace(/\D/g, "").slice(-10);
    return p === phoneDigits || p.endsWith(phoneDigits) || phoneDigits.endsWith(p);
  });
  if (!handoverUser?.departmentId) return { error: "חנות לא נמצאה" };

  const handoverDepts = await db.query.handoverDepartments.findMany({
    where: eq(handoverDepartments.userId, handoverUser.id),
    columns: { departmentId: true },
  });
  const storeDeptIds =
    handoverDepts.length > 0
      ? handoverDepts.map((d) => d.departmentId)
      : [handoverUser.departmentId];

  const dept = await db.query.departments.findFirst({
    where: eq(departments.id, handoverUser.departmentId),
    columns: { id: true, name: true },
  });
  if (!dept) return { error: "מחלקה לא נמצאה" };

  const items = await db.query.itemTypes.findMany({
    where: and(
      inArray(itemTypes.departmentId, storeDeptIds),
      eq(itemTypes.isActive, true)
    ),
    columns: { id: true, name: true, departmentId: true, quantityAvailable: true, type: true },
  });

  const itemsWithStock: { id: string; name: string; departmentId: string; inStock: boolean }[] = [];
  for (const item of items) {
    const inStock =
      item.type === "quantity"
        ? (item.quantityAvailable || 0) > 0
        : (await db.query.itemUnits.findFirst({
            where: and(
              eq(itemUnits.itemTypeId, item.id),
              eq(itemUnits.status, "available")
            ),
          })) !== undefined;
    itemsWithStock.push({
      id: item.id,
      name: item.name,
      departmentId: item.departmentId,
      inStock,
    });
  }

  return {
    storeName: `${handoverUser.firstName || ""} ${handoverUser.lastName || ""}`.trim() || "החנות",
    department: { id: dept.id, name: dept.name },
    items: itemsWithStock,
  };
}

export async function searchSoldiersByPhone(partialPhone: string) {
  const digits = partialPhone.replace(/\D/g, "");
  if (digits.length < 2) return { matches: [] };

  const allUsers = await db.query.users.findMany({
    where: eq(users.isActive, true),
    columns: { id: true, phone: true, firstName: true, lastName: true, role: true },
  });

  const normalize = (s: string) => s.replace(/\D/g, "").slice(-10);
  const digitsNorm = normalize(digits);

  const matches = allUsers.filter((u) => {
    const p = normalize(u.phone || "");
    if (!p) return false;
    return (
      p === digitsNorm ||
      p.endsWith(digitsNorm) ||
      digitsNorm.endsWith(p) ||
      p.includes(digitsNorm) ||
      digitsNorm.includes(p)
    );
  });

  return {
    matches: matches.slice(0, 5).map((u) => ({
      id: u.id,
      phone: u.phone || "",
      name: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
      role: u.role,
    })),
  };
}

export async function identifySoldierByPhone(phone: string) {
  const normalized = phone.replace(/\D/g, "").slice(-10);
  if (normalized.length < 9) {
    return { error: "מספר טלפון לא תקין" };
  }

  const allUsers = await db.query.users.findMany({
    where: eq(users.role, "soldier"),
    columns: { id: true, phone: true, firstName: true, lastName: true, isActive: true },
  });

  const soldier = allUsers.find((u) => {
    const p = (u.phone || "").replace(/\D/g, "").slice(-10);
    return p === normalized || p.endsWith(normalized) || normalized.endsWith(p);
  });

  if (!soldier || !soldier.isActive) {
    return { error: "חייל לא נמצא במערכת" };
  }

  const token = createRequestToken(soldier.id);
  return { token, soldierName: `${soldier.firstName} ${soldier.lastName}` };
}

export async function identifyOrCreateSoldier(
  phone: string,
  options?: { firstName?: string; lastName?: string; departmentId?: string }
) {
  const normalized = phone.replace(/\D/g, "").slice(-10);
  if (normalized.length < 9) {
    return { error: "מספר טלפון לא תקין" };
  }

  const allRequesters = await db.query.users.findMany({
    where: inArray(users.role, ["soldier", "dept_commander", "hq_commander", "super_admin"]),
    columns: { id: true, phone: true, firstName: true, lastName: true, isActive: true },
  });

  const requester = allRequesters.find((u) => {
    const p = (u.phone || "").replace(/\D/g, "").slice(-10);
    return p === normalized || p.endsWith(normalized) || normalized.endsWith(p);
  });

  if (requester?.isActive) {
    const token = createRequestToken(requester.id);
    return { token, soldierName: `${requester.firstName} ${requester.lastName}` };
  }

  if (requester && !requester.isActive) {
    return { error: "המשתמש לא פעיל" };
  }

  if (options?.firstName && options?.lastName) {
    const fullPhone = normalized.length === 9 ? `0${normalized}` : normalized;
    const allByPhone = await db.query.users.findMany({
      columns: { id: true, phone: true, role: true, isActive: true, firstName: true, lastName: true },
    });
    const existingByPhone = allByPhone.find((u) => {
      const p = (u.phone || "").replace(/\D/g, "").slice(-10);
      return p === normalized || p.endsWith(normalized) || normalized.endsWith(p);
    });
    if (existingByPhone) {
      const canRequest =
        ["soldier", "dept_commander", "hq_commander", "super_admin"].includes(
          existingByPhone.role || ""
        ) && existingByPhone.isActive;
      if (canRequest) {
        const token = createRequestToken(existingByPhone.id);
        return {
          token,
          soldierName: `${existingByPhone.firstName || ""} ${existingByPhone.lastName || ""}`.trim(),
        };
      }
      return { error: "מספר טלפון זה כבר רשום במערכת" };
    }
    const hashedPassword = await hash(fullPhone, 12);
    const [newUser] = await db
      .insert(users)
      .values({
        phone: fullPhone,
        password: hashedPassword,
        firstName: options.firstName.trim(),
        lastName: options.lastName.trim(),
        role: "soldier",
        departmentId: options.departmentId || null,
        mustChangePassword: false,
      })
      .returning();
    if (options.departmentId) {
      await db.insert(soldierDepartments).values({
        userId: newUser.id,
        departmentId: options.departmentId,
      });
    }
    const token = createRequestToken(newUser.id);
    return { token, soldierName: `${options.firstName} ${options.lastName}` };
  }

  return { needCreate: true as const };
}

export async function identifySoldierByBarcode(barcode: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.barcode, barcode.trim()),
  });
  if (!user || !user.isActive) {
    return { error: "ברקוד לא מזוהה" };
  }
  if (user.role !== "soldier") {
    return { error: "רק חיילים יכולים להשתמש בהשאלה מהירה" };
  }
  const token = createRequestToken(user.id);
  return {
    token,
    soldierName: `${user.firstName} ${user.lastName}`,
    soldierPhone: user.phone || "",
  };
}

async function getSoldierAllowedDepartmentIds(userId: string): Promise<string[]> {
  const rows = await db.query.soldierDepartments.findMany({
    where: eq(soldierDepartments.userId, userId),
    columns: { departmentId: true },
  });
  const deptIds = rows.map((r) => r.departmentId);
  if (deptIds.length > 0) return deptIds;
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { departmentId: true },
  });
  return user?.departmentId ? [user.departmentId] : [];
}

export async function getSoldierRequestData(token: string, fromPhone?: string) {
  const verified = verifyRequestToken(token);
  if (!verified) return { error: "פג תוקף. אנא הזן טלפון או סרוק ברקוד מחדש" };

  const user = await db.query.users.findFirst({
    where: eq(users.id, verified.userId),
    columns: { id: true, firstName: true, lastName: true, phone: true },
  });
  if (!user || !user.phone) return { error: "חייל לא נמצא" };

  let allowedDeptIds: string[];

  if (fromPhone) {
    const phoneDigits = fromPhone.replace(/\D/g, "").slice(-10);
    const allDeptCommanders = await db.query.users.findMany({
      where: eq(users.role, "dept_commander"),
      columns: { id: true, phone: true, departmentId: true },
    });
    const handoverUser = allDeptCommanders.find((u) => {
      const p = (u.phone || "").replace(/\D/g, "").slice(-10);
      return p === phoneDigits || p.endsWith(phoneDigits) || phoneDigits.endsWith(p);
    });
    if (!handoverUser?.departmentId) {
      return { error: "לינק לא תקין" };
    }
    const handoverDepts = await db.query.handoverDepartments.findMany({
      where: eq(handoverDepartments.userId, handoverUser.id),
      columns: { departmentId: true },
    });
    allowedDeptIds =
      handoverDepts.length > 0
        ? handoverDepts.map((d) => d.departmentId)
        : [handoverUser.departmentId];
  } else {
    allowedDeptIds = await getSoldierAllowedDepartmentIds(user.id);
  }

  if (allowedDeptIds.length === 0) {
    return { error: "לא הוגדרו מחלקות להשאלה עבור חייל זה" };
  }

  const depts = await db.query.departments.findMany({
    where: inArray(departments.id, allowedDeptIds),
    columns: { id: true, name: true },
  });

  const items = await db.query.itemTypes.findMany({
    where: and(
      inArray(itemTypes.departmentId, allowedDeptIds),
      eq(itemTypes.isActive, true)
    ),
    columns: { id: true, name: true, departmentId: true, quantityAvailable: true, type: true },
  });

  const itemsByDepartment: Record<string, { id: string; name: string; inStock: boolean }[]> = {};
  for (const item of items) {
    if (!itemsByDepartment[item.departmentId]) {
      itemsByDepartment[item.departmentId] = [];
    }
    const inStock =
      item.type === "quantity"
        ? (item.quantityAvailable || 0) > 0
        : (await db.query.itemUnits.findFirst({
            where: and(
              eq(itemUnits.itemTypeId, item.id),
              eq(itemUnits.status, "available")
            ),
          })) !== undefined;
    itemsByDepartment[item.departmentId].push({
      id: item.id,
      name: item.name,
      inStock,
    });
  }

  return {
    soldier: {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      phone: user.phone,
    },
    departments: depts,
    itemsByDepartment,
  };
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

export async function createRequestBySoldier(
  token: string,
  items: { departmentId: string; itemTypeId: string; quantity: number }[],
  shared: {
    recipientName: string;
    recipientPhone?: string;
    recipientSignature?: string;
    notes?: string;
  },
  fromPhone?: string
) {
  const verified = verifyRequestToken(token);
  if (!verified) return { error: "פג תוקף. אנא הזן טלפון או סרוק ברקוד מחדש" };

  const requester = await db.query.users.findFirst({
    where: eq(users.id, verified.userId),
  });
  if (!requester || !requester.isActive) return { error: "חייל לא נמצא" };

  let allowedDeptIds: string[];
  if (fromPhone) {
    const phoneDigits = fromPhone.replace(/\D/g, "").slice(-10);
    const allDeptCommanders = await db.query.users.findMany({
      where: eq(users.role, "dept_commander"),
      columns: { id: true, phone: true, departmentId: true },
    });
    const handoverUser = allDeptCommanders.find((u) => {
      const p = (u.phone || "").replace(/\D/g, "").slice(-10);
      return p === phoneDigits || p.endsWith(phoneDigits) || phoneDigits.endsWith(p);
    });
    if (!handoverUser?.departmentId) return { error: "לינק לא תקין" };
    const handoverDeptsReq = await db.query.handoverDepartments.findMany({
      where: eq(handoverDepartments.userId, handoverUser.id),
      columns: { departmentId: true },
    });
    allowedDeptIds =
      handoverDeptsReq.length > 0
        ? handoverDeptsReq.map((d) => d.departmentId)
        : [handoverUser.departmentId];
  } else {
    allowedDeptIds = await getSoldierAllowedDepartmentIds(requester.id);
  }
  if (allowedDeptIds.length === 0) return { error: "אין הרשאה" };

  if (items.length === 0) return { error: "יש להוסיף לפחות פריט אחד" };

  const itemTotals = new Map<string, { departmentId: string; quantity: number }>();
  for (const row of items) {
    if (!allowedDeptIds.includes(row.departmentId)) {
      return { error: "אין הרשאה לבקש ממחלקה זו" };
    }
    const key = row.itemTypeId;
    const existing = itemTotals.get(key);
    if (existing) {
      existing.quantity += row.quantity;
    } else {
      itemTotals.set(key, { departmentId: row.departmentId, quantity: row.quantity });
    }
  }

  for (const [itemTypeId, { quantity }] of itemTotals) {
    const itemType = await db.query.itemTypes.findFirst({
      where: eq(itemTypes.id, itemTypeId),
    });
    if (!itemType) return { error: "פריט לא נמצא" };
    const available =
      itemType.type === "quantity"
        ? (itemType.quantityAvailable || 0)
        : (
            await db.query.itemUnits.findMany({
              where: and(
                eq(itemUnits.itemTypeId, itemTypeId),
                eq(itemUnits.status, "available")
              ),
              columns: { id: true },
            })
          ).length;
    if (available < quantity) {
      return { error: `אזל המלאי עבור "${itemType.name}"` };
    }
  }

  const { randomUUID } = await import("crypto");
  const requestGroupId = randomUUID();
  const created: string[] = [];
  const assignedSerialUnits = new Map<string, string[]>();
  const deptAutoApprove = new Map<string, boolean>();

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

    let autoApprove = deptAutoApprove.get(row.departmentId);
    if (autoApprove === undefined) {
      const dept = await db.query.departments.findFirst({
        where: eq(departments.id, row.departmentId),
        columns: { autoApproveRequests: true },
      });
      autoApprove = dept?.autoApproveRequests ?? false;
      deptAutoApprove.set(row.departmentId, autoApprove);
    }

    const [newRequest] = await db
      .insert(requests)
      .values({
        requestGroupId,
        requesterId: requester.id,
        departmentId: row.departmentId,
        itemTypeId: row.itemTypeId,
        itemUnitId,
        quantity: row.quantity,
        urgency: "immediate",
        recipientName: shared.recipientName || null,
        recipientPhone: shared.recipientPhone || null,
        recipientSignature: shared.recipientSignature || null,
        notes: shared.notes || null,
        status: autoApprove ? "approved" : "submitted",
        approvedById: autoApprove ? requester.id : null,
        approvedAt: autoApprove ? new Date() : null,
      })
      .returning();

    created.push(newRequest.id);

    await db.insert(auditLogs).values({
      userId: requester.id,
      action: "create_request",
      entityType: "request",
      entityId: newRequest.id,
      newValues: { source: "soldier_quick", ...row, ...shared },
    });

    if (autoApprove && (itemType?.type === "quantity" || itemUnitId)) {
      await executeHandover(newRequest.id, requester.id);
    }
  }

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard/loans");
  revalidatePath("/dashboard");

  return { success: true, requestIds: created };
}
