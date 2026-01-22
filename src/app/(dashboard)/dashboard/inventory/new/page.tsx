import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { NewItemForm } from "./new-item-form";
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

export default async function NewInventoryItemPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Only admins and dept commanders can add items
  if (session.user.role === "soldier") {
    redirect("/dashboard");
  }

  const departmentsList = await getDepartments();
  const categoriesByDepartment = await getCategoriesByDepartment();

  return (
    <div>
      <PageHeader
        title="הוספת פריט חדש"
        description="הוסף סוג ציוד חדש למלאי"
        actions={
          <Link href="/dashboard/inventory">
            <Button variant="outline">
              <ArrowRight className="w-4 h-4" />
              חזרה לרשימה
            </Button>
          </Link>
        }
      />

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <NewItemForm
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
