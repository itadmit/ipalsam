import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Car, Plus, ArrowRight } from "lucide-react";
import { db } from "@/db";
import { departments, vehicles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatDate } from "@/lib/utils";
import { VEHICLE_TYPES_MAP, isVehicleDepartment } from "@/lib/vehicle-constants";

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
                <Link
                  key={v.id}
                  href={`/dashboard/vehicles/${v.id}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Car className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">מס׳ רכב: {v.vehicleNumber}</p>
                      <p className="text-sm text-slate-500">
                        {VEHICLE_TYPES_MAP[v.vehicleType] || v.vehicleType}
                        {v.vehicleTypeOther && ` (${v.vehicleTypeOther})`} • {v.fitness}
                        {v.fitnessOther && ` (${v.fitnessOther})`}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        קילומטראז: {v.kilometerage.toLocaleString()} • טיפול אחרון: {formatDate(v.lastServiceDate) || "-"}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
