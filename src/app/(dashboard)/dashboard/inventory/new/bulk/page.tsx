import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileSpreadsheet } from "lucide-react";
import { BulkItemForm } from "./bulk-item-form";
import { db } from "@/db";
import { departments, categories } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getDepartments() {
  return await db.query.departments.findMany({
    where: eq(departments.isActive, true),
    columns: { id: true, name: true },
    orderBy: (departments, { asc }) => [asc(departments.name)],
  });
}

async function getCategoriesByDepartment() {
  const allCategories = await db.query.categories.findMany({
    where: eq(categories.isActive, true),
    columns: { id: true, name: true, departmentId: true },
  });

  const grouped: Record<string, { id: string; name: string }[]> = {};
  for (const cat of allCategories) {
    if (!grouped[cat.departmentId]) {
      grouped[cat.departmentId] = [];
    }
    grouped[cat.departmentId].push({ id: cat.id, name: cat.name });
  }
  return grouped;
}

export default async function BulkImportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role === "soldier") {
    redirect("/dashboard");
  }

  const departmentsList = await getDepartments();
  const categoriesByDepartment = await getCategoriesByDepartment();

  return (
    <div>
      <PageHeader
        title="קליטת פריטים בבאלק"
        description="הוסף מספר פריטים בבת אחת - מלא את הטבלה או הדבק מאקסל (עמודות מופרדות בטאב)"
        actions={
          <div className="flex gap-2">
            <Link href="/dashboard/inventory/new">
              <Button variant="outline">פריט בודד</Button>
            </Link>
            <Link href="/dashboard/inventory">
              <Button variant="outline">
                <ArrowRight className="w-4 h-4" />
                חזרה לרשימה
              </Button>
            </Link>
          </div>
        }
      />

      <Card className="max-w-6xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-slate-600 mb-4">
            <FileSpreadsheet className="w-5 h-5" />
            <p className="text-sm">
              פורמט הדבקה מאקסל: שם | מק״ט | סוג (כמותי/סריאלי) | כמות | התראה | ימי השאלה
            </p>
          </div>
          <BulkItemForm
            departments={departmentsList}
            categoriesByDepartment={categoriesByDepartment}
            userDepartmentId={session.user.departmentId}
            userRole={session.user.role}
          />
        </CardContent>
      </Card>
    </div>
  );
}
