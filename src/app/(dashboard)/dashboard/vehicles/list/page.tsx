import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Car, Plus } from "lucide-react";
import { db } from "@/db";
import { departments, vehicles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isVehicleDepartment } from "@/lib/vehicle-constants";
import { VehicleListItem } from "./vehicle-list-item";

export default async function VehiclesListPage({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { dept } = await searchParams;
  if (!dept) redirect("/dashboard/vehicles");

  const isAdmin = session.user.role === "super_admin" || session.user.role === "hq_commander";
  const isVehicleDept = (session.user.role === "dept_commander" || session.user.role === "soldier") && session.user.departmentId === dept;

  if (!isAdmin && !isVehicleDept) redirect("/dashboard/vehicles");

  const department = await db.query.departments.findFirst({
    where: eq(departments.id, dept),
    columns: { id: true, name: true, departmentType: true },
  });

  if (!department || !isVehicleDepartment(department)) {
    redirect("/dashboard/vehicles");
  }

  const vehiclesList = await db.query.vehicles.findMany({
    where: eq(vehicles.departmentId, dept),
    orderBy: (v, { asc }) => [asc(v.vehicleNumber)],
  });

  return (
    <div>
      <PageHeader
        title="הרכבים שלי"
        description={department.name}
        actions={
          <Link href={`/dashboard/vehicles/new?dept=${dept}`}>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              רכב חדש
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-4">
          {vehiclesList.length === 0 ? (
            <EmptyState
              icon={Car}
              title="אין רכבים"
              description="הוסף רכב חדש להתחלה"
              action={
                <Link href={`/dashboard/vehicles/new?dept=${dept}`}>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    רכב חדש
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {vehiclesList.map((v) => (
                <VehicleListItem
                  key={v.id}
                  id={v.id}
                  vehicleNumber={v.vehicleNumber}
                  vehicleType={v.vehicleType}
                  vehicleTypeOther={v.vehicleTypeOther}
                  fitness={v.fitness}
                  fitnessOther={v.fitnessOther}
                  kilometerage={v.kilometerage}
                  lastServiceDate={v.lastServiceDate}
                  departmentId={v.departmentId}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
