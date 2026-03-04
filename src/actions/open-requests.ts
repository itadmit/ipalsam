"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  openRequests,
  openRequestItems,
  handoverDepartments,
  soldierDepartments,
  departments,
  auditLogs,
  users,
  notifications,
} from "@/db/schema";
import { eq, and, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sendNewOpenRequestEmails, sendOpenRequestItemApprovedEmail, sendOpenRequestItemRejectedEmail } from "@/lib/send-request-emails";

export interface OpenRequestItemInput {
  itemName: string;
  quantity: number;
  notes?: string;
}

export async function createOpenRequest(
  departmentId: string,
  items: OpenRequestItemInput[],
  options?: { signature?: string; source?: "dashboard" | "public_store"; requesterName?: string; requesterPhone?: string }
) {
  const session = await auth();
  const isPublic = options?.source === "public_store";

  if (!isPublic) {
    if (!session?.user) return { error: "יש להתחבר" };
    if (session.user.role !== "soldier" && session.user.role !== "dept_commander") {
      return { error: "רק חיילים יכולים ליצור בקשות פתוחות" };
    }
    const userDept = session.user.departmentId;
    const soldierDeptsRows = await db.query.soldierDepartments.findMany({
      where: eq(soldierDepartments.userId, session.user.id),
      columns: { departmentId: true },
    });
    const soldierDeptIds = soldierDeptsRows.map((r) => r.departmentId).filter(Boolean) as string[];
    const canRequestFrom = userDept ? [userDept, ...soldierDeptIds] : soldierDeptIds;
    if (!canRequestFrom.includes(departmentId)) {
      return { error: "אין הרשאה לבקש ממחלקה זו" };
    }
  }

  const validItems = items.filter((i) => (i.itemName || "").trim().length > 0 && (i.quantity || 0) > 0);
  if (validItems.length === 0) {
    return { error: "יש להוסיף לפחות פריט אחד" };
  }

  const [newRequest] = await db
    .insert(openRequests)
    .values({
      requesterId: !isPublic && session?.user ? session.user.id : null,
      requesterName: options?.requesterName || null,
      requesterPhone: options?.requesterPhone || null,
      departmentId,
      signature: options?.signature || null,
      source: options?.source || "dashboard",
    })
    .returning();

  if (!newRequest) return { error: "שגיאה ביצירת הבקשה" };

  await db.insert(openRequestItems).values(
    validItems.map((i) => ({
      openRequestId: newRequest.id,
      itemName: i.itemName.trim(),
      quantity: i.quantity || 1,
      notes: i.notes?.trim() || null,
    }))
  );

  await db.insert(auditLogs).values({
    userId: session?.user?.id || null,
    action: "create_open_request",
    entityType: "open_request",
    entityId: newRequest.id,
    newValues: { departmentId, itemsCount: validItems.length, source: options?.source },
  });

  // התראה למפקדי מחלקה ומוסרי ציוד
  const handoverUsers = await db.query.handoverDepartments.findMany({
    where: eq(handoverDepartments.departmentId, departmentId),
    columns: { userId: true },
  });
  const deptCommanders = await db.query.users.findMany({
    where: eq(users.departmentId, departmentId),
    columns: { id: true },
  });
  const dept = await db.query.departments.findFirst({
    where: eq(departments.id, departmentId),
    columns: { name: true },
  });
  const notifyUserIds = [...new Set([
    ...handoverUsers.map((h) => h.userId),
    ...deptCommanders.map((u) => u.id),
  ].filter(Boolean))];
  if (notifyUserIds.length > 0) {
    await db.insert(notifications).values(
      notifyUserIds.map((userId) => ({
        userId,
        type: "new_open_request",
        title: "בקשה פתוחה חדשה",
        body: `בקשה חדשה למחלקת ${dept?.name || "לוגיסטיקה"}`,
        metadata: { openRequestId: newRequest.id },
      }))
    );
  }

  sendNewOpenRequestEmails(newRequest.id, session?.user?.id || null, notifyUserIds).catch(() => {});

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/open-requests");
  return { success: true, id: newRequest.id };
}

export async function createOpenRequestFromPublicStore(
  departmentId: string,
  handoverPhone: string,
  items: OpenRequestItemInput[],
  requesterId: string
) {
  const phoneDigits = handoverPhone.replace(/\D/g, "").slice(-10);
  if (phoneDigits.length < 9) return { error: "לינק לא תקין" };
  if (!requesterId) return { error: "יש לזהות את המבקש" };

  const allDeptCommanders = await db.query.users.findMany({
    where: eq(users.role, "dept_commander"),
    columns: { id: true, phone: true, departmentId: true },
  });
  const match = allDeptCommanders.find((u) => {
    const p = (u.phone || "").replace(/\D/g, "").slice(-10);
    return p === phoneDigits || p.endsWith(phoneDigits) || phoneDigits.endsWith(p);
  });
  if (!match?.departmentId) return { error: "חנות לא נמצאה" };

  const handoverDepts = await db.query.handoverDepartments.findMany({
    where: eq(handoverDepartments.userId, match.id),
    columns: { departmentId: true },
  });
  const storeDeptIds = handoverDepts.length > 0
    ? handoverDepts.map((d) => d.departmentId)
    : [match.departmentId];
  if (!storeDeptIds.includes(departmentId)) return { error: "מחלקה לא שייכת לחנות" };

  const validItems = items.filter((i) => (i.itemName || "").trim().length > 0 && (i.quantity || 0) > 0);
  if (validItems.length === 0) return { error: "יש להוסיף לפחות פריט אחד" };

  const [newRequest] = await db
    .insert(openRequests)
    .values({
      requesterId,
      departmentId,
      handoverUserId: match.id,
      source: "public_store",
    })
    .returning();

  if (!newRequest) return { error: "שגיאה ביצירת הבקשה" };

  await db.insert(openRequestItems).values(
    validItems.map((i) => ({
      openRequestId: newRequest.id,
      itemName: i.itemName.trim(),
      quantity: i.quantity || 1,
      notes: i.notes?.trim() || null,
    }))
  );

  // התראה רק לבעל החנות (הפרדה מלאה)
  const dept = await db.query.departments.findFirst({
    where: eq(departments.id, departmentId),
    columns: { name: true },
  });
  const notifyUserIds = [match.id];

  await db.insert(notifications).values(
    notifyUserIds.map((userId) => ({
      userId,
      type: "new_open_request",
      title: "בקשה פתוחה חדשה",
      body: `בקשה חדשה למחלקת ${dept?.name || "לוגיסטיקה"}`,
      metadata: { openRequestId: newRequest.id },
    }))
  );

  sendNewOpenRequestEmails(newRequest.id, requesterId, notifyUserIds).catch(() => {}); // מייל רק לבעל החנות

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/open-requests");
  revalidatePath("/dashboard/my-open-requests");
  const requestNumber = String(
    parseInt(newRequest.id.replace(/-/g, "").slice(-8), 16) % 1000000
  ).padStart(6, "0");
  return { success: true, id: newRequest.id, requestNumber };
}

export async function approveOpenRequestItem(itemId: string, approvalNotes?: string | null) {
  const session = await auth();
  if (!session?.user) return { error: "יש להתחבר" };

  const item = await db.query.openRequestItems.findFirst({
    where: eq(openRequestItems.id, itemId),
    with: { openRequest: { with: { department: true } } },
  });

  if (!item || item.status !== "pending") return { error: "פריט לא נמצא או כבר טופל" };

  const deptId = item.openRequest.departmentId;
  const handoverUserId = item.openRequest.handoverUserId;
  const isPublicStore = item.openRequest.source === "public_store";

  let canApprove: boolean;
  if (isPublicStore && handoverUserId) {
    canApprove = session.user.role === "super_admin" || session.user.id === handoverUserId;
  } else {
    const isDeptCommander = session.user.role === "dept_commander" && session.user.departmentId === deptId;
    const handover = await db.query.handoverDepartments.findFirst({
      where: and(
        eq(handoverDepartments.userId, session.user.id),
        eq(handoverDepartments.departmentId, deptId)
      ),
    });
    canApprove = session.user.role === "super_admin" || session.user.role === "hq_commander" || isDeptCommander || !!handover;
  }

  if (!canApprove) return { error: "אין הרשאה לאשר" };

  const notes = approvalNotes?.trim() || null;
  await db
    .update(openRequestItems)
    .set({
      status: "approved",
      approvedById: session.user.id,
      approvedAt: new Date(),
      approvalNotes: notes,
    })
    .where(eq(openRequestItems.id, itemId));

  // התראה למבקש
  const requesterId = item.openRequest.requesterId;
  if (requesterId) {
    const bodyText = notes
      ? `הפריט "${item.itemName}" אושר. הערות: ${notes}`
      : `הפריט "${item.itemName}" אושר`;
    await db.insert(notifications).values({
      userId: requesterId,
      type: "request_approved",
      title: "הבקשה אושרה",
      body: bodyText,
      metadata: { openRequestId: item.openRequest.id, openRequestItemId: itemId, approvalNotes: notes },
    });
  }

  sendOpenRequestItemApprovedEmail(itemId, notes).catch(() => {});

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "approve_open_request_item",
    entityType: "open_request_item",
    entityId: itemId,
    newValues: { itemName: item.itemName },
  });

  revalidatePath("/dashboard/open-requests");
  return { success: true };
}

export async function approveOpenRequestItemsBulk(
  itemIds: string[],
  approvalNotes?: string | null
) {
  const session = await auth();
  if (!session?.user) return { error: "יש להתחבר" };
  if (itemIds.length === 0) return { error: "לא נבחרו פריטים" };

  const notes = approvalNotes?.trim() || null;
  let approved = 0;

  for (const itemId of itemIds) {
    const result = await approveOpenRequestItem(itemId, notes);
    if (!result.error) approved++;
  }

  revalidatePath("/dashboard/open-requests");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/my-open-requests");
  return { success: true, approved };
}

export async function rejectOpenRequestItemsBulk(
  itemIds: string[],
  reason?: string | null
) {
  const session = await auth();
  if (!session?.user) return { error: "יש להתחבר" };
  if (itemIds.length === 0) return { error: "לא נבחרו פריטים" };

  let rejected = 0;

  for (const itemId of itemIds) {
    const result = await rejectOpenRequestItem(itemId, reason || undefined);
    if (!result.error) rejected++;
  }

  revalidatePath("/dashboard/open-requests");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/my-open-requests");
  return { success: true, rejected };
}

export async function rejectOpenRequestItem(itemId: string, reason?: string) {
  const session = await auth();
  if (!session?.user) return { error: "יש להתחבר" };

  const item = await db.query.openRequestItems.findFirst({
    where: eq(openRequestItems.id, itemId),
    with: { openRequest: true },
  });

  if (!item || item.status !== "pending") return { error: "פריט לא נמצא או כבר טופל" };

  const deptId = item.openRequest.departmentId;
  const handoverUserId = item.openRequest.handoverUserId;
  const isPublicStore = item.openRequest.source === "public_store";

  let canReject: boolean;
  if (isPublicStore && handoverUserId) {
    canReject = session.user.role === "super_admin" || session.user.id === handoverUserId;
  } else {
    const isDeptCommander = session.user.role === "dept_commander" && session.user.departmentId === deptId;
    const handover = await db.query.handoverDepartments.findFirst({
      where: and(
        eq(handoverDepartments.userId, session.user.id),
        eq(handoverDepartments.departmentId, deptId)
      ),
    });
    canReject = session.user.role === "super_admin" || session.user.role === "hq_commander" || isDeptCommander || !!handover;
  }

  if (!canReject) return { error: "אין הרשאה לדחות" };

  await db
    .update(openRequestItems)
    .set({
      status: "rejected",
      approvedById: session.user.id,
      approvedAt: new Date(),
      rejectionReason: reason || null,
    })
    .where(eq(openRequestItems.id, itemId));

  // התראה למבקש
  const requesterId = item.openRequest.requesterId;
  if (requesterId) {
    await db.insert(notifications).values({
      userId: requesterId,
      type: "request_rejected",
      title: "הבקשה נדחתה",
      body: reason ? `הפריט "${item.itemName}" נדחה: ${reason}` : `הפריט "${item.itemName}" נדחה`,
      metadata: { openRequestId: item.openRequest.id, openRequestItemId: itemId },
    });
  }

  sendOpenRequestItemRejectedEmail(itemId, reason).catch(() => {});

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "reject_open_request_item",
    entityType: "open_request_item",
    entityId: itemId,
    newValues: { itemName: item.itemName, reason },
  });

  revalidatePath("/dashboard/open-requests");
  return { success: true };
}

export async function updateOpenRequestItemStatus(
  itemId: string,
  status: "approved" | "rejected",
  notes?: string | null
) {
  const session = await auth();
  if (!session?.user) return { error: "יש להתחבר" };

  const item = await db.query.openRequestItems.findFirst({
    where: eq(openRequestItems.id, itemId),
    with: { openRequest: { with: { department: true } } },
  });

  if (!item || (item.status !== "approved" && item.status !== "rejected")) {
    return { error: "פריט לא נמצא או לא טופל עדיין" };
  }

  const deptId = item.openRequest.departmentId;
  const handoverUserId = item.openRequest.handoverUserId;
  const isPublicStore = item.openRequest.source === "public_store";

  let canUpdate: boolean;
  if (isPublicStore && handoverUserId) {
    canUpdate = session.user.role === "super_admin" || session.user.id === handoverUserId;
  } else {
    const isDeptCommander = session.user.role === "dept_commander" && session.user.departmentId === deptId;
    const handover = await db.query.handoverDepartments.findFirst({
      where: and(
        eq(handoverDepartments.userId, session.user.id),
        eq(handoverDepartments.departmentId, deptId)
      ),
    });
    canUpdate = session.user.role === "super_admin" || session.user.role === "hq_commander" || isDeptCommander || !!handover;
  }

  if (!canUpdate) return { error: "אין הרשאה לערוך" };

  const notesTrimmed = notes?.trim() || null;

  await db
    .update(openRequestItems)
    .set({
      status,
      approvalNotes: status === "approved" ? notesTrimmed : null,
      rejectionReason: status === "rejected" ? notesTrimmed : null,
    })
    .where(eq(openRequestItems.id, itemId));

  if (status === "approved") {
    sendOpenRequestItemApprovedEmail(itemId, notesTrimmed).catch(() => {});
  } else {
    sendOpenRequestItemRejectedEmail(itemId, notesTrimmed).catch(() => {});
  }

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "update_open_request_item_status",
    entityType: "open_request_item",
    entityId: itemId,
    newValues: { status, notes: notesTrimmed },
  });

  revalidatePath("/dashboard/open-requests");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/my-open-requests");
  return { success: true };
}

/** סימון פריט כ"נמחק" – פריט מאושר שיצא ללקוח, או פריט נדחה להסרה מהרשימה */
export async function markOpenRequestItemDeleted(itemId: string) {
  const session = await auth();
  if (!session?.user) return { error: "יש להתחבר" };

  const item = await db.query.openRequestItems.findFirst({
    where: eq(openRequestItems.id, itemId),
    with: { openRequest: { with: { department: true } } },
  });

  if (!item || (item.status !== "approved" && item.status !== "rejected")) {
    return { error: "פריט לא נמצא או לא ניתן למחוק" };
  }

  const deptId = item.openRequest.departmentId;
  const handoverUserId = item.openRequest.handoverUserId;
  const isPublicStore = item.openRequest.source === "public_store";

  let canUpdate: boolean;
  if (isPublicStore && handoverUserId) {
    canUpdate = session.user.role === "super_admin" || session.user.id === handoverUserId;
  } else {
    const isDeptCommander = session.user.role === "dept_commander" && session.user.departmentId === deptId;
    const handover = await db.query.handoverDepartments.findFirst({
      where: and(
        eq(handoverDepartments.userId, session.user.id),
        eq(handoverDepartments.departmentId, deptId)
      ),
    });
    canUpdate = session.user.role === "super_admin" || session.user.role === "hq_commander" || isDeptCommander || !!handover;
  }

  if (!canUpdate) return { error: "אין הרשאה" };

  await db
    .update(openRequestItems)
    .set({
      status: "deleted",
      deletedAt: new Date(),
    })
    .where(eq(openRequestItems.id, itemId));

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "mark_open_request_item_deleted",
    entityType: "open_request_item",
    entityId: itemId,
    newValues: { previousStatus: item.status },
  });

  revalidatePath("/dashboard/open-requests");
  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard/my-open-requests");
  revalidatePath("/super-admin/open-requests-archive");
  return { success: true };
}

export async function deleteOpenRequest(requestId: string) {
  const session = await auth();
  if (!session?.user) return { error: "יש להתחבר" };

  const request = await db.query.openRequests.findFirst({
    where: eq(openRequests.id, requestId),
  });

  if (!request) return { error: "בקשה לא נמצאה" };

  const deptId = request.departmentId;
  const handoverUserId = request.handoverUserId;
  const isPublicStore = request.source === "public_store";

  let canDelete: boolean;
  if (isPublicStore && handoverUserId) {
    canDelete = session.user.role === "super_admin" || session.user.id === handoverUserId;
  } else {
    const isDeptCommander = session.user.role === "dept_commander" && session.user.departmentId === deptId;
    const handover = await db.query.handoverDepartments.findFirst({
      where: and(
        eq(handoverDepartments.userId, session.user.id),
        eq(handoverDepartments.departmentId, deptId)
      ),
    });
    const isHQ = session.user.role === "hq_commander";
    const allDepts = isHQ || session.user.role === "super_admin";
    const deptIds = allDepts
      ? (await db.query.departments.findMany({ where: eq(departments.isActive, true), columns: { id: true } })).map((d) => d.id)
      : isDeptCommander && deptId ? [deptId] : handover ? [handover.departmentId] : [];
    canDelete = session.user.role === "super_admin" || (isHQ && deptIds.includes(deptId)) || isDeptCommander || !!handover;
  }

  if (!canDelete) return { error: "אין הרשאה למחוק בקשה זו" };

  await db.delete(openRequests).where(eq(openRequests.id, requestId));

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "delete_open_request",
    entityType: "open_request",
    entityId: requestId,
  });

  revalidatePath("/dashboard/open-requests");
  revalidatePath("/dashboard/profile");
  return { success: true };
}
