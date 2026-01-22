import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { DepartmentSettingsForm } from "./settings-form";

async function getDepartment(id: string) {
  // TODO: Fetch from DB
  const departments: Record<string, {
    id: string;
    name: string;
    description: string;
    operatingHoursStart: string;
    operatingHoursEnd: string;
    allowImmediate: boolean;
    allowScheduled: boolean;
  }> = {
    "1": {
      id: "1",
      name: "קשר",
      description: "ציוד תקשורת ומכשירי קשר",
      operatingHoursStart: "08:00",
      operatingHoursEnd: "17:00",
      allowImmediate: true,
      allowScheduled: true,
    },
  };
  return departments[id] || null;
}

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

  const department = await getDepartment(id);

  if (!department) {
    notFound();
  }

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
          <DepartmentSettingsForm department={department} />
        </CardContent>
      </Card>
    </div>
  );
}

