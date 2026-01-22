import { auth, canAccessSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Boxes } from "lucide-react";
import type { SessionUser } from "@/types";
import { AddCategoryButton, CategoryRowActions, AddCategoryToDeptButton } from "./category-actions";

async function getDepartments() {
  // TODO: Fetch from DB
  return [
    { id: "1", name: "קשר" },
    { id: "2", name: "נשק" },
    { id: "3", name: "לוגיסטיקה" },
    { id: "4", name: "אפסנאות" },
  ];
}

async function getCategoriesByDepartment() {
  // TODO: Fetch from DB
  return [
    {
      departmentId: "1",
      departmentName: "קשר",
      categories: [
        { id: "1", name: "מכשירי קשר", itemCount: 3 },
        { id: "2", name: "אנטנות", itemCount: 2 },
        { id: "3", name: "אביזרי קשר", itemCount: 4 },
      ],
    },
    {
      departmentId: "2",
      departmentName: "נשק",
      categories: [
        { id: "4", name: "נשק קל", itemCount: 5 },
        { id: "5", name: "תחמושת", itemCount: 3 },
      ],
    },
    {
      departmentId: "3",
      departmentName: "לוגיסטיקה",
      categories: [
        { id: "6", name: "מחשוב", itemCount: 4 },
        { id: "7", name: "ציוד משרדי", itemCount: 2 },
      ],
    },
    {
      departmentId: "4",
      departmentName: "אפסנאות",
      categories: [
        { id: "8", name: "סוללות ומצברים", itemCount: 3 },
        { id: "9", name: "חומרי ניקיון", itemCount: 5 },
      ],
    },
  ];
}

export default async function CategoriesPage() {
  const session = await auth();

  if (!session?.user || !canAccessSuperAdmin(session.user.role as SessionUser["role"])) {
    redirect("/dashboard");
  }

  const departments = await getDepartments();
  const departmentCategories = await getCategoriesByDepartment();

  return (
    <div>
      <PageHeader
        title="ניהול קטגוריות"
        description="הגדרת קטגוריות ציוד לפי מחלקות"
        actions={<AddCategoryButton departments={departments} />}
      />

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
                <AddCategoryToDeptButton
                  departmentId={dept.departmentId}
                  departmentName={dept.departmentName}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
