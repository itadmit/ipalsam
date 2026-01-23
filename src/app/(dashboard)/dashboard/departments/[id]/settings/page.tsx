import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { DepartmentSettingsForm } from "./settings-form";
import { db } from "@/db";
import { departments } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function DepartmentSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  // Only admins and dept commanders can edit settings
  const canManage =
    session.user.role === "super_admin" ||
    session.user.role === "hq_commander" ||
    (session.user.role === "dept_commander" && session.user.departmentId === id);

  if (!canManage) {
    redirect("/dashboard");
  }

  const department = await db.query.departments.findFirst({
    where: eq(departments.id, id),
  });

  if (!department) {
    notFound();
  }

  const departmentData = {
    id: department.id,
    name: department.name,
    description: department.description || "",
    operatingHoursStart: "08:00", // TODO: Add to schema if needed
    operatingHoursEnd: "17:00",
    allowImmediate: department.allowImmediate,
    allowScheduled: department.allowScheduled,
  };

  return (
    <div>
      <PageHeader
        title={`הגדרות - ${department.name}`}
        description="ניהול הגדרות המחלקה"
        actions={
          <Link href={`/dashboard/departments/${id}`}>
            <Button variant="outline">
              <ArrowRight className="w-4 h-4" />
              חזרה למחלקה
            </Button>
          </Link>
        }
      />

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <DepartmentSettingsForm department={departmentData} />
        </CardContent>
      </Card>
    </div>
  );
}
