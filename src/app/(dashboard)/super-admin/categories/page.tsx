import { auth, canAccessSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Boxes } from "lucide-react";
import type { SessionUser } from "@/types";
import { AddCategoryButton, CategoryRowActions, AddCategoryToDeptButton } from "./category-actions";
import { db } from "@/db";
import { departments, categories, itemTypes } from "@/db/schema";
import { eq, count } from "drizzle-orm";

export default async function CategoriesPage() {
  const session = await auth();

  if (!session?.user || !canAccessSuperAdmin(session.user.role as SessionUser["role"])) {
    redirect("/dashboard");
  }

  // Get all departments with their categories
  const depts = await db.query.departments.findMany({
    where: eq(departments.isActive, true),
    columns: { id: true, name: true },
    orderBy: (departments, { asc }) => [asc(departments.name)],
  });

  const cats = await db.query.categories.findMany({
    where: eq(categories.isActive, true),
  });

  // Get item counts per category
  const itemCounts: Record<string, number> = {};
  const items = await db.query.itemTypes.findMany({
    columns: { categoryId: true },
  });
  for (const item of items) {
    if (item.categoryId) {
      itemCounts[item.categoryId] = (itemCounts[item.categoryId] || 0) + 1;
    }
  }

  // Group categories by department
  const departmentCategories = depts.map((dept) => ({
    departmentId: dept.id,
    departmentName: dept.name,
    categories: cats
      .filter((cat) => cat.departmentId === dept.id)
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        itemCount: itemCounts[cat.id] || 0,
      })),
  }));

  return (
    <div>
      <PageHeader
        title="ניהול קטגוריות"
        description="הגדרת קטגוריות ציוד לפי מחלקות"
        actions={<AddCategoryButton departments={depts} />}
      />

      {depts.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="אין מחלקות"
          description="צור מחלקות תחילה כדי להוסיף קטגוריות"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {departmentCategories.map((dept) => (
            <Card key={dept.departmentId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Boxes className="w-5 h-5" />
                  {dept.departmentName}
                  <Badge variant="secondary">{dept.categories.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dept.categories.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    אין קטגוריות במחלקה זו
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dept.categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-slate-500">
                            {category.itemCount} סוגי ציוד
                          </p>
                        </div>
                        <CategoryRowActions
                          category={category}
                          departmentName={dept.departmentName}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <AddCategoryToDeptButton
                  departmentId={dept.departmentId}
                  departmentName={dept.departmentName}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
