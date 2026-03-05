"use server";

import { db } from "@/db";
import { requestApprovalListeners, users, departments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getApprovalListenersForUser(userId: string) {
  const session = await auth();
  if (!session?.user) return { error: "לא מחובר", listeners: [] };
  const canEdit =
    session.user.role === "super_admin" ||
    (session.user.role === "hq_commander" && session.user.id === userId);
  if (!canEdit) return { error: "אין הרשאה", listeners: [] };

  const listeners = await db.query.requestApprovalListeners.findMany({
    where: eq(requestApprovalListeners.listenerUserId, userId),
    with: {
      listenToUser: { columns: { id: true, firstName: true, lastName: true, phone: true } },
      listenToDepartment: { columns: { id: true, name: true } },
    },
  });

  return {
    listeners: listeners.map((l) => ({
      id: l.id,
      listenToUserId: l.listenToUserId,
      listenToDepartmentId: l.listenToDepartmentId,
      listenToLabel: l.listenToUser
        ? `${l.listenToUser.firstName} ${l.listenToUser.lastName} (${l.listenToUser.phone})`
        : l.listenToDepartment?.name || "-",
      receiveEmail: l.receiveEmail,
    })),
  };
}

export async function addApprovalListener(
  listenerUserId: string,
  listenToUserId: string | null,
  listenToDepartmentId: string | null,
  receiveEmail: boolean
) {
  const session = await auth();
  if (!session?.user) return { error: "לא מחובר" };
  const canEdit =
    session.user.role === "super_admin" ||
    (session.user.role === "hq_commander" && session.user.id === listenerUserId);
  if (!canEdit) return { error: "אין הרשאה" };
  if (!listenToUserId && !listenToDepartmentId) return { error: "יש לבחור חייל או מחלקה" };

  const allForUser = await db.query.requestApprovalListeners.findMany({
    where: eq(requestApprovalListeners.listenerUserId, listenerUserId),
  });
  const exists = allForUser.some(
    (l) =>
      (listenToUserId && l.listenToUserId === listenToUserId) ||
      (listenToDepartmentId && l.listenToDepartmentId === listenToDepartmentId)
  );
  if (exists) return { error: "ההאזנה כבר קיימת" };

  await db.insert(requestApprovalListeners).values({
    listenerUserId,
    listenToUserId: listenToUserId || null,
    listenToDepartmentId: listenToDepartmentId || null,
    receiveEmail,
  });

  revalidatePath(`/super-admin/users/${listenerUserId}`);
  return { success: true };
}

export async function removeApprovalListener(listenerId: string, listenerUserId: string) {
  const session = await auth();
  if (!session?.user) return { error: "לא מחובר" };
  const canEdit =
    session.user.role === "super_admin" ||
    (session.user.role === "hq_commander" && session.user.id === listenerUserId);
  if (!canEdit) return { error: "אין הרשאה" };

  await db
    .delete(requestApprovalListeners)
    .where(
      and(
        eq(requestApprovalListeners.id, listenerId),
        eq(requestApprovalListeners.listenerUserId, listenerUserId)
      )
    );

  revalidatePath(`/super-admin/users/${listenerUserId}`);
  return { success: true };
}

export async function toggleApprovalListenerEmail(listenerId: string, listenerUserId: string, receiveEmail: boolean) {
  const session = await auth();
  if (!session?.user) return { error: "לא מחובר" };
  const canEdit =
    session.user.role === "super_admin" ||
    (session.user.role === "hq_commander" && session.user.id === listenerUserId);
  if (!canEdit) return { error: "אין הרשאה" };

  await db
    .update(requestApprovalListeners)
    .set({ receiveEmail: !receiveEmail })
    .where(
      and(
        eq(requestApprovalListeners.id, listenerId),
        eq(requestApprovalListeners.listenerUserId, listenerUserId)
      )
    );

  revalidatePath(`/super-admin/users/${listenerUserId}`);
  return { success: true };
}
