"use server";

import { db } from "@/db";
import { users, auditLogs, soldierDepartments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { CreateUserFormData } from "@/types";

export async function createUser(data: CreateUserFormData) {
  const session = await auth();

  if (
    !session?.user ||
    (session.user.role !== "super_admin" && session.user.role !== "hq_commander")
  ) {
    return { error: "אין הרשאה" };
  }

  // Check if phone exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.phone, data.phone),
  });

  if (existingUser) {
    return { error: "מספר טלפון כבר קיים במערכת" };
  }

  // Hash password (default: phone number)
  const hashedPassword = await hash(data.phone, 12);

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      phone: data.phone,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      role: data.role,
      departmentId: data.departmentId || null,
      baseId: data.baseId || null,
      mustChangePassword: true,
    })
    .returning();

  // Log action
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "create_user",
    entityType: "user",
    entityId: newUser.id,
    newValues: {
      phone: data.phone,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
    },
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/super-admin/users");

  return { success: true, user: newUser };
}

export async function updateUser(
  userId: string,
  data: Partial<CreateUserFormData>
) {
  const session = await auth();

  if (
    !session?.user ||
    (session.user.role !== "super_admin" && session.user.role !== "hq_commander")
  ) {
    return { error: "אין הרשאה" };
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!existingUser) {
    return { error: "משתמש לא נמצא" };
  }

  // Check if changing phone and it already exists
  if (data.phone && data.phone !== existingUser.phone) {
    const phoneExists = await db.query.users.findFirst({
      where: eq(users.phone, data.phone),
    });
    if (phoneExists) {
      return { error: "מספר טלפון כבר קיים במערכת" };
    }
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.phone) updateData.phone = data.phone;
  if (data.firstName) updateData.firstName = data.firstName;
  if (data.lastName) updateData.lastName = data.lastName;
  if (data.email !== undefined) updateData.email = data.email || null;
  if (data.role) updateData.role = data.role;
  if (data.departmentId !== undefined)
    updateData.departmentId = data.departmentId || null;
  if (data.baseId !== undefined) updateData.baseId = data.baseId || null;
  if (data.barcode !== undefined) updateData.barcode = data.barcode || null;

  await db.update(users).set(updateData).where(eq(users.id, userId));

  if (data.soldierDepartmentIds && Array.isArray(data.soldierDepartmentIds)) {
    await db.delete(soldierDepartments).where(eq(soldierDepartments.userId, userId));
    for (const deptId of data.soldierDepartmentIds) {
      if (deptId) {
        await db.insert(soldierDepartments).values({
          userId,
          departmentId: deptId,
        });
      }
    }
  }

  // Log action
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "update_user",
    entityType: "user",
    entityId: userId,
    oldValues: {
      phone: existingUser.phone,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      role: existingUser.role,
    },
    newValues: data,
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/super-admin/users");

  return { success: true };
}

export async function toggleUserStatus(userId: string) {
  const session = await auth();

  if (!session?.user || session.user.role !== "super_admin") {
    return { error: "אין הרשאה" };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return { error: "משתמש לא נמצא" };
  }

  await db
    .update(users)
    .set({
      isActive: !user.isActive,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Log action
  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: user.isActive ? "deactivate_user" : "activate_user",
    entityType: "user",
    entityId: userId,
  });

  revalidatePath("/dashboard/users");
  revalidatePath("/super-admin/users");

  return { success: true, isActive: !user.isActive };
}

