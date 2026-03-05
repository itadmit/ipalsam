import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Users, Plus, ArrowRight } from "lucide-react";
import { db } from "@/db";
import { departments, vehicleDrivers } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function DriversPage({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { dept } = await searchParams;
  if (!dept) redirect("/dashboard/vehicles");

  const isAdmin = session.user.role === "super_admin" || session.user.role === "hq_commander";
  const isVehicleDept = session.user.role === "dept_commander" && session.user.departmentId === dept;

  if (!isAdmin && !isVehicleDept) redirect("/dashboard/vehicles");

  const department = await db.query.departments.findFirst({
    where: eq(departments.id, dept),
    columns: { id: true, name: true, departmentType: true },
  });

  if (!department || department.departmentType !== "vehicles") {
    redirect("/dashboard/vehicles");
  }

  const drivers = await db.query.vehicleDrivers.findMany({
    where: eq(vehicleDrivers.departmentId, dept),
    with: { licenses: true },
    orderBy: (d, { asc }) => [asc(d.name)],
  });

  return (
    <div>
      <PageHeader
        title="נהגים"
        description={department.name}
        actions={
          <Link href={`/dashboard/vehicles/drivers/new?dept=${dept}`}>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              נהג חדש
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-4">
          {drivers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="אין נהגים"
              description="הוסף נהג חדש להתחלה"
              action={
                <Link href={`/dashboard/vehicles/drivers/new?dept=${dept}`}>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    נהג חדש
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {drivers.map((d) => (
                <Link
                  key={d.id}
                  href={`/dashboard/vehicles/drivers/${d.id}?dept=${dept}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-emerald-200 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{d.name}</p>
                      <p className="text-sm text-slate-500">
                        {d.phone || "-"} {d.email && `• ${d.email}`}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {d.licenses?.length || 0} רישיונות/הסמכות
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
