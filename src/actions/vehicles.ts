"use server";

import { db } from "@/db";
import { vehicles, vehicleKilometerageHistory, accidentReports, vehicleDrivers, driverLicenses, fuelCards } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function canAccessVehicleDepartment(
  session: { user: { role?: string; departmentId?: string | null } },
  departmentId: string
): boolean {
  const isAdmin = session.user.role === "super_admin" || session.user.role === "hq_commander";
  const isVehicleDept =
    session.user.role === "dept_commander" && session.user.departmentId != null && session.user.departmentId === departmentId;
  return isAdmin || isVehicleDept;
}

export async function createVehicle(data: {
  departmentId: string;
  vehicleNumber: string;
  vehicleType: string;
  vehicleTypeOther?: string;
  fitness: string;
  fitnessOther?: string;
  kilometerage?: number;
  lastServiceDate?: string;
  fuelCode?: string;
  fuelType?: string;
}) {
  const session = await auth();
  if (!session?.user) return { error: "לא מחובר" };

  const [v] = await db
    .insert(vehicles)
    .values({
      departmentId: data.departmentId,
      vehicleNumber: data.vehicleNumber.trim(),
      vehicleType: data.vehicleType,
      vehicleTypeOther: data.vehicleTypeOther?.trim() || null,
      fitness: data.fitness,
      fitnessOther: data.fitnessOther?.trim() || null,
      kilometerage: data.kilometerage ?? 0,
      lastServiceDate: data.lastServiceDate ? new Date(data.lastServiceDate) : null,
      fuelCode: data.fuelCode?.trim() || null,
      fuelType: data.fuelType?.trim() || null,
    })
    .returning();

  revalidatePath("/dashboard/vehicles");
  revalidatePath(`/dashboard/vehicles/list`);
  return { success: true, id: v.id };
}

export async function updateVehicle(
  id: string,
  data: Partial<{
    vehicleNumber: string;
    vehicleType: string;
    vehicleTypeOther: string;
    fitness: string;
    fitnessOther: string;
    lastServiceDate: string;
    fuelCode: string;
    fuelType: string;
    licenseUrl: string;
  }>
) {
  const session = await auth();
  if (!session?.user) return { error: "לא מחובר" };

  await db
    .update(vehicles)
    .set({
      ...data,
      vehicleTypeOther: data.vehicleTypeOther?.trim() || null,
      fitnessOther: data.fitnessOther?.trim() || null,
      lastServiceDate: data.lastServiceDate ? new Date(data.lastServiceDate) : undefined,
      fuelCode: data.fuelCode?.trim() || null,
      fuelType: data.fuelType?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(vehicles.id, id));

  revalidatePath("/dashboard/vehicles");
  revalidatePath(`/dashboard/vehicles/${id}`);
  revalidatePath("/dashboard/vehicles/list");
  return { success: true };
}

export async function updateVehicleKilometerage(vehicleId: string, newKm: number) {
  const session = await auth();
  if (!session?.user) return { error: "לא מחובר" };

  const vehicle = await db.query.vehicles.findFirst({
    where: eq(vehicles.id, vehicleId),
    columns: { kilometerage: true },
  });
  if (!vehicle) return { error: "רכב לא נמצא" };

  const previousKm = vehicle.kilometerage;

  await db
    .update(vehicles)
    .set({ kilometerage: newKm, updatedAt: new Date() })
    .where(eq(vehicles.id, vehicleId));

  await db.insert(vehicleKilometerageHistory).values({
    vehicleId,
    previousKm,
    newKm,
    updatedById: session.user.id,
  });

  revalidatePath(`/dashboard/vehicles/${vehicleId}`);
  return { success: true };
}

export async function submitAccidentReport(data: {
  departmentId: string;
  reporterName: string;
  reporterPhone: string;
  reporterEmail?: string;
  vehicleNumber: string;
  vehicleClassification?: string;
  description: string;
}) {
  const session = await auth();
  if (!session?.user) return { error: "לא מחובר" };

  await db.insert(accidentReports).values({
    departmentId: data.departmentId,
    reporterName: data.reporterName.trim(),
    reporterPhone: data.reporterPhone.trim(),
    reporterEmail: data.reporterEmail?.trim() || null,
    vehicleNumber: data.vehicleNumber.trim(),
    vehicleClassification: data.vehicleClassification?.trim() || null,
    description: data.description.trim(),
  });

  revalidatePath("/dashboard/vehicles/accidents");
  return { success: true };
}

export async function createFuelCard(data: {
  departmentId: string;
  cardNumber: string;
  initialAmount: number;
}) {
  const session = await auth();
  if (!session?.user) return { error: "לא מחובר" };
  if (!canAccessVehicleDepartment(session, data.departmentId)) return { error: "אין הרשאה" };

  const existing = await db.query.fuelCards.findFirst({
    where: and(eq(fuelCards.departmentId, data.departmentId), eq(fuelCards.cardNumber, data.cardNumber.trim())),
  });
  if (existing) return { error: "מספר כרטיס כבר קיים במחלקה זו" };

  const [card] = await db
    .insert(fuelCards)
    .values({
      departmentId: data.departmentId,
      cardNumber: data.cardNumber.trim(),
      initialAmount: data.initialAmount,
      balance: data.initialAmount,
    })
    .returning();

  revalidatePath("/dashboard/vehicles/fuel-cards");
  return { success: true, id: card.id };
}

export async function updateFuelCard(id: string, data: { cardNumber?: string; balance?: number }) {
  const session = await auth();
  if (!session?.user) return { error: "לא מחובר" };

  const card = await db.query.fuelCards.findFirst({ where: eq(fuelCards.id, id) });
  if (!card) return { error: "כרטיס לא נמצא" };
  if (!canAccessVehicleDepartment(session, card.departmentId)) return { error: "אין הרשאה" };

  await db
    .update(fuelCards)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(fuelCards.id, id));

  revalidatePath("/dashboard/vehicles/fuel-cards");
  revalidatePath(`/dashboard/vehicles/fuel-cards/${id}`);
  return { success: true };
}

export async function deleteFuelCard(id: string) {
  const session = await auth();
  if (!session?.user) return { error: "לא מחובר" };

  const card = await db.query.fuelCards.findFirst({ where: eq(fuelCards.id, id) });
  if (!card) return { error: "כרטיס לא נמצא" };
  if (!canAccessVehicleDepartment(session, card.departmentId)) return { error: "אין הרשאה" };

  await db.delete(fuelCards).where(eq(fuelCards.id, id));
  revalidatePath("/dashboard/vehicles/fuel-cards");
  revalidatePath(`/dashboard/vehicles/fuel-cards/${id}`);
  return { success: true };
}
