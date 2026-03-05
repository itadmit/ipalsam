import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, FileWarning, Users, CreditCard, Plus } from "lucide-react";
import { db } from "@/db";
import { departments, vehicles } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { isVehicleDepartment } from "@/lib/vehicle-constants";

export default async function VehiclesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "super_admin" || session.user.role === "hq_commander";
  const isVehicleDept = session.user.role === "dept_commander" && session.user.departmentId;

  let vehicleDeptId: string | null = null;
  if (isAdmin) {
    const vehicleDept = await db.query.departments.findFirst({
      where: and(eq(departments.departmentType, "vehicles"), eq(departments.isActive, true)),
      columns: { id: true },
    });
    vehicleDeptId = vehicleDept?.id ?? null;
  } else if (isVehicleDept) {
    const dept = await db.query.departments.findFirst({
      where: eq(departments.id, session.user.departmentId!),
      columns: { id: true, departmentType: true, name: true },
    });
    vehicleDeptId = dept && isVehicleDepartment(dept) ? dept.id : null;
  }

  if (!vehicleDeptId) {
    redirect("/dashboard");
  }

  const [vehiclesRes] = await db
    .select({ count: count() })
    .from(vehicles)
    .where(eq(vehicles.departmentId, vehicleDeptId));

  return (
    <div>
      <PageHeader
        title="מחלקת רכב"
        description="ניהול רכבים, דוחות תאונות, נהגים וכרטיסי דלק"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href={`/dashboard/vehicles/list?dept=${vehicleDeptId}`}>
          <Card className="hover:border-emerald-200 hover:bg-slate-50/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Car className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">הרכבים שלי</h3>
                  <p className="text-sm text-slate-500">
                    {vehiclesRes?.count ?? 0} רכבים
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-3">
                צפייה, הוספה ועריכת כרטיסי רכבים
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/dashboard/vehicles/accidents?dept=${vehicleDeptId}`}>
          <Card className="hover:border-emerald-200 hover:bg-slate-50/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <FileWarning className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">דוחות תאונות</h3>
                  <p className="text-sm text-slate-500">צפייה בדוחות</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-3">
                דוחות תאונות שדווחו למערכת
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/dashboard/vehicles/drivers?dept=${vehicleDeptId}`}>
          <Card className="hover:border-emerald-200 hover:bg-slate-50/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">נהגים</h3>
                  <p className="text-sm text-slate-500">רישיונות והסמכות</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-3">
                ניהול נהגים, רישיונות והסמכות
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/dashboard/vehicles/fuel-cards?dept=${vehicleDeptId}`}>
          <Card className="hover:border-emerald-200 hover:bg-slate-50/50 transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">כרטיסי דלק</h3>
                  <p className="text-sm text-slate-500">ניהול כרטיסים</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-3">
                הוספה, עריכה ומחיקה של כרטיסי דלק
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-8">
        <Link href={`/dashboard/vehicles/report-accident?dept=${vehicleDeptId}`}>
          <Button variant="outline" className="gap-2">
            <FileWarning className="w-4 h-4" />
            דווח על תאונה
          </Button>
        </Link>
      </div>
    </div>
  );
}
