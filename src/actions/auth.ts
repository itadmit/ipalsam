"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { createImpersonateToken } from "@/lib/request-token";
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

  // Verify current password (support both 0527036966 and 527036966 formats)
  const normalizedInput = currentPassword.replace(/\D/g, "");
  const withLeadingZero = normalizedInput.length === 9 ? `0${normalizedInput}` : normalizedInput;
  const withoutLeadingZero = normalizedInput.replace(/^0+/, "") || normalizedInput;

  const isValid =
    (await compare(currentPassword, user.password)) ||
    (await compare(withLeadingZero, user.password)) ||
    (await compare(withoutLeadingZero, user.password));
  if (!isValid) {
    return { error: "סיסמה נוכחית שגויה. הזן את מספר הטלפון שלך (כמו בהתחברות)" };
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

  if (!session?.user || session.user.role !== "super_admin") {
    return { error: "רק סופר אדמין יכול לאפס סיסמה" };
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
  revalidatePath(`/super-admin/users/${userId}`);

  return { success: true };
}

/** יוצר טוקן להתחברות כמשתמש – ללא איפוס סיסמה. רק סופר אדמין. */
export async function prepareImpersonate(userId: string) {
  const session = await auth();

  if (!session?.user || session.user.role !== "super_admin") {
    return { error: "אין הרשאה" };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { id: true, isActive: true },
  });

  if (!user || !user.isActive) {
    return { error: "משתמש לא נמצא או לא פעיל" };
  }

  const token = await createImpersonateToken(userId);
  return { success: true, impersonateToken: token };
}

