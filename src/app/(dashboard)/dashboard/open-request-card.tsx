import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plus } from "lucide-react";
import { db } from "@/db";
import { users, departments, soldierDepartments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { OpenRequestForm } from "./open-request-form";

interface OpenRequestCardProps {
  userId: string;
}

export async function OpenRequestCard({ userId }: OpenRequestCardProps) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { departmentId: true, role: true },
  });

  const deptIds: string[] = [];
  if (user?.departmentId) deptIds.push(user.departmentId);
  const soldierDepts = await db.query.soldierDepartments.findMany({
    where: eq(soldierDepartments.userId, userId),
    columns: { departmentId: true },
  });
  soldierDepts.forEach((d) => {
    if (d.departmentId && !deptIds.includes(d.departmentId)) deptIds.push(d.departmentId);
  });

  const departmentsList = deptIds.length > 0
    ? await db.query.departments.findMany({
        where: eq(departments.isActive, true),
        columns: { id: true, name: true },
      })
    : [];

  if (deptIds.length === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50/30">
        <CardContent className="py-6 text-center text-slate-500 text-sm">
          אין לך מחלקות משויכות. פנה למנהל כדי לקבל גישה ליצירת בקשות פתוחות.
        </CardContent>
      </Card>
    );
  }

  const availableDepts = departmentsList.filter((d) => deptIds.includes(d.id));
  if (availableDepts.length === 0) return null;

  const canCreate = user?.role === "soldier" || user?.role === "dept_commander";

  return (
    <Card className="border-amber-200 bg-amber-50/30">
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-800 text-base">
            <Package className="w-4 h-4" />
            בקשות פתוחות
          </CardTitle>
          {canCreate && (
            <OpenRequestForm
              departments={availableDepts}
              trigger={
                <Button size="sm" variant="outline" className="gap-1.5 h-8">
                  <Plus className="w-4 h-4" />
                  בקשה חדשה
                </Button>
              }
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <p className="text-sm text-slate-600">
          בקש ציוד מהספק כשאין במלאי. המבקש יקבל התראה ויוכל לאשר או לדחות כל פריט.
        </p>
      </CardContent>
    </Card>
  );
}
