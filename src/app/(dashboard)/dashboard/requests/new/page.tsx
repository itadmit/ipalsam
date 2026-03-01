import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { NewRequestForm } from "./new-request-form";
import { db } from "@/db";
import { departments, itemTypes, itemUnits, requests } from "@/db/schema";
import { eq, inArray, sql, desc, and } from "drizzle-orm";

export default async function NewRequestPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const departmentsList = await db.query.departments.findMany({
    where: eq(departments.isActive, true),
    columns: {
      id: true,
      name: true,
      allowImmediate: true,
      allowScheduled: true,
    },
    orderBy: (departments, { asc }) => [asc(departments.name)],
  });

  const allItems = await db.query.itemTypes.findMany({
    where: eq(itemTypes.isActive, true),
    columns: { id: true, name: true, departmentId: true, quantityAvailable: true, type: true },
  });

  const serialAvailableCounts = new Map<string, number>();
  const serialItemIds = allItems.filter((i) => i.type === "serial").map((i) => i.id);
  if (serialItemIds.length > 0) {
    const counts = await db
      .select({
        itemTypeId: itemUnits.itemTypeId,
        count: sql<number>`count(*)::int`,
      })
      .from(itemUnits)
      .where(
        and(
          inArray(itemUnits.itemTypeId, serialItemIds),
          eq(itemUnits.status, "available")
        )
      )
      .groupBy(itemUnits.itemTypeId);
    for (const row of counts) {
      serialAvailableCounts.set(row.itemTypeId, row.count);
    }
  }

  const itemsByDepartment: Record<string, { id: string; name: string; available: number }[]> = {};
  for (const item of allItems) {
    if (!itemsByDepartment[item.departmentId]) {
      itemsByDepartment[item.departmentId] = [];
    }
    const available =
      item.type === "serial"
        ? serialAvailableCounts.get(item.id) ?? 0
        : item.quantityAvailable ?? 0;
    itemsByDepartment[item.departmentId].push({
      id: item.id,
      name: item.name,
      available,
    });
  }

  // פריטים שהושאלו לאחרונה – עד 3 הצעות
  const recentLoansRaw = await db
    .select({
      itemTypeId: requests.itemTypeId,
      departmentId: requests.departmentId,
    })
    .from(requests)
    .where(inArray(requests.status, ["handed_over", "returned"]))
    .orderBy(
      desc(sql`COALESCE(${requests.returnedAt}, ${requests.handedOverAt}, ${requests.createdAt})`)
    )
    .limit(30);

  const seenItemIds = new Set<string>();
  const recentSuggestions: { itemTypeId: string; departmentId: string; name: string }[] = [];
  const itemNameMap = new Map(allItems.map((i) => [i.id, i.name]));
  for (const r of recentLoansRaw) {
    if (!seenItemIds.has(r.itemTypeId) && recentSuggestions.length < 3) {
      const name = itemNameMap.get(r.itemTypeId);
      if (name && itemsByDepartment[r.departmentId]?.some((i) => i.id === r.itemTypeId)) {
        seenItemIds.add(r.itemTypeId);
        recentSuggestions.push({
          itemTypeId: r.itemTypeId,
          departmentId: r.departmentId,
          name: name,
        });
      }
    }
  }

  // Map departments with operating hours (default 08:00-17:00)
  const departmentsWithHours = departmentsList.map((dept) => ({
    ...dept,
    operatingHoursStart: "08:00",
    operatingHoursEnd: "17:00",
  }));

  return (
    <div>
      <PageHeader title="השאלה חדשה" description="הגשת השאלה לציוד" />

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <NewRequestForm
            departments={departmentsWithHours}
            itemsByDepartment={itemsByDepartment}
            recentSuggestions={recentSuggestions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
