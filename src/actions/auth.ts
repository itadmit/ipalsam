"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hash, compare } from "bcryptjs";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "לא מחובר" };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user) {
    return { error: "משתמש לא נמצא" };
  }

  // Verify current password
  const isValid = await compare(currentPassword, user.password);
  if (!isValid) {
    return { error: "סיסמה נוכחית שגויה" };
  }

  // Hash new password
  const hashedPassword = await hash(newPassword, 12);

  // Update password
  await db
    .update(users)
    .set({
      password: hashedPassword,
      mustChangePassword: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  revalidatePath("/");

  return { success: true };
}

export async function resetUserPassword(userId: string) {
  const session = await auth();

  if (
    !session?.user ||
    (session.user.role !== "super_admin" && session.user.role !== "hq_commander")
  ) {
    return { error: "אין הרשאה" };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return { error: "משתמש לא נמצא" };
  }

  // Reset password to phone number
  const hashedPassword = await hash(user.phone, 12);

  await db
    .update(users)
    .set({
      password: hashedPassword,
      mustChangePassword: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  revalidatePath("/super-admin/users");

  return { success: true };
}

