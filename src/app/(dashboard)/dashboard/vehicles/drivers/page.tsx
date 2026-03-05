import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Users } from "lucide-react";
import { db } from "@/db";
import { departments } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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

  return (
    <div>
      <PageHeader
        title="נהגים"
        description="רישיונות והסמכות – בפיתוח"
      />

      <Card>
        <CardContent className="p-8">
          <EmptyState
            icon={Users}
            title="בקרוב"
            description="ניהול נהגים, רישיונות והסמכות – בפיתוח"
          />
        </CardContent>
      </Card>
    </div>
  );
}
