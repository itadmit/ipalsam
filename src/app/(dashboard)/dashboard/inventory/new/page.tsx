import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { NewItemForm } from "./new-item-form";

async function getDepartments() {
  // TODO: Fetch from DB
  return [
    { id: "1", name: "קשר" },
    { id: "2", name: "נשק" },
    { id: "3", name: "לוגיסטיקה" },
    { id: "4", name: "אפסנאות" },
    { id: "5", name: "רכב" },
    { id: "6", name: "שלישות" },
  ];
}

async function getCategoriesByDepartment() {
  // TODO: Fetch from DB
  return {
    "1": [
      { id: "1", name: "מכשירי קשר" },
      { id: "2", name: "אנטנות" },
      { id: "3", name: "אביזרי קשר" },
    ],
    "2": [
      { id: "4", name: "נשק קל" },
      { id: "5", name: "תחמושת" },
    ],
    "3": [
      { id: "6", name: "מחשוב" },
      { id: "7", name: "ציוד משרדי" },
    ],
    "4": [
      { id: "8", name: "סוללות ומצברים" },
      { id: "9", name: "חומרי ניקיון" },
    ],
    "5": [],
    "6": [],
  };
}

export default async function NewInventoryItemPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Only admins and dept commanders can add items
  if (session.user.role === "soldier") {
    redirect("/dashboard");
  }

  const departments = await getDepartments();
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
            departments={departments}
            categoriesByDepartment={categoriesByDepartment}
            userDepartmentId={session.user.departmentId}
            userRole={session.user.role}
          />
        </CardContent>
      </Card>
    </div>
  );
}

