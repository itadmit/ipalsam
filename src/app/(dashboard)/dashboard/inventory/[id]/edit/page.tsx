import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { EditItemForm } from "./edit-item-form";
import { db } from "@/db";
import { itemTypes, categories, departments } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export default async function EditInventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const item = await db.query.itemTypes.findFirst({
    where: eq(itemTypes.id, id),
  });

  if (!item) {
    notFound();
  }

  const canManageAll =
    session.user.role === "super_admin" || session.user.role === "hq_commander";
  const categoriesList = canManageAll
    ? await db.query.categories.findMany({
        where: eq(categories.isActive, true),
        columns: { id: true, name: true, departmentId: true },
      })
    : await db.query.categories.findMany({
        where: and(
          eq(categories.departmentId, item.departmentId),
          eq(categories.isActive, true)
        ),
        columns: { id: true, name: true, departmentId: true },
      });

  const categoriesWithDept = await Promise.all(
    categoriesList.map(async (c) => {
      const dept = await db.query.departments.findFirst({
        where: eq(departments.id, c.departmentId),
        columns: { name: true },
      });
      return {
        ...c,
        departmentName: dept?.name || "",
      };
    })
  );

  const itemData = {
    id: item.id,
    name: item.name,
    catalogNumber: item.catalogNumber || "",
    categoryId: item.categoryId || "",
    departmentId: item.departmentId || "",
    type: item.type as "serial" | "quantity",
    description: item.description || "",
    notes: item.notes || "",
    minimumAlert: item.minimumAlert || 0,
    requiresDoubleApproval: item.requiresDoubleApproval,
    maxLoanDays: item.maxLoanDays,
    quantityTotal: item.quantityTotal ?? undefined,
    quantityAvailable: item.quantityAvailable ?? undefined,
    quantityInUse: item.quantityInUse ?? undefined,
  };

  return (
    <div>
      <PageHeader
        title={`עריכת ${item.name}`}
        description={`מק״ט: ${item.catalogNumber || "-"}`}
        actions={
          <Link href={`/dashboard/inventory/${id}`}>
            <Button variant="outline">
              <ArrowRight className="w-4 h-4" />
              חזרה לפריט
            </Button>
          </Link>
        }
      />

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <EditItemForm item={itemData} categories={categoriesWithDept} />
        </CardContent>
      </Card>
    </div>
  );
}
