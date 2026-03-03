"use server";

import { db } from "@/db";
import { requests, users, departments, openRequests } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { sendEmail } from "./email";
import { newRequestEmail, newOpenRequestEmail, requestApprovedEmail, requestRejectedEmail } from "./email-templates";

export async function sendNewRequestEmails(
  requestIds: string[],
  requesterId: string,
  approverUserIds: string[]
) {
  if (requestIds.length === 0) return;

  const reqs = await db.query.requests.findMany({
    where: inArray(requests.id, requestIds),
    with: {
      itemType: { columns: { name: true } },
      department: { columns: { name: true } },
    },
  });

  const requester = await db.query.users.findFirst({
    where: eq(users.id, requesterId),
    columns: { email: true, firstName: true, lastName: true },
  });

  const itemsByDept = new Map<string, { name: string; quantity: number; notes?: string | null }[]>();
  for (const r of reqs) {
    if (!r.itemType || !r.department) continue;
    const key = r.departmentId;
    const list = itemsByDept.get(key) || [];
    const existing = list.find((i) => i.name === r.itemType!.name);
    if (existing) {
      existing.quantity += r.quantity;
      if (r.notes?.trim() && !existing.notes) existing.notes = r.notes;
    } else {
      list.push({ name: r.itemType.name, quantity: r.quantity, notes: r.notes });
    }
    itemsByDept.set(key, list);
  }

  const firstNotes = reqs.find((r) => r.notes?.trim())?.notes ?? null;

  const allItems = Array.from(itemsByDept.values()).flat();
  const deptNames = [...new Set(reqs.map((r) => r.department?.name).filter(Boolean))];
  const departmentName = deptNames.join(", ") || "לוגיסטיקה";

  if (requester?.email && allItems.length > 0) {
    const html = newRequestEmail({
      recipientName: `${requester.firstName} ${requester.lastName}`.trim(),
      departmentName,
      items: allItems,
      recipientRole: "requester",
      notes: firstNotes,
    });
    await sendEmail({
      to: requester.email,
      subject: "הבקשה שלך הוגשה – iPalsam",
      html,
    });
  }

  const approvers = await db.query.users.findMany({
    where: inArray(users.id, approverUserIds),
    columns: { id: true, email: true, firstName: true, lastName: true, departmentId: true },
  });

  for (const approver of approvers) {
    if (!approver.email) continue;
    const deptItems = approver.departmentId
      ? itemsByDept.get(approver.departmentId) || allItems
      : allItems;
    if (deptItems.length === 0) continue;
    const dept = await db.query.departments.findFirst({
      where: eq(departments.id, approver.departmentId!),
      columns: { name: true },
    });
    const html = newRequestEmail({
      recipientName: `${approver.firstName} ${approver.lastName}`.trim(),
      departmentName: dept?.name || departmentName,
      items: deptItems,
      recipientRole: "approver",
      notes: firstNotes,
    });
    await sendEmail({
      to: approver.email,
      subject: "בקשה חדשה להשאלת ציוד – iPalsam",
      html,
    });
  }
}

export async function sendNewOpenRequestEmails(
  openRequestId: string,
  requesterId: string | null,
  approverUserIds: string[]
) {
  const openReq = await db.query.openRequests.findFirst({
    where: eq(openRequests.id, openRequestId),
    with: { items: true, department: { columns: { name: true } } },
  });

  if (!openReq?.items?.length) return;

  const items = openReq.items.map((i) => ({
    name: i.itemName,
    quantity: i.quantity,
    notes: i.notes,
  }));
  const departmentName = openReq.department?.name || "לוגיסטיקה";

  if (requesterId) {
    const requester = await db.query.users.findFirst({
      where: eq(users.id, requesterId),
      columns: { email: true, firstName: true, lastName: true },
    });
    if (requester?.email) {
      const html = newOpenRequestEmail({
        recipientName: `${requester.firstName} ${requester.lastName}`.trim(),
        departmentName,
        items,
        recipientRole: "requester",
      });
      await sendEmail({
        to: requester.email,
        subject: "בקשת הציוד שלך הוגשה – iPalsam",
        html,
      });
    }
  }

  const approvers = await db.query.users.findMany({
    where: inArray(users.id, approverUserIds),
    columns: { email: true, firstName: true, lastName: true },
  });

  for (const approver of approvers) {
    if (!approver.email) continue;
    const html = newOpenRequestEmail({
      recipientName: `${approver.firstName} ${approver.lastName}`.trim(),
      departmentName,
      items,
      recipientRole: "approver",
    });
    await sendEmail({
      to: approver.email,
      subject: "בקשה פתוחה חדשה – iPalsam",
      html,
    });
  }
}

export async function sendRequestApprovedEmail(
  requestIds: string[],
  approverNotes?: string | null
) {
  if (requestIds.length === 0) return;

  const reqs = await db.query.requests.findMany({
    where: inArray(requests.id, requestIds),
    with: {
      requester: { columns: { id: true, email: true, firstName: true, lastName: true } },
      itemType: { columns: { name: true } },
      department: { columns: { name: true } },
    },
  });

  const requester = reqs[0]?.requester;
  if (!requester?.email) return;

  const itemsMap = new Map<string, { name: string; quantity: number; notes?: string | null }>();
  for (const r of reqs) {
    if (!r.itemType || !r.department) continue;
    const key = r.itemType.name;
    const existing = itemsMap.get(key);
    if (existing) {
      existing.quantity += r.quantity;
      if (r.notes?.trim() && !existing.notes) existing.notes = r.notes;
    } else {
      itemsMap.set(key, { name: r.itemType.name, quantity: r.quantity, notes: r.notes });
    }
  }
  const items = Array.from(itemsMap.values());
  const departmentName = reqs[0]?.department?.name || "לוגיסטיקה";

  const html = requestApprovedEmail({
    recipientName: `${requester.firstName} ${requester.lastName}`.trim(),
    departmentName,
    items,
    approverNotes,
  });
  await sendEmail({
    to: requester.email,
    subject: "הבקשה שלך אושרה – iPalsam",
    html,
  });
}

export async function sendRequestRejectedEmail(
  requestIds: string[],
  rejectionReason: string,
  approverNotes?: string | null
) {
  if (requestIds.length === 0) return;

  const reqs = await db.query.requests.findMany({
    where: inArray(requests.id, requestIds),
    with: {
      requester: { columns: { id: true, email: true, firstName: true, lastName: true } },
      itemType: { columns: { name: true } },
      department: { columns: { name: true } },
    },
  });

  const requester = reqs[0]?.requester;
  if (!requester?.email) return;

  const itemsMap = new Map<string, { name: string; quantity: number; notes?: string | null }>();
  for (const r of reqs) {
    if (!r.itemType || !r.department) continue;
    const key = r.itemType.name;
    const existing = itemsMap.get(key);
    if (existing) {
      existing.quantity += r.quantity;
      if (r.notes?.trim() && !existing.notes) existing.notes = r.notes;
    } else {
      itemsMap.set(key, { name: r.itemType.name, quantity: r.quantity, notes: r.notes });
    }
  }
  const items = Array.from(itemsMap.values());
  const departmentName = reqs[0]?.department?.name || "לוגיסטיקה";

  const html = requestRejectedEmail({
    recipientName: `${requester.firstName} ${requester.lastName}`.trim(),
    departmentName,
    items,
    rejectionReason,
    approverNotes,
  });
  await sendEmail({
    to: requester.email,
    subject: "הבקשה שלך נדחתה – iPalsam",
    html,
  });
}
