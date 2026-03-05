import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Pencil, Plus, FileText, Trash2 } from "lucide-react";
import { db } from "@/db";
import { vehicleDrivers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatDate } from "@/lib/utils";
import { LicenseList } from "./license-list";
import { AddLicenseForm } from "./add-license-form";
import { DriverEditForm } from "./driver-edit-form";

export default async function DriverDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ dept?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const { dept } = await searchParams;
  if (!dept) redirect("/dashboard/vehicles");

  const isAdmin = session.user.role === "super_admin" || session.user.role === "hq_commander";
  const isVehicleDept = (session.user.role === "dept_commander" || session.user.role === "soldier") && session.user.departmentId === dept;
  if (!isAdmin && !isVehicleDept) redirect("/dashboard/vehicles");

  const driver = await db.query.vehicleDrivers.findFirst({
    where: eq(vehicleDrivers.id, id),
    with: { department: { columns: { id: true, name: true } }, licenses: true },
  });

  if (!driver || driver.departmentId !== dept) notFound();

  return (
    <div>
      <PageHeader
        title={driver.name}
        description={driver.department?.name}
        actions={
          <Link href={`/dashboard/vehicles/drivers?dept=${dept}`}>
            <Button variant="outline" className="gap-2">
              חזרה לרשימה
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              פרטי נהג
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DriverEditForm
              driverId={id}
              departmentId={dept}
              initialData={{
                name: driver.name,
                phone: driver.phone || "",
                email: driver.email || "",
                notes: driver.notes || "",
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              רישיונות והסמכות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddLicenseForm driverId={id} />
            <LicenseList driverId={id} licenses={driver.licenses} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
