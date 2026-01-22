import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { NewRequestForm } from "./new-request-form";
import { db } from "@/db";
import { departments, itemTypes } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function NewRequestPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const departmentsList = await db.query.departments.findMany({
    where: eq(departments.isActive, true),
    columns: { id: true, name: true },
    orderBy: (departments, { asc }) => [asc(departments.name)],
  });

  const allItems = await db.query.itemTypes.findMany({
    where: eq(itemTypes.isActive, true),
    columns: { id: true, name: true, departmentId: true, quantityAvailable: true },
  });

  const itemsByDepartment: Record<string, { id: string; name: string; available: number }[]> = {};
  for (const item of allItems) {
    if (!itemsByDepartment[item.departmentId]) {
      itemsByDepartment[item.departmentId] = [];
    }
    itemsByDepartment[item.departmentId].push({
      id: item.id,
      name: item.name,
      available: item.quantityAvailable || 0,
    });
  }

  return (
    <div>
      <PageHeader title="בקשה חדשה" description="הגשת בקשה להשאלת ציוד" />

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <NewRequestForm
            departments={departmentsList}
            itemsByDepartment={itemsByDepartment}
          />
        </CardContent>
      </Card>
    </div>
  );
}
