"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export interface ProfileNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  readAt: Date | null;
  createdAt: Date;
}

export async function getProfileNotifications(): Promise<ProfileNotification[]> {
  const session = await auth();
  if (!session?.user?.id) return [] as ProfileNotification[];

  const rows = await db.query.notifications.findMany({
    where: eq(notifications.userId, session.user.id),
    columns: { id: true, type: true, title: true, body: true, readAt: true, createdAt: true },
    orderBy: [desc(notifications.createdAt)],
    limit: 20,
  });

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    body: r.body,
    readAt: r.readAt,
    createdAt: r.createdAt,
  }));
}

export async function getUnreadNotificationCount(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) return 0;

  const rows = await db.query.notifications.findMany({
    where: eq(notifications.userId, session.user.id),
    columns: { id: true, readAt: true },
  });
  return rows.filter((r) => !r.readAt).length;
}

export async function markNotificationRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "יש להתחבר" };

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(eq(notifications.id, id));

  return { success: true };
}

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user?.id) return { error: "יש להתחבר" };

  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(eq(notifications.userId, session.user.id));

  return { success: true };
}
