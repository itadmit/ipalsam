import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { VehicleEditForm } from "./vehicle-edit-form";
import { VEHICLE_TYPES, FITNESS_OPTIONS } from "@/lib/vehicle-constants";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) notFound();

  const { id } = await params;

  const vehicle = await db.query.vehicles.findFirst({
    where: eq(vehicles.id, id),
    with: { department: { columns: { id: true, name: true } } },
  });

  if (!vehicle) notFound();

  const isAdmin = session.user.role === "super_admin" || session.user.role === "hq_commander";
  const isVehicleDept = session.user.role === "dept_commander" && session.user.departmentId === vehicle.departmentId;
  if (!isAdmin && !isVehicleDept) notFound();

  return (
    <div>
      <PageHeader
        title={`עריכת רכב ${vehicle.vehicleNumber}`}
        description={vehicle.department?.name}
        actions={
          <Link href={`/dashboard/vehicles/${id}`}>
            <Button variant="outline" className="gap-2">
              <ArrowRight className="w-4 h-4" />
              חזרה לרכב
            </Button>
          </Link>
        }
      />

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <VehicleEditForm
            vehicleId={id}
            vehicleTypes={VEHICLE_TYPES}
            fitnessOptions={FITNESS_OPTIONS}
            initialData={{
              vehicleNumber: vehicle.vehicleNumber,
              vehicleType: vehicle.vehicleType,
              vehicleTypeOther: vehicle.vehicleTypeOther || "",
              fitness: vehicle.fitness,
              fitnessOther: vehicle.fitnessOther || "",
              lastServiceDate: vehicle.lastServiceDate?.toISOString().slice(0, 10) || "",
              fuelCode: vehicle.fuelCode || "",
              fuelType: vehicle.fuelType || "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
