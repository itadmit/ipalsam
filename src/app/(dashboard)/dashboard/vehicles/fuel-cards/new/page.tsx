import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { db } from "@/db";
import { departments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isVehicleDepartment } from "@/lib/vehicle-constants";
import { FuelCardForm } from "./fuel-card-form";

export default async function NewFuelCardPage({
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

  return (
    <div>
      <PageHeader
        title="כרטיס דלק חדש"
        description={department.name}
        actions={
          <Link href={`/dashboard/vehicles/fuel-cards?dept=${dept}`}>
            <Button variant="outline" className="gap-2">
              <ArrowRight className="w-4 h-4" />
              חזרה
            </Button>
          </Link>
        }
      />

      <Card className="max-w-md">
        <CardContent className="p-6">
          <FuelCardForm departmentId={dept} />
        </CardContent>
      </Card>
    </div>
  );
}
